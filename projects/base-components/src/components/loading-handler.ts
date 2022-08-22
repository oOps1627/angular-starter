import { ChangeDetectorRef, InjectionToken, Provider } from '@angular/core';

type HideLoader = () => void;

interface ILoadingHandlerConfig {
  timeBeforeLoadingStart?: number;
  minLoadingTime?: number;
}

export interface ILoadingHandler {
  readonly loading: boolean;

  readonly initializing: boolean;

  showLoading(initializing?: boolean): HideLoader;
}

export const LoadingHandlerToken = new InjectionToken<ILoadingHandler>('Loading Handler');

export function provideLoadingHandler(config?: ILoadingHandlerConfig): Provider {
  return {
    provide: LoadingHandlerToken,
    deps: [ChangeDetectorRef],
    useFactory: (cdr: ChangeDetectorRef) => new LoadingHandler(cdr, config),
  };
}

export class LoadingHandler implements ILoadingHandler {
  public timeBeforeLoadingStart: number;
  public minLoadingTime: number;

  private _loadingProcesses = 0;
  private _loading = false;
  private _initializing = false;

  get loading(): boolean {
    return this._loading;
  }

  get initializing(): boolean {
    return this._initializing;
  }

  constructor(private _cdr: ChangeDetectorRef, private _config?: ILoadingHandlerConfig) {
    this.timeBeforeLoadingStart = this._config?.timeBeforeLoadingStart ?? 0;
    this.minLoadingTime = this._config?.minLoadingTime ?? 300;
  }

  showLoading(initializing: boolean = false): HideLoader {
    this._loadingProcesses++;
    this._loading = true;
    this._initializing = initializing;
    this.timeBeforeLoadingStart = this.timeBeforeLoadingStart || Date.now();
    this._cdr.markForCheck();

    return this._hideLoader.bind(this);
  }

  private _hideLoader(): void {
    if (this._loadingProcesses <= 0) return;

    if (--this._loadingProcesses === 0) {
      const time = Date.now();
      const diff = time - this.timeBeforeLoadingStart;
      this.timeBeforeLoadingStart = 0;

      setTimeout(
        () => {
          if (this._loadingProcesses === 0) {
            this._loading = false;
            this._cdr.markForCheck();
          }
        },
        diff < this.minLoadingTime ? this.minLoadingTime - diff : 0
      );
    }
  }
}
