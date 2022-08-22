import {ChangeDetectorRef, Directive, Injector} from '@angular/core';
import {IBaseItem, Repository} from 'communication';
import { EMPTY, Observable } from 'rxjs';
import { finalize, first } from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {NotifierService} from 'notifier';
import {ILoadingHandler, LoadingHandler, LoadingHandlerToken} from './loading-handler';

@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class ItemComponent<T extends IBaseItem> {
  needCreate = false;
  item: T;

  protected _repository?: Repository<T>;
  protected _route: ActivatedRoute;
  protected _router: Router;
  protected _notifier: NotifierService;
  protected _loadingHandler: ILoadingHandler;

  get repository(): Repository<T> {
    if (!this._repository)
      throw new Error('Please provide valid repository');

    return this._repository;
  }

  get loading(): boolean {
    return this._loadingHandler.loading;
  }

  constructor(protected _injector: Injector) {
    this._injectDeps();
  }

  loadData(params?: any) {
    const id = this._getIdFromParams(params);
    this.needCreate = id == null;
    if (this.needCreate)
      return;
    const hide = this._loadingHandler.showLoading(true);
    this._getItem(id, params)
      .pipe(first(), finalize(() => hide()))
      .subscribe(
        (item) => {
          this.handleItem(item);
        },
        (error) => {
          this._handleLoadingError(error);
        }
      );
  }

  protected _getItem(id?: any, query?: any): Observable<T> {
    if (id == null) {
      const { params = {} } = this._route.snapshot || {};
      id = params.id;
    }
    if (!id)
      return EMPTY;

    return this.repository.getItemById(id, query);
  }

  protected _getIdFromParams(params: any) {
    if (params?.id)
      return params.id;
    if (typeof params === 'string' || typeof params === 'number') {
      return params;
    }
    return null;
  }

  protected handleItem(item: T) {
    if (!item || item.id)
      this.needCreate = true;

    this.item = item;
  }

  protected _handleLoadingError(error: Error) {
  }

  protected _injectDeps(): void {
    this._route = this._injector.get(ActivatedRoute);
    this._router = this._injector.get(Router);
    this._notifier = this._injector.get(NotifierService);
    this._loadingHandler = this._injector.get(LoadingHandlerToken, new LoadingHandler(this._injector.get(ChangeDetectorRef)));
  }
}
