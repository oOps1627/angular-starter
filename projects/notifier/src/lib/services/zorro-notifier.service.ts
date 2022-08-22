/*
 * WARNING! This program and source code is owned and licensed by
 * Modulus Financial Engineering, Inc. http://www.modulusfe.com
 * Viewing or use this code requires your acceptance of the Modulus
 * License Agreement which can be obtained by emailing sales@modulusfe.com
 * Removal of this comment is a violation of the license agreement.
 * Copyright 2012-2022 by Modulus Financial Engineering, Inc., Scottsdale, AZ USA
 */
import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NotifierService } from './notifier.service';

@Injectable()
export class NgZorroNotifierService extends NotifierService {
    constructor(private readonly _notifyService: NzNotificationService) {
        super();
    }

    public showError(message: string, defaultMessage?: string): void {
        this._notifyService.error(message, defaultMessage);
    }

    public showSuccess(message: string): void {
        this._notifyService.success(message, null);
    }
}
