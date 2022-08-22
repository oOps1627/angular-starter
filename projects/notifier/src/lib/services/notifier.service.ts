/*
 * WARNING! This program and source code is owned and licensed by
 * Modulus Financial Engineering, Inc. http://www.modulusfe.com
 * Viewing or use this code requires your acceptance of the Modulus
 * License Agreement which can be obtained by emailing sales@modulusfe.com
 * Removal of this comment is a violation of the license agreement.
 * Copyright 2012-2022 by Modulus Financial Engineering, Inc., Scottsdale, AZ USA
 */
export abstract class NotifierService {
    public abstract showSuccess(message: string): void;

    public abstract showError(message: string, defaultMessage?: string): void;
}
