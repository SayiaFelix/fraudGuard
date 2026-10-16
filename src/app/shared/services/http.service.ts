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

export interface FraudRuleCondition {
  field: string;
  operator: string;
  value?: any;
  amount_threshold?: number;
}

export interface FraudRuleAction {
  risk_points: number;
  decision: string;
  alert: boolean;
}

export interface FraudRule {
  id?: string;
  name: string;
  description: string;
  conditions: FraudRuleCondition;
  action: FraudRuleAction;
  priority: number;
  is_active: boolean;
  category: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  version?: number;
  trigger_count?: number;
  false_positive_rate?: number;
  last_triggered?: string | null;
  deleted_at?: string | null;
}

export interface ChannelMonitoringDateRange {
  from?: string;
  to?: string;
}

export interface ChannelMonitoringOverviewResponse {
  status: string;
  monitoring_status: string;
  period: { from: string; to: string; timezone: string };
  kpis: {
    transactions_monitored: { value: number; change_percent: number };
    fraud_alerts: { value: number; change_percent: number };
    blocked_value: { value: number; currency: string; change_percent: number };
    channel_health_percent: { value: number; change_percent: number };
    peak_throughput_per_minute: { value: number; at: string; change_percent: number };
    false_positive_rate_percent: { value: number; change_percent: number };
  };
  channels: Array<{
    code: string;
    name: string;
    status: string;
    transaction_volume: number;
    fraud_rate_percent: number;
    average_latency_ms: number;
    uptime_percent: number;
    blocked_in_period: number;
  }>;
  summaries: Array<{
    channel_code: string;
    channel: string;
    total_transactions: number;
    flagged: number;
    blocked: number;
    amount_at_risk: number;
    currency: string;
    recovery_rate_percent: number;
    top_threat: string;
  }>;
  generated_at: string;
}

export interface ChannelMonitoringAnalyticsResponse {
  status: string;
  period: { from: string; to: string; interval: string };
  volume_by_channel: {
    categories: string[];
    series: Array<{ channel_code: string; name: string; data: number[] }>;
  };
  blocked_by_channel: Array<{ channel_code: string; name: string; count: number }>;
  fraud_rate_by_channel: Array<{ channel_code: string; name: string; rate_percent: number }>;
  hourly_activity: { categories: string[]; transactions: number[]; fraud_alerts: number[] };
  risk_and_detection_coverage: Array<{
    channel_code: string;
    name: string;
    risk_exposure: number;
    detection_coverage: number;
  }>;
}

export interface ChannelMonitoringTransaction {
  id: string;
  timestamp: string;
  channel_code: string;
  channel: string;
  type: string;
  customer: string;
  amount: number;
  currency: string;
  risk_score: number;
  fraud_flag: 'None' | 'Suspicious' | 'Blocked' | 'Under Review';
  rule_hit: string;
}

export interface ChannelMonitoringTransactionsResponse {
  status: string;
  transactions: ChannelMonitoringTransaction[];
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface FincaDashboardResponse {
  status: string;
  kpis: {
    ai_confidence: {
      available: boolean;
      basis: string;
      evaluated_at: string | null;
      model_name: string | null;
      model_version: string | null;
      reason: string | null;
      unit: string;
      value: number | null;
    };
    fraud_blocked: {
      basis: string;
      currency: string;
      period: string;
      value: number;
    };
    high_risk_alerts: { period: string; value: number };
    total_transactions: { period: string; value: number };
  };
  metrics: {
    blocked: number;
    open_cases: number;
    total_alerts: number;
    total_transactions: number;
  };
  risk_distribution: { [category: string]: number };
}

export interface FincaRiskDistributionResponse {
  status: string;
  period: string;
  total_transactions: number;
  chart: {
    labels: string[];
    datasets: Array<{ label: string; data: number[] }>;
  };
  categories: Array<{ label: string; count: number; percentage: number }>;
}

export interface FincaMlRiskScoreDistributionResponse {
  status: string;
  period: string;
  metric: string;
  x_axis: string;
  y_axis: string;
  total_transactions: number;
  scored_transactions: number;
  unscored_transactions: number;
  observed_score_range: { minimum: number | null; maximum: number | null };
  bucket_policy: string;
  chart: {
    labels: string[];
    datasets: Array<{ label: string; data: number[] }>;
  };
}

export interface RecentTransactionActivity {
  transaction_id: string;
  timestamp: string;
  risk_score: number;
  risk_score_scale: string;
  risk_category: string;
  status: string;
  decision: string;
  recommended_action: string;
  amount: number;
  currency: string;
  customer_id: string;
  channel: string;
}

export interface RecentTransactionActivityResponse {
  status: string;
  sort: string;
  transactions: RecentTransactionActivity[];
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
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
  ) { }

  private cytonUrl = 'http://130.61.111.65:5016/api/get_all_charts_kpis';
  private apiUrls = 'http://127.0.0.1:5020/api/chat';
  private baseUrl = "http://130.61.111.65:5016";
  private baseUrls = 'http://localhost:5015/api';
  private apiUrl = `${environment.customerPortalNest}`;

  // =========================
  // RULE MANAGEMENT APIs
  // =========================

  getRules(): Observable<any> {
    return this.http.get(`${this.apiUrl}/finca/rules`, this.getHeaders()).pipe(
      catchError(this.handleError<any>('getRules', {
        status: 'error',
        rules: [],
        total: 0
      }))
    );
  }

  getRule(ruleId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/finca/rules/${ruleId}`, this.getHeaders()).pipe(
      catchError(this.handleError<any>('getRule', {
        status: 'error',
        rule: null
      }))
    );
  }

  createRule(ruleData: any): Observable<any> {
    const payload = {
      name: ruleData.name,
      description: ruleData.description,
      category: ruleData.category,
      priority: Number(ruleData.priority ?? 1),
      is_active: !!ruleData.is_active,
      conditions: {
        field: ruleData.conditions?.field || '',
        operator: ruleData.conditions?.operator || 'equals',
        value: this.normalizeConditionValue(ruleData.conditions),
        ...(ruleData.conditions?.amount_threshold !== undefined
          ? { amount_threshold: Number(ruleData.conditions.amount_threshold) }
          : {})
      },
      action: {
        risk_points: Number(ruleData.action?.risk_points ?? 0),
        decision: ruleData.action?.decision || 'FLAG',
        alert: !!ruleData.action?.alert
      },
      ...(ruleData.created_by ? { created_by: ruleData.created_by } : {})
    };

    return this.http.post(`${this.apiUrl}/finca/rules`, payload, this.getHeaders()).pipe(
      catchError(this.handleError<any>('createRule', {
        status: 'error',
        message: 'Failed to create rule'
      }))
    );
  }

  updateRule(ruleId: string, ruleData: any): Observable<any> {
    const payload = {
      name: ruleData.name,
      description: ruleData.description,
      category: ruleData.category,
      priority: Number(ruleData.priority ?? 1),
      is_active: !!ruleData.is_active,
      conditions: {
        field: ruleData.conditions?.field || '',
        operator: ruleData.conditions?.operator || 'equals',
        value: this.normalizeConditionValue(ruleData.conditions),
        ...(ruleData.conditions?.amount_threshold !== undefined
          ? { amount_threshold: Number(ruleData.conditions.amount_threshold) }
          : {})
      },
      action: {
        risk_points: Number(ruleData.action?.risk_points ?? 0),
        decision: ruleData.action?.decision || 'FLAG',
        alert: !!ruleData.action?.alert
      },
      ...(ruleData.created_by ? { created_by: ruleData.created_by } : {})
    };

    return this.http.put(`${this.apiUrl}/finca/rules/${ruleId}`, payload, this.getHeaders()).pipe(
      catchError(this.handleError<any>('updateRule', {
        status: 'error',
        message: 'Failed to update rule'
      }))
    );
  }

  toggleRule(ruleId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/rules/${ruleId}/toggle`, {}, this.getHeaders()).pipe(
      catchError(this.handleError<any>('toggleRule', {
        status: 'error',
        message: 'Failed to toggle rule'
      }))
    );
  }

  deleteRule(ruleId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/finca/rules/${ruleId}`, this.getHeaders()).pipe(
      catchError(this.handleError<any>('deleteRule', {
        status: 'error',
        message: 'Failed to delete rule'
      }))
    );
  }

  getRuleStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/finca/rules/stats`, this.getHeaders()).pipe(
      catchError(this.handleError<any>('getRuleStats', {
        status: 'error',
        stats: {
          total_rules: 0,
          active_rules: 0,
          inactive_rules: 0,
          by_category: {},
          top_rules: []
        }
      }))
    );
  }

  simulateRule(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/rules/simulate`, payload, this.getHeaders()).pipe(
      catchError(this.handleError<any>('simulateRule', {
        status: 'error',
        message: 'Simulation failed'
      }))
    );
  }

  private normalizeConditionValue(condition: any): any {
    if (!condition) {
      return '';
    }

    const value = condition.value;

    if (condition.operator === 'between') {
      if (Array.isArray(value)) {
        return value.map((item: any) => this.toPrimitive(item));
      }

      if (typeof value === 'string') {
        const parts = value
          .split(',')
          .map((item: string) => item.trim())
          .filter((item: string) => item !== '');

        return parts.map((item: string) => this.toPrimitive(item));
      }

      return [];
    }

    if (condition.operator === 'is_new') {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return !!value;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed === '') {
        return '';
      }

      if (trimmed === 'true' || trimmed === 'false') {
        return trimmed === 'true';
      }

      const parsedNumber = Number(trimmed);

      if (!Number.isNaN(parsedNumber) && trimmed !== '') {
        return parsedNumber;
      }

      return trimmed;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item: any) => this.toPrimitive(item));
    }

    return value;
  }

  private toPrimitive(value: any): any {
    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed === '') {
        return '';
      }

      if (trimmed === 'true' || trimmed === 'false') {
        return trimmed === 'true';
      }

      const parsedNumber = Number(trimmed);

      if (!Number.isNaN(parsedNumber)) {
        return parsedNumber;
      }

      return trimmed;
    }

    return value;
  }


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
    return this.getTransactions(page, size).pipe(
      map((response) => {
        const transactions = response?.transactions || [];
        const total = response?.pagination?.total ?? transactions.length;
        const pageSize = response?.pagination?.size ?? size;
        const currentPage = response?.pagination?.page ?? page;

        return {
          status: response?.status || 'success',
          message: response?.message || 'Fraud history loaded from transactions',
          fraud_transactions: transactions,
          pagination: {
            page: currentPage,
            size: pageSize,
            total,
            total_pages: Math.max(1, Math.ceil(total / (pageSize || 1))),
            has_next: response?.pagination?.has_more ?? false,
            has_prev: currentPage > 1
          }
        };
      }),
      catchError(this.handleError<any>('getFraudHistory', {
        status: 'error',
        message: 'Failed to load fraud history',
        fraud_transactions: [],
        pagination: { page, size, total: 0, total_pages: 0, has_next: false, has_prev: false }
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
      params = params.set('customer_profile', riskProfile);
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

  // ============= CASE MANAGEMENT HELPERS =============
  saveCases(cases: any[]): Observable<any> {
    try {
      localStorage.setItem('finca_cases', JSON.stringify(cases));
      return of({ success: true });
    } catch (e) {
      console.error('Failed to save cases locally:', e);
      return of({ success: false });
    }
  }

  updateCaseLocal(caseId: string, changes: any): Observable<any> {
    try {
      const stored = localStorage.getItem('finca_cases');
      const cases = stored ? JSON.parse(stored) : [];
      const idx = cases.findIndex((c: any) => c.id === caseId);

      if (idx >= 0) {
        cases[idx] = { ...cases[idx], ...changes };
        localStorage.setItem('finca_cases', JSON.stringify(cases));
        return of({ success: true, case: cases[idx] });
      }

      return of({ success: false, message: 'Case not found' });
    } catch (e) {
      console.error('Failed to update case locally:', e);
      return of({ success: false });
    }
  }

  deleteCaseLocal(caseId: string): Observable<any> {
    try {
      const stored = localStorage.getItem('finca_cases');
      const cases = stored ? JSON.parse(stored) : [];
      const filtered = cases.filter((c: any) => c.id !== caseId);

      localStorage.setItem('finca_cases', JSON.stringify(filtered));

      return of({
        success: true,
        removed: cases.length - filtered.length
      });
    } catch (e) {
      console.error('Failed to delete case locally:', e);
      return of({ success: false });
    }
  }

  getTransaction(transactionId: string): Observable<any> {
    return this.getTransactionById(transactionId);
  }


  /**
   * =====================================================
   * FINCA CASE MANAGEMENT BACKEND APIs
   * =====================================================
   */


  /**
   * CREATE CASE
   * POST /v1/api/finca/cases/create
   */

  createCase(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/cases/create`, payload, this.getHeaders());
  }



  /**
   * LIST CASES
   * POST /v1/api/finca/cases/list
   */
  listCases(
    page: number = 1,
    size: number = 100,
    status?: string
  ): Observable<any> {
    const payload: any = { page, size };

    if (status) {
      payload.status = status;
    }

    return this.http.post(
      `${this.apiUrl}/finca/cases/list`,
      payload,
      this.getHeaders()
    ).pipe(
      catchError((error) => {
        console.error('listCases failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * UPDATE CASE
   * PUT /v1/api/finca/cases/{caseId}
   */

  updateCase(caseId: string, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}`, payload, this.getHeaders());
  }


  /**
   * GET CASE
   * GET /v1/api/finca/cases/{caseId}
   */
  getCase(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/finca/cases/${caseId}`, this.getHeaders())
      .pipe(
        catchError(this.handleError<any>('getCase', {
          status: 'error',
          case: null
        }))
      );
  }

  /**
   * ASSIGN CASE
   * POST /v1/api/finca/cases/assign/{caseId}
   */

  assignCase(caseId: string, analyst: string, priority?: string, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}/assign`,
      { analyst, ...(priority ? { priority } : {}), ...(notes ? { notes } : {}) }, this.getHeaders());
  }


  /**
   * ADD CASE NOTE
   * POST /v1/api/finca/cases/notes/{caseId}
   */

  addCaseNote(caseId: string, note: string, analyst: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}/notes`,
      { note, analyst }, this.getHeaders());
  }


  /**
   * ESCALATE CASE
   * POST /v1/api/finca/cases/escalate/{caseId}
   */

  escalateCase(caseId: string, level: string, reason: string = '', notify: string = 'email', analyst: string = 'Supervisor'): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/cases/escalate/${encodeURIComponent(caseId)}`,
      { level, reason, analyst }, this.getHeaders());
  }


  /**
   * RESOLVE CASE
   * POST /v1/api/finca/cases/resolve/{caseId}
   */

  resolveCase(caseId: string, resolution: string, notes: string, analyst: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}/resolve`,
      { resolution, notes, analyst }, this.getHeaders());
  }


  /**
   * Helper to save a single case locally
   */
  private saveCasesLocally(caseData: any): void {
    try {
      const stored = localStorage.getItem('finca_cases');
      const cases = stored ? JSON.parse(stored) : [];

      const idx = cases.findIndex((c: any) => c.id === caseData.id);

      if (idx >= 0) {
        cases[idx] = {
          ...cases[idx],
          ...caseData
        };
      } else {
        cases.unshift(caseData);
      }

      localStorage.setItem(
        'finca_cases',
        JSON.stringify(cases)
      );
    } catch (e) {
      console.error('Failed to save case locally:', e);
    }
  }



   
  getLocalCases(): any[] {
    try {
      const stored = localStorage.getItem('finca_cases');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }


  /**
   * Clear locally cached cases
   */
  clearLocalCases(): Observable<any> {
    try {
      localStorage.removeItem('finca_cases');
      return of({ success: true });
    } catch (e) {
      return of({ success: false });
    }
  }

  
/**
 * UNASSIGN CASE
 * POST /v1/api/finca/cases/{caseId}/unassign
 */
unassignCase(caseId: string): Observable<any> {
  return this.http.post(
    `${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}/unassign`,
    {},
    this.getHeaders()
  ).pipe(
    catchError((error) => {
      console.error('unassignCase failed:', error);
      return throwError(() => error);
    })
  );
}


/**
 * START CASE INVESTIGATION
 * POST /v1/api/finca/cases/{caseId}/start-investigation
 */

  startCaseInvestigation(caseId: string, reason: string = 'Reviewing suspicious activity'): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}/start-investigation`,
      { reason }, this.getHeaders());
  }




  /**
   * Compatibility method retained because the component currently
   * calls createCaseBackend().
   *
   * It now points to the correct create-case endpoint.
   */

  flagCaseForCompliance(caseId: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}/flag-compliance`, { reason }, this.getHeaders());
  }
  closeCaseBackend(caseId: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}/close`, { reason }, this.getHeaders());
  }
  reopenCaseBackend(caseId: string, reason: string, analyst: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}/reopen`, { reason, analyst }, this.getHeaders());
  }

  createCaseBackend(payload: any): Observable<any> {
    return this.createCase(payload);
  }


  /**
   * Compatibility method retained because existing code may call
   * updateCaseBackend().
   *
   * It now points to the correct update-case endpoint.
   */
  updateCaseBackend(
    caseId: string,
    payload: any
  ): Observable<any> {
    return this.updateCase(caseId, payload);
  }


  /**
   * Existing delete method retained so nothing using it breaks.
   *
   * NOTE:
   * A delete-case API was not included in the endpoints supplied.
   * This keeps the existing backend delete behavior unchanged.
   */

  deleteCaseBackend(caseId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/finca/cases/${encodeURIComponent(caseId)}`,
      { ...this.getHeaders(), observe: 'response' });
  }



  getFincaDashboard(): Observable<FincaDashboardResponse> {
    return this.http.post<FincaDashboardResponse>(
      `${this.apiUrl}/finca/dashboard`,
      {},
      this.getHeaders()
    )
      .pipe(
        catchError(this.handleError<FincaDashboardResponse>('getFincaDashboard', {
          status: 'error',
          kpis: {
            ai_confidence: {
              available: false,
              basis: '',
              evaluated_at: null,
              model_name: null,
              model_version: null,
              reason: 'Dashboard data is unavailable.',
              unit: 'percent',
              value: null
            },
            fraud_blocked: { basis: '', currency: 'KES', period: 'all_time', value: 0 },
            high_risk_alerts: { period: 'all_time', value: 0 },
            total_transactions: { period: 'all_time', value: 0 }
          },
          metrics: { total_transactions: 0, total_alerts: 0, open_cases: 0, blocked: 0 },
          risk_distribution: {}
        }))
      );
  }

  markAlertRead(alertId: string): Observable<any> {
    // Try backend, but don't fail
    return this.http.post(`${this.apiUrl}/finca/alerts/${alertId}/read`, {}, this.getHeaders())
      .pipe(
        catchError(() => {
          // ✅ Just return success locally
          this.updateAlertReadLocally(alertId);
          return of({ status: 'success', local: true });
        })
      );
  }

  private updateAlertReadLocally(alertId: string): void {
    try {
      const stored = localStorage.getItem('finca_alerts');
      if (stored) {
        const alerts = JSON.parse(stored);
        const idx = alerts.findIndex((a: any) => a.id === alertId);
        if (idx >= 0) {
          alerts[idx].read = true;
          localStorage.setItem('finca_alerts', JSON.stringify(alerts));
        }
      }
    } catch (e) { }
  }

  getDashboard(): Observable<any> {
    return this.getFincaDashboard();
  }

  getFincaRiskDistribution(): Observable<FincaRiskDistributionResponse> {
    return this.http.post<FincaRiskDistributionResponse>(
      `${this.apiUrl}/finca/dashboard/risk-distribution`,
      {},
      this.getHeaders()
    );
  }

  getFincaMlRiskScoreDistribution(): Observable<FincaMlRiskScoreDistributionResponse> {
    return this.http.post<FincaMlRiskScoreDistributionResponse>(
      `${this.apiUrl}/finca/dashboard/ml-risk-score-distribution`,
      {},
      this.getHeaders()
    );
  }

  getFincaRecentTransactionActivity(
    page: number = 1,
    size: number = 10
  ): Observable<RecentTransactionActivityResponse> {
    return this.http.post<RecentTransactionActivityResponse>(
      `${this.apiUrl}/finca/dashboard/recent-transaction-activity`,
      { page, size },
      this.getHeaders()
    );
  }

  getChannelMonitoringOverview(
    dateRange: ChannelMonitoringDateRange = {}
  ): Observable<ChannelMonitoringOverviewResponse> {
    return this.http.get<ChannelMonitoringOverviewResponse>(
      `${this.apiUrl}/finca/channel-monitoring/overview`,
      { ...this.getHeaders(), params: this.channelMonitoringParams(dateRange) }
    );
  }

  getChannelMonitoringAnalytics(
    query: ChannelMonitoringDateRange & { interval?: string } = {}
  ): Observable<ChannelMonitoringAnalyticsResponse> {
    return this.http.get<ChannelMonitoringAnalyticsResponse>(
      `${this.apiUrl}/finca/channel-monitoring/analytics`,
      { ...this.getHeaders(), params: this.channelMonitoringParams(query) }
    );
  }

  getChannelMonitoringTransactions(
    query: ChannelMonitoringDateRange & {
      channel?: string;
      flag?: string;
      q?: string;
      page?: number;
      size?: number;
    } = {}
  ): Observable<ChannelMonitoringTransactionsResponse> {
    return this.http.get<ChannelMonitoringTransactionsResponse>(
      `${this.apiUrl}/finca/channel-monitoring/transactions`,
      { ...this.getHeaders(), params: this.channelMonitoringParams(query) }
    );
  }

  private channelMonitoringParams<T extends object>(values: T): HttpParams {
    let params = new HttpParams();
    const entries = Object.entries(values) as Array<[string, string | number | undefined]>;
    entries.forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }


  getFincaTransactions(page: number = 1, size: number = 100): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/get_transactions`, { page, size }, this.getHeaders())
      .pipe(
        catchError(this.handleError<any>('getFincaTransactions', {
          status: 'error',
          transactions: [],
          pagination: { total: 0 }
        }))
      );
  }

  submitFincaTransaction(transactionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/transactions`, transactionData, this.getHeaders())
      .pipe(
        catchError(this.handleError<any>('submitFincaTransaction', {
          status: 'error'
        }))
      );
  }

  allowTransaction(transactionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/finca/allow_transaction`,
      { transaction_id: transactionId }, this.getHeaders());
  }


  getLocalAlerts(): any[] {
    try {
      const stored = localStorage.getItem('finca_alerts');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  updateAlertLocal(alertId: string, changes: any): Observable<any> {
    try {
      const stored = localStorage.getItem('finca_alerts');
      const alerts = stored ? JSON.parse(stored) : [];
      const idx = alerts.findIndex((a: any) => a.id === alertId);
      if (idx >= 0) {
        alerts[idx] = { ...alerts[idx], ...changes };
        localStorage.setItem('finca_alerts', JSON.stringify(alerts));
        return of({ success: true, alert: alerts[idx] });
      }
      return of({ success: false });
    } catch (e) {
      return of({ success: false });
    }
  }

  deleteAlertLocal(alertId: string): Observable<any> {
    try {
      const stored = localStorage.getItem('finca_alerts');
      const alerts = stored ? JSON.parse(stored) : [];
      const filtered = alerts.filter((a: any) => a.id !== alertId);
      localStorage.setItem('finca_alerts', JSON.stringify(filtered));
      return of({ success: true });
    } catch (e) {
      return of({ success: false });
    }
  }

  markAlertsRead(alertIds: string[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/finca/alerts/mark_read`,
      { alert_ids: alertIds },
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('markAlertsRead', {
        status: 'error',
        updated: 0
      }))
    );
  }

  dismissAlerts(alertIds: string[], reason: string = 'Bulk dismissed'): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/finca/alerts/dismiss`,
      { alert_ids: alertIds, reason },
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('dismissAlerts', {
        status: 'error',
        updated: 0
      }))
    );
  }

  getAlertById(alertId: string): Observable<any> {
    return this.getAlert(alertId);
  }

  listAlerts(
    page: number = 1,
    size: number = 20,
    status?: string,
    customerId?: string,
    assignedTo?: string,
    riskLevel?: string,
    search?: string,
    sort?: string
  ): Observable<any> {
    const payload: any = { page, size };

    if (status) payload.status = status;
    if (customerId) payload.customer_id = customerId;
    if (assignedTo) payload.assigned_to = assignedTo;
    if (riskLevel) payload.risk_level = riskLevel;
    if (search) payload.search = search;
    if (sort) payload.sort = sort;

    return this.http.post(`${this.apiUrl}/finca/alerts`, payload, this.getHeaders()).pipe(
      catchError(this.handleError<any>('listAlerts', {
        status: 'error',
        alerts: [],
        pagination: {
          page,
          size,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_prev: false
        }
      }))
    );
  }

  getAlert(alertId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/finca/alerts/${encodeURIComponent(alertId)}`,
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('getAlert', {
        status: 'error',
        alert: null
      }))
    );
  }

  assignAlert(alertId: string, analyst: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/finca/alerts/${encodeURIComponent(alertId)}/assign`,
      { analyst },
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('assignAlert', {
        status: 'error',
        alert: null
      }))
    );
  }

  dismissAlert(alertId: string, reason: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/finca/alerts/${encodeURIComponent(alertId)}/dismiss`,
      { reason },
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('dismissAlert', {
        status: 'error',
        alert: null
      }))
    );
  }

  snoozeAlert(alertId: string, durationMinutes: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/finca/alerts/${encodeURIComponent(alertId)}/snooze`,
      { duration_minutes: durationMinutes },
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('snoozeAlert', {
        status: 'error',
        alert: null
      }))
    );
  }

  escalateAlert(alertId: string, priority: string, reason: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/finca/alerts/${encodeURIComponent(alertId)}/escalate`,
      { priority, reason },
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('escalateAlert', {
        status: 'error',
        alert: null
      }))
    );
  }

  flagAlertForReview(alertId: string, reviewReason: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/finca/alerts/${encodeURIComponent(alertId)}/flag_review`,
      { review_reason: reviewReason },
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('flagAlertForReview', {
        status: 'error',
        alert: null
      }))
    );
  }

  blockAlert(alertId: string, transactionId: string, reason: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/finca/alerts/${encodeURIComponent(alertId)}/block`,
      { transaction_id: transactionId, reason },
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('blockAlert', {
        status: 'error',
        alert: null
      }))
    );
  }

  challengeCustomer(alertId: string, message: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/finca/alerts/${encodeURIComponent(alertId)}/challenge`,
      { message },
      this.getHeaders()
    ).pipe(
      catchError(this.handleError<any>('challengeCustomer', {
        status: 'error',
        alert: null
      }))
    );
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

  public channelManagerLogin() { }

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

  getFraudReportKpis(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reports/kpis`,
      {},
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>('getFraudReportKpis', {
          status: 'error',
          metrics: {
            total_fraud_cases: 0,
            amount_at_risk: 0,
            detection_rate: 0,
            false_positive_rate: 0,
            avg_resolution_time_hours: 0,
            compliance_score: 0
          },
          data_quality: {}
        })
      )
    );
  }

  // =====================================================
  // FRAUD REPORTING APIs
  // =====================================================

  getFraudMonthlyTrend(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reports/monthly-trend`,
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>('getFraudMonthlyTrend', {
          status: 'error',
          series: []
        })
      )
    );
  }

  getFraudTypes(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reports/fraud-types`,
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>('getFraudTypes', {
          status: 'error',
          total_confirmed_fraud_cases: 0,
          series: []
        })
      )
    );
  }

  getFraudByChannel(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reports/fraud-by-channel`,
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>('getFraudByChannel', {
          status: 'error',
          total_flagged_transactions: 0,
          series: []
        })
      )
    );
  }

  getDetectionRecovery(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reports/detection-recovery`,
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>('getDetectionRecovery', {
          status: 'error',
          series: []
        })
      )
    );
  }

  getDetectionSource(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reports/detection-source`,
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>('getDetectionSource', {
          status: 'error',
          total_confirmed_fraud_cases: 0,
          series: []
        })
      )
    );
  }

  getRegionalFraudHeatmap(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reports/regional-activity-heatmap`,
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>('getRegionalFraudHeatmap', {
          status: 'error',
          series: []
        })
      )
    );
  }

  getTopFraudPatterns(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reports/top-fraud-patterns`,
      {},
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>('getTopFraudPatterns', {
          status: 'error',
          summary: {},
          patterns: []
        })
      )
    );
  }

  getRecentFraudReports(
    payload: {
      page?: number;
      page_size?: number;
      search?: string;
      channel?: string;
      status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reports/recent-fraud-reports`,
      payload,
      this.getHeaders()
    ).pipe(
      catchError(
        this.handleError<any>('getRecentFraudReports', {
          status: 'error',
          reports: [],
          pagination: {
            page: 1,
            page_size: 10,
            total_reports: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false
          }
        })
      )
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