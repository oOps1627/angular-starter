import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule, BrowserTransferStateModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {CommonModule, registerLocaleData} from '@angular/common';
import en from '@angular/common/locales/en';
import {FormsModule} from '@angular/forms';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ConfigModule} from "../../projects/config/src/lib/config.module";
import {environment} from "../environments/environment";
import {AppConfig} from "./app.config";
import {CommunicationModule} from "../../projects/communication/src/communication.module";
import {TranslateLoader, TranslateModule, TranslateService} from "@ngx-translate/core";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {en_US, NZ_I18N} from "ng-zorro-antd/i18n";
import {NzButtonModule} from "ng-zorro-antd/button";

registerLocaleData(en);

function initLanguage(translateService: TranslateService): () => void {
  const languagesList = ['en'];

  return () => {
    translateService.addLangs(languagesList);
    translateService.setDefaultLang(languagesList[0]);
  };
}

@NgModule({
  declarations: [
    AppComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        CommonModule,
        BrowserTransferStateModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ConfigModule.configure({
            path: environment.config,
            configClass: AppConfig as any,
        }),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (http: HttpClient) => {
                    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
                },
                deps: [HttpClient],
            },
        }),
        CommunicationModule.forRoot(AppConfig),
        NzButtonModule,
    ],
  providers: [
    {
      provide: NZ_I18N,
      useValue: en_US,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initLanguage,
      deps: [TranslateService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
