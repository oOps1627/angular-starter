import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { ExcludeId, IBaseItem, IPaginationResponse, Repository } from '../common';

export abstract class FakeRepository<T extends IBaseItem> extends Repository<T> {
  protected _id = 0;
  protected _delay!: number;
  protected _getItemsParams: any;

  protected get delay(): number {
    return this._delay >= 0 ? this._delay : 0;
  }

  protected _store: { [key: number]: T } = {};

  get store() {
    return this._store;
  }

  constructor() {
    super();
    this._init();
  }

  getItemById(id: string | number): Observable<T> {
    if (id == null || !this._store[id]) {
      return throwError(`Item with ${id} not found`);
    }

    return this._wrapDataInObservable(this._store[id]);
  }

  createItem(item: ExcludeId<T>): Observable<T> {
    if (!item) {
      return throwError('Invalid item');
    }

    const _item: T = { ...item, id: ++this._id } as T;
    this._store[_item.id] = _item;

    return this._wrapDataInObservable(_item)
      .pipe(tap(this._onCreate));
  }

  updateItem(item: T): Observable<T> {
    if (!item || item.id == null) {
      return throwError('Invalid item');
    }

    this._store[item.id] = item;

    return this._wrapDataInObservable(this._store[item.id])
      .pipe(tap((v) => this._onUpdate(v)));
  }

  deleteItem(id: number): Observable<any> {
    if (id == null || !this._store[id]) {
      return throwError(`Invalid item id - ${id}`);
    }

    delete this._store[id];

    return this._wrapDataInObservable(true)
      .pipe(tap(() => this._onDelete({ id })));
  }

  getItems(params?: { skip: number, take: number }): Observable<IPaginationResponse<T>> {
    this._getItemsParams = params;
    const { skip = 0, take = 100000000 } = params || {};

    const keys = Object.keys(this._store);
    const items = keys
      .map(id => this._store[id])
      .filter((v) => this.itemsFilter(v))
      .splice(skip, take);

    return this._wrapDataInObservable({ data: items, total: keys.length });

  }

  deleteMany(params: any): Observable<boolean> {
    const ids: number[] = params.ids;

    for (const id of ids)
      delete this._store[id];

    const _ids = ids.map(id => ({ id }));

    return this._wrapDataInObservable(true)
      .pipe(tap(() => this._onDelete(_ids)));
  }

  protected async _init() {
    const items = await this._getItems();

    for (const item of items) {
      this._store[item.id] = item;
    }
  }

  protected abstract _getItems(): Promise<T[]>;

  protected itemsFilter(item: T): boolean {
    return true;
  }

  protected _wrapDataInObservable(data: any): Observable<any> {
    return of(data).pipe(delay(this.delay));
  }
}
