import {NgModule, Provider} from '@angular/core';
import { NzNotificationServiceModule } from 'ng-zorro-antd/notification';
import { NotifierService } from './services/notifier.service';
import { NgZorroNotifierService } from './services/zorro-notifier.service';

export function provideNotifier(): Provider {
  return {
    provide: NotifierService,
    useClass: NgZorroNotifierService
  }
}

@NgModule({
  declarations: [],
  imports: [
    NzNotificationServiceModule
  ],
  providers: [
   provideNotifier(),
  ],
  exports: []
})
export class NotifierModule {
}
