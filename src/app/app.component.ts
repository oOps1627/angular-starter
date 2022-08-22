import {Component, OnInit} from '@angular/core';
import {Theme, ThemesService} from "../../projects/themes/src/lib/themes.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private _themesService: ThemesService) {
  }

  ngOnInit() {
    this._themesService.changeTheme(Theme.Dark);
  }
}
