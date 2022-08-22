import {Directive, OnInit} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {IBaseItem} from 'communication';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {deepAssign, difference} from '../utils';
import {ItemComponent} from './item.component';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

export interface IErrorMessage {
  [error: string]: string | IErrorMessage;
}

export interface IFormRedirectsConfig {
  onCreate: boolean;
}

export interface IFormComponentConfig {
  autoSave: boolean;
  redirects: IFormRedirectsConfig | false;
  autoLoadData?: boolean;
}

const defaultFormComponentConfig: IFormComponentConfig = {
  autoSave: true,
  redirects: false,
  autoLoadData: true,
};

@UntilDestroy()
@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class FormComponent<T extends IBaseItem> extends ItemComponent<T> implements OnInit {
  form: FormGroup;
  errors: { [P in keyof T]?: string } = {};
  errorMessages: { [P in keyof T]?: IErrorMessage } = {};
  needCreate = true;
  patchFields = [];

  config: IFormComponentConfig = {
    ...defaultFormComponentConfig,
  };

  get autoSave() {
    return this.config.autoSave;
  }

  set autoSave(value: boolean) {
    this.config.autoSave = value;
  }

  get redirects() {
    return this.config.redirects;
  }

  set redirects(value: IFormRedirectsConfig | false) {
    this.config.redirects = value;
  }

  public valueChanged = false;

  get valid(): boolean {
    return this.form.valid;
  }

  get invalid(): boolean {
    return this.form.invalid;
  }

  get formValue(): Partial<T> {
    return this.form && this.form.value;
  }

  get controls(): { [key in keyof Partial<T>]: AbstractControl } {
    return this.form && this.form.controls as { [key in keyof Partial<T>]: AbstractControl };
  }

  ngOnInit() {
    const form = this.createForm();

    form.statusChanges.pipe(untilDestroyed(this)).subscribe(() => this._handleStatusChange(form));
    form.valueChanges.pipe(untilDestroyed(this)).subscribe(value => this.handleValueChange(value));

    this.form = form;
    this._handleStatusChange(form);

    if (this.config.autoLoadData)
      this.loadData();
  }

  getRawValue(): T {
    return this.form.getRawValue();
  }

  apply(e?: any) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    this._removeExtraSpaces();
    this._validateForm();

    if (this.form.invalid) {
      this.valueChanged = false;
      this._handleFormInvalidError();
      return;
    }

    const obj = this.getDto();

    if (this.needCreate)
      this.create(obj);
    else {
      const diff = difference(obj, this.item);
      this.update({...diff, id: this.item.id} as any, this.additionalQuery); // todo test
    }
  }

  getDto() {
    return {...this.item, ...this.getRawValue()};
  }

  get additionalQuery() {
    return {};
  }

  create(obj: T) {
    const hide = this._loadingHandler.showLoading();

    this._create(obj).pipe(untilDestroyed(this), finalize(hide)).subscribe(
      (res) => {
        this._handleCreateItem({...obj, ...res});
        this._handleSuccessCreate(res);
        this._makeUnchanged();
      },
      error => {
        this._handleErrorCreate(error);
        this._makeChanged();
      }
    );
  }

  update(obj: T, query?: any) {
    const hide = this._loadingHandler.showLoading();

    this._update(obj, query)
      .pipe(finalize(hide)).subscribe(
      (res) => {
        this._handleUpdateItems([{...obj, ...res}]);
        this._handleSuccessUpdate();
        this._makeUnchanged();
      },
      error => {
        this._handleUpdateError(error);
        this._makeChanged();
      }
    );
  }

  protected abstract createForm(): FormGroup;

  protected _handleCreateItem(item: T) {
    this.handleItem(item);
  }

  protected _removeExtraSpaces() {
    for (const key of Object.keys(this.form.value)) {
      if (typeof (this.form.value[key]) === 'string') {
        this.form.controls[key].setValue(this.form.value[key].trim(), {
          emitEvent: false
        });
        this.valueChanged = false;
      }
    }
  }

  protected _handleFormInvalidError() {
    const keysWithError = Object.keys(this.errors).filter(key => this.errors[key]);
    this._notifier.showError(this.errors[keysWithError[0]]);
  }

  protected _handleUpdateError(error: any) {
    this.setForm(this.item);
    this._handleErrorUpdate(error);
  }

  protected _create(obj: T): Observable<any> {
    return this.repository.createItem(obj);
  }

  protected _update(obj: T, query?: any): Observable<any> {
    return this.repository.updateItem(obj, query);
  }

  protected handleItem(item: T): void {
    super.handleItem(item);

    this.needCreate = !item || (item as any).id == null;

    if (item) {
      const autoSave = this.autoSave;
      this.autoSave = false;
      this.setForm(item, false);
      deepAssign(this.item, item);
      this.autoSave = autoSave;
    }

    // this.valueChanged = false;
  }

  protected setForm(item: T | any, emitEvent: boolean = true) {
    try {
      const controls = this.form.controls;

      for (const key in controls)
        if (controls.hasOwnProperty(key)) {
          const control = controls[key];

          if (item[key] !== undefined && control.value !== item[key])
            control.setValue(item[key], {emitEvent});
        }
    } catch (e) {
      console.error(e);
    }
  }

  protected _handleStatusChange(form: FormGroup) {
    const controls = form.controls;
    const errors = {};

    for (const key in controls)
      if (controls.hasOwnProperty(key)) {
        const control = controls[key];
        errors[key] = ((control.dirty || control.touched) && control.invalid) ?
          this._getError(key, control.errors) : '';
      }

    this.errors = errors;
  }

  protected canAutoSave() {
    return this.autoSave && !this._loadingHandler.initializing;
  }

  protected handleValueChange(value: any) {
  }

  protected _validateForm() {
    const controls = this.form.controls;

    // update validators attached to form

    for (const key in controls)
      if (controls.hasOwnProperty(key)) {
        const control = controls[key];
        control.markAsTouched({onlySelf: true});
        control.updateValueAndValidity({onlySelf: true, emitEvent: false});
      }

    this.form.updateValueAndValidity({onlySelf: true, emitEvent: false});

    this._handleStatusChange(this.form);
  }

  protected _getError(key: string, errors: any): string {
    console.log('some key of error', key, errors);
    const errorMessages: IErrorMessage = this.errorMessages[key];
    const errorKey = Object.keys(errors)[0];

    if (errorMessages && typeof errorMessages[errorKey] === 'string')
      return errorMessages[errorKey] as string;

    return 'Error';
  }

  protected _handleSuccessCreate(response?: any) {
    this._notifier.showSuccess('action.successfully-created');
    if (this.item.id && this.redirects && this.redirects.onCreate)
      this._router.navigate(['..', this.item.id], {relativeTo: this._route});
  }

  protected _handleSuccessUpdate() {
    this._notifier.showSuccess('action.successfully-updated');
  }

  protected _handleErrorCreate(error: any) {
    this._notifier.showError(error, 'action.create-error');
  }

  protected _handleErrorUpdate(error: any) {
    this._notifier.showError(error, 'action.update-error');
  }

  protected _makeUnchanged() {
    this.valueChanged = false;
  }

  protected _makeChanged() {
    this.valueChanged = true;
  }

  protected _handleUpdateItems(items: T[]): boolean | undefined {
    const item = items.find(i => i.id === this.item.id);
    if (!item)
      return;

    this.handleItem(item);
    return true;
  }
}
