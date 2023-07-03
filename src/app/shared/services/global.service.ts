import {Injectable} from '@angular/core';
import {environment} from 'src/environments/environment';

@Injectable(
  {
    providedIn: 'root',
  }
)
export class GlobalService {
  public channelManagerHost: string;
  public mobileBankingHost: string;
  public customerPortalNest: string;

  public setting: any = {};

  constructor() {
    this.channelManagerHost = environment.channelManager;
    this.mobileBankingHost = environment.mobileBanking;
    this.customerPortalNest = environment.customerPortalNest;
  }

  loadGlobalSettingsFromLocalStorage(): void {
    if (localStorage.getItem('backend-setting') != null) {
      const backend_setting = localStorage.getItem('backend-setting');
      this.setting = JSON.parse(backend_setting ? backend_setting : "");
    }

  }

  public handleServerErrors(result: any): any {
    //   let isValidationError = false;
    //   let errorMessage;
    /*    this.message.error('Encountered an error', { nzDuration: 2000 });
        switch (result.response_code) {
          case 400:
            errorMessage = 'Wrong method';
            break;
          case 401:
            errorMessage = 'Session Expired';
            this.message.error('Your session  has expired', { nzDuration: 4000 });
            break;
          case 403:
            errorMessage = 'UnAuthorized';
            break;
          case 422:
            isValidationError = true;
            errorMessage = Array.from(Object.keys(result.error_messages), k => result.error_messages[k]);
            break;
          case 404:
            errorMessage = 'Not Found';
            break;
          case 500:
            errorMessage = 'Internal Server Error';
            break;
        }
        return { errorMessage: errorMessage, isValidationError: isValidationError  };
        **/
  }

  public validateOnClientSide(validateForm: any): boolean {
    let hasClientValidationError = false;
    for (const i in validateForm.controls) {
      if (validateForm.controls) {
        validateForm.controls[i].markAsDirty();
        validateForm.controls[i].updateValueAndValidity();
        if (validateForm.controls[i].errors !== null) {
          hasClientValidationError = true;
        }
      }
    }
    return hasClientValidationError;
  }

  /**
   * Shuffles array in place. ES6 version
   */

  public getUserInfo(): any {
    const user = localStorage.getItem('user');
    return JSON.parse(user ? user : "");
  }

  public getUserPermissions(): any {
    const permissions = localStorage.getItem('permissions');
    return JSON.parse(permissions ? permissions : "");
  }

  public getToken(): any {
    return localStorage.getItem('access_token');
  }

  public getUserId(): any {
    const user_details = localStorage.getItem('user_details');
    const userDetails = JSON.parse(user_details ? user_details : "");

    return userDetails.user.id;

  }

  //
  // isAuthenticated() {
  //   const token = this.token;
  //   if (token) {
  //     const tokenExpired = this.jwtHelper.isTokenExpired(token);
  //     if (tokenExpired) {
  //       this.logout();
  //       // this._currentUser =  this.jwtHelper.decodeToken(localStorage.getItem('refresh_token'))
  //     }
  //   }
  // }
}
