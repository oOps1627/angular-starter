import {ChangeDetectorRef, Directive, Injector, OnInit} from '@angular/core';
import {UntilDestroy} from '@ngneat/until-destroy';
import {IBaseItem, IPaginationParams, IPaginationResponse, PaginationResponsePayload, Repository} from 'communication';
import {Observable, Subscription} from 'rxjs';
import {finalize, first} from 'rxjs/operators';
import {IItemsBuilder, ItemsBuilder} from './items.builder';
import {ActivatedRoute, Router} from '@angular/router';
import {NotifierService} from 'notifier';
import {ILoadingHandler, LoadingHandler, LoadingHandlerToken} from './loading-handler';

export interface IItemsComponentConfig {
  autoLoadData?: boolean;
}

const defaultItemsComponentConfig: IItemsComponentConfig = {
  autoLoadData: true,
};

@UntilDestroy()
@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class ItemsComponent<T extends IBaseItem, P extends IPaginationParams = any> implements OnInit {
  readonly defaultPageSize = 10;

  allItemsLoaded = false;
  config: IItemsComponentConfig = {
    ...defaultItemsComponentConfig,
  };
  responsePayload: PaginationResponsePayload = {
    count: 0,
    pageCount: 0,
    page: 0,
    total: 1,
  };

  builder: IItemsBuilder<T, any> = new ItemsBuilder<T>();

  protected _dataSubscription: Subscription;
  protected _repository?: Repository<T>;
  protected _route: ActivatedRoute;
  protected _router: Router;
  protected _notifier: NotifierService;
  protected _loadingHandler: ILoadingHandler;

  get items() {
    return this.builder.items;
  }

  // protected queryParams: P = {} as P;
  protected _params: P = {} as P;

  get params(): P {
    return this._params;
  }

  set params(value: any) {
    this._params = value;
  }

  get skip() {
    return this._params.skip ?? 0;
  }

  set skip(value: number) {
    this._params = {...this._params, offset: value};
  }

  get take() {
    return this._params.take;
  }

  set take(value: number) {
    this._params = {...this._params, limit: value};
  }

  get repository(): Repository<T> {
    if (!this._repository)
      throw new Error('Please provide valid repository');

    return this._repository;
  }

  constructor(protected _injector: Injector) {
    this._injectDeps();
  }

  ngOnInit(): void {
    if (this.config.autoLoadData)
      this.loadData();
  }

  refresh() {
    this.skip = 0;
    this.loadData();
  }

  loadMore() {
    this.skip += this.defaultPageSize;
    this.loadData(this._params)
  }

  loadData(params?: P) {
    this._params = params || this._params;

    if (this.take == null)
      this.take = this.defaultPageSize;

    const hide = this._loadingHandler.showLoading(true);

    this._dataSubscription?.unsubscribe();

    this._dataSubscription = this._getItems(this.params)
      .pipe(
        first(),
        finalize(() => hide())
      )
      .subscribe({
        next: (response) => this._handleResponse(response, this.params),
        error: (error) => this._handleLoadingError(error),
      });
  }

  protected _getItems(params?: any): Observable<IPaginationResponse<T>> {
    return this.repository.getItems(params);
  }

  protected _handleResponse(response: IPaginationResponse<T>, params: any = {}) {
    if (Array.isArray(response?.data)) {
      const {count, page} = response;
      const {data, ...payload} = response;

      if (page === 1)
        this.builder.replaceItems(data);
      else
        this.builder.addItems(data);

      if (count != null && data.length < count) {
        this.allItemsLoaded = true;
      }

      this.responsePayload = payload;
    } else if (Array.isArray(response)) {
      this.builder.replaceItems(response);
      this.allItemsLoaded = true;
      this.responsePayload = {
        count: this.builder.items.length,
        total: this.builder.items.length,
        page: 1,
        pageCount: 1,
      };
    } else {
      throw new Error('Invalid response');
    }
  }

  protected _handleLoadingError(error: any): void {
    console.error(error);

    this._notifier.showError(error, 'action.load-items-error');
  }

  protected _injectDeps(): void {
    this._route = this._injector.get(ActivatedRoute);
    this._router = this._injector.get(Router);
    this._notifier = this._injector.get(NotifierService);
    this._loadingHandler = this._injector.get(LoadingHandlerToken, new LoadingHandler(this._injector.get(ChangeDetectorRef)));
  }
}
