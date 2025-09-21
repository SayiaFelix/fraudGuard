import { HttpClient } from '@angular/common/http';
import {Injectable} from '@angular/core';
import { forkJoin, map, Observable, Subject } from 'rxjs';
import {environment} from 'src/environments/environment';
import { BehaviorSubject } from 'rxjs';
import { Workflow } from 'src/app/views/pages/mobile-banking/rbac/Users/list-users/list-users.component';
import { Audit, MISReport, Observation } from 'src/app/views/pages/mobile-banking/products/list-products-categories-cards/product-categories-as-cards.component';

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

private api = 'http://localhost:3000/workflows'; 
  
  private apis = 'http://localhost:3000'; 

  getAudits() {
    return this.http.get<any[]>(`${this.apis}/audits`);
  }


  getMISReports() {
    return this.http.get<any[]>(`${this.apis}/misReports`);
  }

  getAll() {
  return this.http.get<any>('http://localhost:3000');
}

  
  getWorkflows() { return this.http.get<Workflow[]>(`${this.apis}/workflows`); }
  getObservations() { return this.http.get<Observation[]>(`${this.apis}/observations`); }

  // MIS reports CRUD
  listReports(): Observable<MISReport[]> {
    return this.http.get<MISReport[]>(`${this.apis}/misReports?_sort=createdAt&_order=desc`);
  }
  createReport(payload: MISReport) {
    return this.http.post<MISReport>(`${this.apis}/misReports`, payload);
  }
  deleteReport(id: string) {
    return this.http.delete(`${this.apis}/misReports/${id}`);
  }

  // Auto-generate summary from audits/workflows/observations
  generateSummary(): Observable<any> {
    return forkJoin({
      audits: this.getAudits(),
      workflows: this.getWorkflows(),
      observations: this.getObservations()
    }).pipe(map(({audits, workflows, observations}) => {
      // audits per department
      const auditsByDept: Record<string, number> = {};
      audits.forEach(a => auditsByDept[a.department] = (auditsByDept[a.department] || 0) + 1);

      // findings by severity (from workflows.miniFindings + observations.findings)
      const findingsSeverity = { High: 0, Medium: 0, Low: 0, Unknown: 0 };
      workflows.forEach(w => (w.miniFindings || []).forEach(f => {
        const sev = (f.severity || f.impact) || 'Unknown';
        findingsSeverity[sev as keyof typeof findingsSeverity] = (findingsSeverity[sev as keyof typeof findingsSeverity] || 0) + 1;
      }));
      observations.forEach(o => (o.findings || []).forEach(f => {
        const sev = (f.severity || f.impact) || 'Unknown';
        findingsSeverity[sev as keyof typeof findingsSeverity] = (findingsSeverity[sev as keyof typeof findingsSeverity] || 0) + 1;
      }));

      // audits over time (count per month)
      const auditsOverTime: Record<string, number> = {};
      audits.forEach(a => {
        const m = a.startDate ? a.startDate.slice(0,7) : 'unknown'; // YYYY-MM
        auditsOverTime[m] = (auditsOverTime[m] || 0) + 1;
      });

      // quick stats
      const totalAudits = audits.length;
      const completedAudits = audits.filter(a => a.status === 'Completed').length;
      const inProgress = audits.filter(a => a.status === 'In Progress').length;

      return {
        auditsByDept,
        findingsSeverity,
        auditsOverTime,
        totalAudits,
        completedAudits,
        inProgress
      };
    }));
  }

// ///////////////////////////////////////////////

list(): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(this.api);
  }

  get(id: number | string): Observable<Workflow> {
    return this.http.get<Workflow>(`${this.api}/${id}`);
  }

  create(payload: Workflow): Observable<Workflow> {
    return this.http.post<Workflow>(this.api, payload);
  }

  update(id: number | string, payload: Workflow): Observable<Workflow> {
    return this.http.put<Workflow>(`${this.api}/${id}`, payload);
  }

  delete(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
  private workflowsChanged = new Subject<void>();
  private auditsChanged = new Subject<void>();

  auditsChanged$ = this.auditsChanged.asObservable();
  workflowsChanged$ = this.workflowsChanged.asObservable();

  notifyWorkflowsChanged() {
    this.workflowsChanged.next();
  }

updateBotStatus(update: { id: number, is_active: boolean }) {
    this.botStatusSubject.next(update);
  }

setChatbotData(data: any) {
    this.chatbotDataSubject.next(data);
  }

setBotStatus(status: { id: number, is_active: boolean }) {
  this.botStatusSubject.next(status);
}


notifyAuditsChanged() {
  this.auditsChanged.next();
}

  private observationsChanged = new Subject<void>();   // 🔹 NEW
  observationsChanged$ = this.observationsChanged.asObservable();  // 🔹 NEW

 
  notifyObservationsChanged() {   
    this.observationsChanged.next();
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
