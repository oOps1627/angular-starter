import {Provider} from "@angular/core";
import {ModuleWithProviders, NgModule} from "@angular/core";
import {CommunicationConfig} from './http/communication.config';

@NgModule({
  imports: [],

})
export class CommunicationModule {
  static forRoot(communicationConfigToken: Provider): ModuleWithProviders<CommunicationModule> {
    return {
      ngModule: CommunicationModule,
      providers: [
        {
          provide: CommunicationConfig,
          useExisting: communicationConfigToken,
        },
      ],
    };
  }
}
