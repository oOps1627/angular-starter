import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable, Injector, Optional } from '@angular/core';
import { Id } from 'communication';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ExcludeId, IBaseItem, IPaginationResponse, Repository } from '../common';
import { CommunicationConfig } from './communication.config';

@Injectable()
export abstract class HttpRepository<T extends IBaseItem> extends Repository<T> {

  constructor(
    @Inject(HttpClient) protected _http: HttpClient,
    @Optional() @Inject(CommunicationConfig) protected _communicationConfig: CommunicationConfig,
    @Optional() @Inject(Injector) protected _injector: Injector,
  ) {
    super();

    this.onInit();
  }

  onInit() { }

  getItemById(id: number | string, query?: any): Observable<T> {
    return this._http.get<T>(this._getRESTURL(id), { ...this._httpOptions, params: query });
  }

  getItems(obj?: any): Observable<IPaginationResponse<T>> {
    let params = {};
    const { id = null, ...query } = obj ?? {};

    if (query) {
      if (query.skip != null) {
        query.offset = query.skip;
        // delete query.skip;
      }

      if (query.take != null) {
        query.limit = query.take;
        // delete query.take;
      }

      params = new HttpParams({ fromObject: query });
    }

    return this._http.get<IPaginationResponse<T>>(this._getRESTURL(id), { ...this._httpOptions, params });
  }

  createItem(item: ExcludeId<T>, options?: any): Observable<any> {
    return this._createItem(item, options).pipe(tap(i => this._onCreate(i)));
  }

  updateItem(item: T, query?: any): Observable<T> {
    const { id, ...dto } = item;
    return this._http.patch<T>(this._getRESTURL(id), dto, { ...this._httpOptions, params: query })
      .pipe(tap(this._onUpdate));
  }

  deleteItem(id: number | string): Observable<any> {
    return this._http.delete(this._getRESTURL(id), this._httpOptions)
      .pipe(tap(() => this._onDelete({ id })));
  }

  override getItemsByIds(ids?: Id[]): Observable<T[]> {
    if (!ids || !ids.length) {
      return of([]);
    }

    return this.getItems({ s: JSON.stringify({ id: { $in: ids } }) }).pipe(map(i => i as any));
    // return forkJoin(ids.map(id => this.getItemById(id)));
  }

  protected _createItem(item: ExcludeId<T>, options?: any): Observable<any> {
    return this._http.post(this._getRESTURL(), item, { ...this._httpOptions, ...options })
  }

  protected get _baseUrl(): string {
    throw new Error(`Implement baseUrl for ${this}`);
  }

  protected get _httpOptions() {
    return {};
  }

  protected _concatUrl(...params: (string | number)[]): string {
    return `${this._baseUrl}`.concat('/', params.filter(Boolean).map(toString).join('/'));
  }

  protected _getRESTURL(id?: Id) {
    return this._concatUrl(id ? encodeURI(id as string) : '');
  }

  protected arrayToUrl(...params: (string | number)[]) {
    return params.filter(Boolean).map(toString).join('/');
  }
}

function toString(i: any) {
  return i.toString();
}
