import { APP_INITIALIZER, NgModule } from '@angular/core';
import { Config } from './config';
import { HttpClient } from '@angular/common/http';
import { PATH } from './path';

export interface ConfigurationConfig {
  path: string;
  configClass: new (...args: any[]) => Config;
}

export function initConfig(loader: HttpClient, path: string, config: Config): () => Promise<any> {
  return () => loader
    .get(path)
    .toPromise()
    .then(result => config.apply(result));
}


@NgModule()
export class ConfigModule {
  static configure(config: ConfigurationConfig) {
    return {
      ngModule: ConfigModule,
      providers: [
        {
          provide: APP_INITIALIZER,
          useFactory: initConfig,
          multi: true,
          deps: [HttpClient, PATH, config.configClass]
        },
        {
          provide: PATH,
          useValue: config.path
        }
      ]
    };
  }
}
