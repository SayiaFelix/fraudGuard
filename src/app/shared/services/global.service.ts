import { HttpClient } from '@angular/common/http';
import {Injectable} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {environment} from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';

// In: global.service.ts (or auth.service.ts)


@Injectable(
  {
    providedIn: 'root',
  }
)
export class GlobalService {
  public channelManagerHost: string;
  public mobileBankingHost: string;
  public customerPortalNest: string;
  public standardApi: string;
  public standardComments: string;
  public getToken(): any {
    return localStorage.getItem('token');
  }

  public setting: any = {};

  private apiUrl = 'http://127.0.0.1:5010/api/chat'; 

  constructor(private http: HttpClient) {
    
    this.channelManagerHost = environment.customerPortalNest;
    this.mobileBankingHost = environment.customerPortalNest;
    this.customerPortalNest = environment.customerPortalNest;
    this.standardApi = environment.standardsApi;
    // this.standardComments = environment.standardsComment;

  }

 private chatbotId: string | number | null = null;
 private intentId: string | null = null
private chatbotDataSubject = new BehaviorSubject<any>(null);
private botStatusSubject = new BehaviorSubject<{ id: number, is_active: boolean } | null>(null);
private chatbotIdSubject = new BehaviorSubject<number | null>(null);

chatbotId$ = this.chatbotIdSubject.asObservable();
botStatus$ = this.botStatusSubject.asObservable();
chatbotData$ = this.chatbotDataSubject.asObservable();

updateBotStatus(update: { id: number, is_active: boolean }) {
    this.botStatusSubject.next(update);
  }

  setChatbotData(data: any) {
    this.chatbotDataSubject.next(data);
  }

  getChatbotData() {
    return this.chatbotDataSubject.value;
  }

 
  setChatbotId(id: number | string) {
    const parsedId = typeof id === 'string' ? parseInt(id, 10) : id;
    this.chatbotIdSubject.next(parsedId);
  }

  getChatbotId(): number | null {
    return this.chatbotIdSubject.value;
  }


//   setChatbotId(id: number | string) {
//      this.chatbotId = typeof id === 'string' ? parseInt(id, 10) : id;
// }


//   getChatbotId(): string | number | null {
//     return this.chatbotId;
//   }

  clearChatbotId(): void {
    this.chatbotId = null;
  }

  setIntentId(id: string): void {
    this.intentId = id;
  }

  getIntentId(): string | null {
    return this.intentId;
  }

  private userId: string | null = null;

  setUserId(id: string) {
    this.userId = id;
    localStorage.setItem('user_id', id);
  }

  getUserrId(): string | null {
    return this.userId || localStorage.getItem('user_id');
  }

  clearintentId(): void {
    this.intentId = null;
  }

  private botCreatedSource = new Subject<void>();
  botCreated$ = this.botCreatedSource.asObservable();

  notifyBotCreated() {
    this.botCreatedSource.next();
  }
  
  loadGlobalSettingsFromLocalStorage(): void {
    if (localStorage.getItem('backend-setting') != null) {
      const backend_setting = localStorage.getItem('backend-setting');
      this.setting = JSON.parse(backend_setting ? backend_setting : "");
    }

  }



  sendMessageToBot(userMessage: string, userId: string): Observable<any> {
    const payload = { 
      user_id: userId, 
      message: userMessage 
    };
    return this.http.post<any>(this.apiUrl, payload);
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
