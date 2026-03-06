import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { GlobalService } from './global.service';
import { AuthService } from './auth.service';
import { map,tap, catchError } from 'rxjs/operators';
import { forkJoin, Observable, throwError,of } from 'rxjs';
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
  post(arg0: string, model: { profileId: any; roleIds: any; active: string; remarks: any; }) {
    throw new Error('Method not implemented.');
  }
  constructor(
    private http: HttpClient,
    private globalService: GlobalService,
    private authService: AuthService,
    private router: Router
  ) {}


  private cytonUrl = 'http://130.61.111.65:5016/api/get_all_charts_kpis'; 
  private apiUrls = 'http://127.0.0.1:5020/api/chat'; 

  // private baseUrl = "http://130.61.111.65:5016"; 
  private baseUrl = "http://130.61.111.65:5016";
  private baseUrls = 'http://localhost:5015/api';
  private apiUrl = `${environment.customerPortalNest}`;

checkTransactionRisk(transactionData: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/real_time_risk_score`, transactionData)
    .pipe(
      tap(response => console.log('Risk assessment response:', response)),
      catchError(this.handleError<any>('checkTransactionRisk', { 
        status: 'error', 
        message: 'Failed to assess transaction risk' 
      }))
    );
}

getFraudHistory(page: number = 1, size: number = 10): Observable<any> {
  return this.http.post(`${this.apiUrl}/fraud_history`, { page, size })
    .pipe(
      tap(response => console.log('Fraud history response:', response)),
      catchError(this.handleError<any>('getFraudHistory', { 
        fraud_transactions: [], 
        pagination: { total: 0 } 
      }))
    );
}

getTransactions(page: number = 1, size: number = 100): Observable<TransactionsResponse> {
  // console.log(`Calling API: ${this.apiUrl}/transactions with page=${page}, size=${size}`);
  
  return this.http.post<TransactionsResponse>(`${this.apiUrl}/transactions`, { page, size })
    .pipe(
      tap(response => console.log('API Response:', response)),
      catchError(this.handleError<TransactionsResponse>('getTransactions', {
        status: 'error',
        message: 'Failed to load transactions',
        transactions: [],
        pagination: { page, size, total: 0, has_more: false }
      }))
    );
}

  // Get model metrics
  getModelMetrics(): Observable<ModelMetrics> {
    return this.http.get<ModelMetrics>(`${this.apiUrl}/model_metrics`)
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

  // Get audit log
  getAuditLog(): Observable<AuditLogResponse> {
    return this.http.get<AuditLogResponse>(`${this.apiUrl}/audit_log`)
      .pipe(
        catchError(this.handleError<AuditLogResponse>('getAuditLog', {
          status: 'error',
          message: 'Failed to load audit log',
          log_count: 0,
          logs: []
        }))
      );
  }

  // Toggle alert mode
  toggleAlertMode(enable: boolean): Observable<AlertModeResponse> {
    return this.http.post<AlertModeResponse>(`${this.apiUrl}/system/alert_mode`, { enable })
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
  return this.http.get(`${this.apiUrl}/system/stats`);
}

  submitFeedback(transactionId: string, feedback: 'confirmed_fraud' | 'false_positive', signals?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fraud_feedback`, {
      transaction_id: transactionId,
      feedback,
      signals
    }).pipe(
      catchError(this.handleError<any>('submitFeedback', { message: 'Failed to submit feedback' }))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
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

  public getEnterpriseUsers(endpoint: string):Observable<any> {
    return this.http.get(this.globalService.customerPortalNest + endpoint)
  }
  public channelManagerLogin(){

  }

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

      getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
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
          // console.log(result)
          localStorage.setItem(
            'userData',
            JSON.stringify(result['data'])
          );
          return result['data'];
        })
      );
    return userDetails$;
  }


  public customerPortalPostData(endpoint: string,model: { page: { toString: () => string | number | boolean; }; size: { toString: () => string | number | boolean; }; }): any {
    const params = new HttpParams()
    .set('page', model.page.toString())
    .set('size', model.size.toString());
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        {params},this.getHeaders()
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

 getHeadersFile(): any {
    return {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + this.globalService.getToken(),
      }),
    };
  }

getHeaders(): any {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.globalService.getToken(),
      }),
    };
  }

   getFormHeaders(): any {
    return {
      headers: new HttpHeaders({
        // Remove 'Content-Type': 'multipart/form-data' - let the browser set it automatically
        'Authorization': 'Bearer ' + this.globalService.getToken()
      })
    };
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