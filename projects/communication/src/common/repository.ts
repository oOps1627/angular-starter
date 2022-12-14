import { Observable, of, Subject, throwError } from 'rxjs';
import { IBaseItem } from './item';
import { IPaginationResponse } from './pagination';

export type ExcludeId<T> = {
  [P in Exclude<keyof T, keyof IBaseItem>]?: T[P]
};

export enum RealtimeAction {
  Create = 'created',
  Update = 'updated',
  Delete = 'deleted',
}

export interface RealtimeActionData<T> {
  action: RealtimeAction;
  items: T[];
}

export abstract class Repository<T extends IBaseItem = any> {

  actions: Subject<RealtimeActionData<T>> = new Subject();

  protected _onCreate = this._bindEmit(RealtimeAction.Create);
  protected _onUpdate = this._bindEmit(RealtimeAction.Update);
  protected _onDelete = this._bindEmit(RealtimeAction.Delete);

  abstract getItemById(id: number | string | T, query?: any): Observable<T>;

  abstract createItem(item: ExcludeId<T>, options?: any, projectId?: number): Observable<T>;

  abstract updateItem(item: T, query?: any): Observable<T>;

  patchItem(item: Partial<T>, field?: string): Observable<Partial<T>> {
    return throwError(`Implement patchItem for ${this.constructor.name}`);
  }

  abstract deleteItem(id: number | string | T): Observable<boolean>;

  abstract getItems(params?: any): Observable<IPaginationResponse<T>>;

  getItemsByIds(ids: number[] | string[]): Observable<T[]> {
    console.error('implement getItemsByIds');
    return of([]);
  }

  deleteMany(params: any): Observable<boolean> {
    throw new Error('Please implement deleteMany');
  }

  protected _bindEmit(action: RealtimeAction) {
    return (data: any) => {
      if (data == null)
        return;

      const items = Array.isArray(data) ? data : [data];

      this.actions.next({
        action,
        items,
      });
    };
  }
}
