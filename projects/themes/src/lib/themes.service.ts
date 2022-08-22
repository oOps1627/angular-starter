import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";

export enum Theme {
  Dark = 'ThemeDark',
  Light = 'ThemeDark',
}

@Injectable({
  providedIn: 'root'
})
export class ThemesService {
  private _theme$ = new BehaviorSubject<Theme>(Theme.Dark);

  public themeChange$ = this._theme$.asObservable();

  public get theme(): Theme {
    return this._theme$.value;
  }

  public changeTheme(theme: Theme): void {
    this._theme$.next(theme);
    const body: HTMLElement = document.querySelector('body');

    body.classList.remove(...Object.keys(Theme));
    body.classList.add(theme);
  }
}
