import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { GlobalService } from './global.service';
import { AuthService } from './auth.service';
import { map, tap, catchError } from 'rxjs/operators';
import { forkJoin, Observable, throwError, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

export interface FrontendTransaction {
  id: string;
  transactionId: string;
  amount: number;
  riskScore: number;
  riskCategory: 'Critical' | 'High' | 'Medium' | 'Low';
  channel: string;
  location: string;
  timestamp: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  flaggedBy: 'AI' | 'Rules' | 'Manual';
}

export interface Transaction {
  transaction_id: string;
  timestamp: string;
  risk_score: number;
  risk_category: string;
  transaction_details: {
    Transaction_Amount: number;
    Model_Agreement: string;
    real_time_signals?: {
      amount_risk: number;
      velocity_risk: number;
      avg_amount_used: number;
    };
  };
  recommended_action: string;
}

export interface FraudHistoryResponse {
  status: string;
  message: string;
  fraud_transactions: Transaction[];
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface TransactionsResponse {
  status: string;
  message: string;
  transactions: Transaction[];
  pagination: {
    page: number;
    size: number;
    total: number;
    has_more: boolean;
  };
}

export interface ModelMetrics {
  status: string;
  model_version: string;
  national_alert_mode: boolean;
  threshold: number;
  metrics: {
    [modelName: string]: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
    };
  };
}

export interface AuditLogEntry {
  timestamp: string;
  transaction_id: string;
  model_version: string;
  risk_score: number;
  risk_category: string;
  recommended_action: string;
  national_alert_mode: boolean;
}

export interface AuditLogResponse {
  status: string;
  message: string;
  log_count: number;
  logs: AuditLogEntry[];
}

export interface AlertModeResponse {
  status: string;
  message: string;
  national_alert_mode: boolean;
  active_threshold: number;
}

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private subclassDataUrl = 'assets/subclass-data.json';
  userId: any;
  
  constructor(
    private http: HttpClient,
    private globalService: GlobalService,
    private authService: AuthService,
    private router: Router
  ) {}

  private cytonUrl = 'http://130.61.111.65:5016/api/get_all_charts_kpis'; 
  private apiUrls = 'http://127.0.0.1:5020/api/chat'; 
  private baseUrl = "http://130.61.111.65:5016";
  private baseUrls = 'http://localhost:5015/api';
  private apiUrl = `${environment.customerPortalNest}`;


  checkTransactionRisk(transactionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/transactions`, transactionData, this.getHeaders())
      .pipe(
        // tap(response => console.log('Risk assessment response:', response)),
        catchError(this.handleError<any>('checkTransactionRisk', { 
          status: 'error', 
          message: 'Failed to assess transaction risk' 
        }))
      );
  }

  simulateBatch(payload: { count: number; fraud_ratio: number }): Observable<any> {
  return this.http.post(`${this.apiUrl}/finca/simulate_batch`, payload, this.getHeaders());
}

  getFraudHistory(page: number = 1, size: number = 10): Observable<any> {
    return this.http.post(`${this.apiUrl}/fraud_history`, { page, size }, this.getHeaders())
      .pipe(
        // tap(response => console.log('Fraud history response:', response)),
        catchError(this.handleError<any>('getFraudHistory', { 
          fraud_transactions: [], 
          pagination: { total: 0 } 
        }))
      );
  }

  
  getCustomers(
    page: number = 1,
    size: number = 10,
    search: string = '',
    segment: string = '',
    riskProfile: string = ''
  ): Observable<any> {

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (segment) {
      params = params.set('segment', segment);
    }

    if (riskProfile) {
      params = params.set('risk_profile', riskProfile);
    }

    return this.http.get(
      'http://127.0.0.1:5001/finca/v1/customers',
      {
        headers: this.getHeaders().headers,
        params: params
      }
    ).pipe(
      catchError(
        this.handleError<any>(
          'getCustomers',
          {
            status: 'error',
            customers: [],
            pagination: {
              page,
              size,
              total: 0,
              total_pages: 0,
              has_more: false
            }
          }
        )
      )
    );
  }


  getCustomer360(
    customerId: string
  ): Observable<any> {

    return this.http.get(
      `http://127.0.0.1:5001/finca/v1/customers/${customerId}/360`,
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>(
          'getCustomer360',
          {
            status: 'error',
            customer_360: null
          }
        )
      )
    );
  }
  getFeatureImportance(): Observable<any> {
    return this.http.get(`${this.apiUrl}/feature_importance_weight`, this.getHeaders())
      .pipe(
        // tap(response => console.log('Feature importance response:', response)),
        catchError(this.handleError<any>('getFeatureImportance', { 
          status: 'error', 
          feature_importance: {} 
        }))
      );
  }

  getTransactionById(transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions`, { transaction_id: transactionId }, this.getHeaders())
      .pipe(
        // tap(response => console.log('Transaction details response:', response)),
        catchError(this.handleError<any>('getTransactionById', { 
          status: 'error', 
          message: 'Failed to load transaction details' 
        }))
      );
  }

  toggleSovereignMode(enable: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/system/sovereign_mode`, { enable }, this.getHeaders())
      .pipe(
        // tap(response => console.log('Sovereign mode response:', response)),
        catchError(this.handleError<any>('toggleSovereignMode', { 
          status: 'error', 
          message: 'Failed to toggle sovereign mode' 
        }))
      );
  }

  getSovereignMode(): Observable<any> {
    return this.http.get(`${this.apiUrl}/system/sovereign_mode`, this.getHeaders())
      .pipe(
        // tap(response => console.log('Sovereign mode status:', response)),
        catchError(this.handleError<any>('getSovereignMode', { 
          sovereign_mode: true 
        }))
      );
  }

  getRelatedTransactions(transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/transactions/related`, { transaction_id: transactionId }, this.getHeaders())
      .pipe(
        // tap(response => console.log('Related transactions response:', response)),
        catchError(this.handleError<any>('getRelatedTransactions', { 
          related_transactions: [] 
        }))
      );
  }

  submitFraudFeedback(transactionId: string, feedback: 'confirmed_fraud' | 'false_positive', signals?: any): Observable<any> {
    const payload: any = {
      transaction_id: transactionId,
      feedback: feedback
    };
    
    if (signals) {
      payload.signals = signals;
    }
    
    return this.http.post(`${this.apiUrl}/fraud_feedback`, payload, this.getHeaders())
      .pipe(
        // tap(response => console.log('Feedback response:', response)),
        catchError(this.handleError<any>('submitFraudFeedback', { 
          message: 'Failed to submit feedback' 
        }))
      );
  }

  getTransactions(page: number = 1, size: number = 100): Observable<TransactionsResponse> {
    return this.http.post<TransactionsResponse>(`${this.apiUrl}/transactions`, { page, size }, this.getHeaders())
      .pipe(
        // tap(response => console.log('API Response:', response)),
        catchError(this.handleError<TransactionsResponse>('getTransactions', {
          status: 'error',
          message: 'Failed to load transactions',
          transactions: [],
          pagination: { page, size, total: 0, has_more: false }
        }))
      );
  }

  getModelMetrics(): Observable<ModelMetrics> {
    return this.http.get<ModelMetrics>(`${this.apiUrl}/model_metrics`, this.getHeaders())
      .pipe(
        catchError(this.handleError<ModelMetrics>('getModelMetrics', {
          status: 'error',
          model_version: 'unknown',
          national_alert_mode: false,
          threshold: 5.0,
          metrics: {}
        }))
      );
  }

  getAuditLog(): Observable<AuditLogResponse> {
    return this.http.get<AuditLogResponse>(`${this.apiUrl}/audit_log`, this.getHeaders())
      .pipe(
        catchError(this.handleError<AuditLogResponse>('getAuditLog', {
          status: 'error',
          message: 'Failed to load audit log',
          log_count: 0,
          logs: []
        }))
      );
  }

  toggleAlertMode(enable: boolean): Observable<AlertModeResponse> {
    return this.http.post<AlertModeResponse>(`${this.apiUrl}/system/alert_mode`, { enable }, this.getHeaders())
      .pipe(
        catchError(this.handleError<AlertModeResponse>('toggleAlertMode', {
          status: 'error',
          message: 'Failed to toggle alert mode',
          national_alert_mode: false,
          active_threshold: 5.0
        }))
      );
  }

  getSystemStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/system/stats`, this.getHeaders());
  }

  submitFeedback(transactionId: string, feedback: 'confirmed_fraud' | 'false_positive', signals?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fraud_feedback`, {
      transaction_id: transactionId,
      feedback,
      signals
    }, this.getHeaders()).pipe(
      catchError(this.handleError<any>('submitFeedback', { message: 'Failed to submit feedback' }))
    );
  }

  getTransactionStatus(transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/get_transactions/status`, { transaction_id: transactionId }, this.getHeaders())
      .pipe(
        // tap(response => console.log('Status history response:', response)),
        catchError(this.handleError<any>('getTransactionStatus', { 
          status: 'error',
          current_status: 'Open',
          history: [] 
        }))
      );
  }

  updateTransactionStatus(transactionId: string, status: string, notes?: string): Observable<any> {
    const payload: any = {
      transaction_id: transactionId,
      status: status,
      action_by: 'Analyst' 
    };
    
    if (notes) {
      payload.notes = notes;
    }
    
    return this.http.post(`${this.apiUrl}/transactions/status`, payload, this.getHeaders())
      .pipe(
        // tap(response => console.log('Status update response:', response)),
        catchError(this.handleError<any>('updateTransactionStatus', { 
          status: 'error', 
          message: 'Failed to update status' 
        }))
      );
  }

getHeaders(): { headers: HttpHeaders } {
  const token = this.authService.getToken();
  return {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    })
  };
}

  getHeadersFile(): any {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  getFormHeaders(): any {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      if (error.status === 401) {
        // console.log('Token expired or invalid, redirecting to login');
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      }
      
      return of(result as T);
    };
  }
  
  calculateKPIs(transactions: any[]): any {
    const totalTransactions = transactions.length;
    const highRisk = transactions.filter(t => (t.risk_score || 0) >= 5).length;
    const totalAmount = transactions.reduce((sum, t) => sum + (t.transaction_amount || 0), 0);
    
    return {
      totalTransactions,
      highRiskAlerts: highRisk,
      fraudBlocked: totalAmount,
      avgRiskScore: transactions.reduce((sum, t) => sum + (t.risk_score || 0), 0) / totalTransactions || 0
    };
  }
  
  groupByMonth(transactions: any[]): any {
    const monthlyData: { [key: string]: { count: number; amount: number } } = {};
    
    transactions.forEach(t => {
      const date = new Date(t.transaction_date || Date.now());
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, amount: 0 };
      }
      monthlyData[month].count++;
      monthlyData[month].amount += t.transaction_amount || 0;
    });
    
    return monthlyData;
  }

  // Add these methods to your HttpService class

// User Management Methods
UserGet(endpoint: string): any {
  return this.http.get(
    this.globalService.customerPortalNest + endpoint,
    this.getHeaders()
  ).pipe(map((response) => response));
}

userPost(endpoint: string, model: any): any {
  return this.http.post(
    this.globalService.customerPortalNest + endpoint,
    model,
    this.getHeaders()
  ).pipe(map((response) => response));
}

userPut(endpoint: string, model: any): any {
  return this.http.put(
    this.globalService.customerPortalNest + endpoint,
    model,
    this.getHeaders()
  ).pipe(map((response) => response));
}

userDelete(endpoint: string, payload?: any): any {
  const options: any = { headers: this.getHeaders().headers };
  if (payload) {
    options.body = payload;
  }
  return this.http.delete(
    this.globalService.customerPortalNest + endpoint,
    options
  ).pipe(map((response) => response));
}

adminCreateUser(userData: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/admin/create_users`, userData, this.getHeaders());
}

register(userData: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/register`, userData, this.getHeaders());
}

getUserById(userId: number): Observable<any> {
  return this.http.get(`${this.apiUrl}/admin/users/${userId}`, this.getHeaders());
}

updateUser(userId: number, userData: any): Observable<any> {
  return this.http.put(`${this.apiUrl}/admin/users/${userId}/update`, userData, this.getHeaders());
}

updateUserRole(userId: number, role: string): Observable<any> {
  return this.http.put(`${this.apiUrl}/admin/users/${userId}/role`, { role }, this.getHeaders());
}

disableUser(userId: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/admin/users/${userId}/disable`, {}, this.getHeaders());
}

enableUser(userId: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/admin/users/${userId}/enable`, {}, this.getHeaders());
}

resetPasswordEmail(userId: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/admin/users/${userId}/reset-password`, { type: 'email' }, this.getHeaders());
}

generateTemporaryPassword(userId: number): Observable<any> {
  return this.http.post(`${this.apiUrl}/admin/users/${userId}/reset-password`, { type: 'temporary' }, this.getHeaders());
}

forgotPassword(model: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/forgot-password`, model);
}

















































































































































  getDashboardData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/get_all_charts_kpis`);
  }

  getForecastData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/generate_forecasts`);
  }

  sendMessage(userMessage: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(this.apiUrl, { message: userMessage });
  }
  
  getCytonData(page: number, page_size: number): Observable<any> {
    const model = { page, page_size };
    return this.http.post(`${this.baseUrl}/api/clustered_data`, model);
  }
  
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrls}/upload`, formData);
  }

  chatWithBot(query: string): Observable<any> {
    return this.http.post(`${this.baseUrls}/chat`, { query });
  }

  public getEnterpriseUsers(endpoint: string): Observable<any> {
    return this.http.get(this.globalService.customerPortalNest + endpoint);
  }

  public channelManagerLogin() {}

  public customerPortalLogin(endpoint: string, model: any): Observable<any> {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.generateLoginHeaders()
      )
      .pipe(
        map((result: any) => {
          if (result.status === '00' && result.token) {
            localStorage.setItem('isLoggedin', 'true');
            localStorage.setItem('authToken', result.token); 
            localStorage.setItem('data', JSON.stringify(result));
          } else {
            throwError(() => new Error(result.message || 'Login failed.'));
          }
          return result;
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }
  
  public customerPortalActivate(endpoint: string, model: any): Observable<any> {
    return this.http
      .post(this.globalService.customerPortalNest + endpoint, model) 
      .pipe(
        map((result: any) => {
          if (result['status'] == '00') {
            // console.log('Activation successful:', result); 
          } else {
            throw new Error(result['message']);
          }
          return result;
        }),
        catchError((err) => {
          console.error('customerPortalActivate error:', err); 
          return throwError(() => err); 
        })
      );
  }

  getClassAndSubclassData(): Observable<any> {
    return this.http.get<any>(this.subclassDataUrl);
  }

  login(email: string, password: string) {
    return this.http.get<any[]>(`${this.apiUrl}?email=${email}&password=${password}`);
  }

  getUsers(email: string, password: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/users?email=${email}&password=${password}`);
  }

  public customerPortalAuth(endpoint: string, model: any, options?: any): Observable<any> {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        options 
      )
      .pipe(
        map((result: any) => {
          if (result['status'] == '00') {
            // localStorage.setItem('isLoggedin', 'true');
            // localStorage.setItem('token', result['token']);
            // localStorage.setItem('data', JSON.stringify(result['data']));
            // console.log('Reset successful:', result);
          } else {
            throwError(() => new Error(result['message']));
          }
          return result;
        })
      );
  }

  public customerUserDetails(): Observable<any> {
    let userId = JSON.parse(localStorage.getItem('data')!).id
    const userDetails$ = this.http
      .get(
        this.globalService.customerPortalNest +
          `api/v1/auth/userProfile/${userId}`,
        this.getHeaders()
      )
      .pipe(
        map((result: any) => {
          localStorage.setItem(
            'userData',
            JSON.stringify(result['data'])
          );
          return result['data'];
        })
      );
    return userDetails$;
  }

  public customerPortalPostData(endpoint: string, model: { page: { toString: () => string | number | boolean; }; size: { toString: () => string | number | boolean; }; }): any {
    const params = new HttpParams()
      .set('page', model.page.toString())
      .set('size', model.size.toString());
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        { params },
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public customerPortalPost(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public customerPortalPostFile(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.getHeadersFile()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public customerPortalGet(endpoint: string, model: any): any {
    return this.http
      .get(
        this.globalService.customerPortalNest + endpoint,
        model,
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }
  
  public customerPortalPosts(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.standardApi + endpoint,
        model,
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public customerPortalPostsImage(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.standardApi + endpoint,
        model,
        {}
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public customerPortalComments(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.standardComments + endpoint,
        model,
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public mobileBankingGetUserDetailsAndPermissions(): Observable<any> {
    const userDetails$ = this.http
      .post(
        this.globalService.channelManagerHost +
          'api/v1/corporate/admin/corporate/details',
        {},
        this.getHeaders()
      )
      .pipe(
        map((result: any) => {
          localStorage.setItem(
            'userData',
            JSON.stringify(result['data']['corporate'])
          );
          return result['data']['corporate'];
        })
      );

    const userPermissions$ = this.http
      .post(
        this.globalService.channelManagerHost +
          'api/v1/corporate/admin/permissions',
        {},
        this.getHeaders()
      )
      .pipe(
        map((result: any) => {
          localStorage.setItem(
            'profile',
            JSON.stringify(result['data']['data']['profile']['userType'])
          );
          localStorage.setItem(
            'roles',
            JSON.stringify(result['data']['data']['roleList'])
          );
          return result['data']['data']['profile'];
        })
      );

    return forkJoin([userDetails$, userPermissions$]);
  }

  public mobileBankingPost(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public mobileBankingGet(endpoint: string): any {
    return this.http
      .get(
        this.globalService.customerPortalNest + endpoint,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public mobileBankingPatch(endpoint: string, model: any): any {
    return this.http
      .patch(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public mobileBankingDel(endpoint: string, payload?: any): any {
    const options: any = { 
      headers: this.getHeaders().headers 
    };

    if (payload) {
      options.body = payload;
    }

    return this.http
      .delete(
        this.globalService.customerPortalNest + endpoint,
        options 
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public mobileBankingPostFormData(endpoint: string, model: FormData): Observable<any> {
    return this.http.post(
      this.globalService.customerPortalNest + endpoint,
      model,
      this.getFormHeaders()
    ).pipe(
      map((response) => response) 
    );
  }

  public mobileBankingPatchFormData(endpoint: string, model: FormData): Observable<any> {
    return this.http.patch(
      this.globalService.customerPortalNest + endpoint,
      model,
      this.getFormHeaders()
    ).pipe(
      map((response) => response) 
    );
  }

  public mobileBankingPaginationPost(endpoint: string, model: any): any {
    const updatedModel = {
      page: model.page - 1,
      size: model.size,
    };

    return this.http
      .post(
        this.globalService.channelManagerHost + endpoint,
        updatedModel,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public mobileBankingFormRequestPost(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.channelManagerHost + endpoint,
        model,
        this.getFormHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public getMapCoordinates(endpoint: string): any {
    return this.http.get(endpoint, this.getHeaders()).pipe(
      map((response) => {
        response = response;
        return response;
      })
    );
  }

  private generateLoginHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + btoa('ADMIN_PORTAL' + ':' + 'PAr6hu6n}k;@'),
      }),
    };
  }

  get getRoles() {
    let roles = JSON.parse(localStorage.getItem('roles')!);
    return roles;
  }

  public mobileBankingPostUpdated(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.mobileBankingHost + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public mobileBankingPostNest(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }
}