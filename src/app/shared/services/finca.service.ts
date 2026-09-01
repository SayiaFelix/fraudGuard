import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FincaService {
  private base = environment.customerPortalNest; // http://localhost:5001/v1/api
  private localDbKey = 'finca_local_db';
  private localData: any = { 
    alerts: [], 
    cases: [], 
    transactions: [], 
    metrics: {},
    feedback: []
  };

  constructor(private http: HttpClient, private auth: AuthService) {
    this.initLocalData();
  }

  // ============= PRIVATE METHODS =============

  private initLocalData(): void {
    try {
      const stored = localStorage.getItem(this.localDbKey);
      if (stored) {
        this.localData = JSON.parse(stored);
        return;
      }
    } catch (e) {
      // ignore
    }
    // Load fallback data if available
    this.http.get<any>('/assets/finca_db.json').subscribe({
      next: (d) => { 
        this.localData = d || this.localData; 
        this.saveLocal(); 
      },
      error: () => { 
        this.saveLocal(); 
      }
    });
  }

  private saveLocal(): void {
    try { 
      localStorage.setItem(this.localDbKey, JSON.stringify(this.localData)); 
    } catch (e) { /* ignore */ }
  }

  private getLocalCases(page = 1, size = 1000): any[] {
    const start = (page - 1) * size;
    return (this.localData.cases || []).slice(start, start + size);
  }

  private getLocalAlerts(page = 1, size = 1000): any[] {
    const start = (page - 1) * size;
    return (this.localData.alerts || []).slice(start, start + size);
  }

  private findLocalTransaction(transactionId: string): any {
    return (this.localData.transactions || []).find(
      (t: any) => t.id === transactionId || t.transaction_id === transactionId
    );
  }

  private headers() {
    const token = this.auth.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      })
    };
  }

  private handleError(operation: string, fallback: any) {
    return (error: any): Observable<any> => {
      console.error(`${operation} failed:`, error);
      return of(fallback);
    };
  }

  // ============= ALERTS =============

createCase(payload: any): Observable<any> {
  return this.http.post<any>(`${this.base}/finca/cases/create`, payload, this.headers()).pipe(
    map((res) => {
      const c = (res && res.case) ? res.case : payload;
      this.localData.cases = this.localData.cases || [];
      const idx = this.localData.cases.findIndex((x: any) => x.id === c.id);
      if (idx >= 0) {
        this.localData.cases[idx] = c;
      } else {
        this.localData.cases.unshift(c);
      }
      this.saveLocal();
      return { status: 'success', case: c };
    }),
    catchError(() => {
      // If backend fails, save locally
      this.localData.cases = this.localData.cases || [];
      this.localData.cases.unshift(payload);
      this.saveLocal();
      return of({ status: 'success', case: payload });
    })
  );
}

  listAlerts(page = 1, size = 1000, status?: string): Observable<any> {
    // Prefer local alerts when available (UI persistence)
    if ((this.localData.alerts || []).length > 0) {
      return of({ 
        status: 'success',
        alerts: this.getLocalAlerts(page, size),
        pagination: {
          page,
          size,
          total: this.localData.alerts.length,
          total_pages: Math.ceil(this.localData.alerts.length / size)
        }
      });
    }

    const payload: any = { page, size };
    if (status) payload.status = status;

    return this.http.post<any>(`${this.base}/finca/alerts`, payload, this.headers()).pipe(
      map((res) => {
        if (res && res.alerts && Array.isArray(res.alerts) && res.alerts.length > 0) {
          this.localData.alerts = res.alerts;
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => of({ 
        status: 'success',
        alerts: this.getLocalAlerts(page, size),
        pagination: { page, size, total: this.localData.alerts.length }
      }))
    );
  }

  /**
   * Get single alert
   * GET /v1/api/finca/alerts/<alert_id>
   */
  getAlert(alertId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/alerts/${alertId}`, this.headers()).pipe(
      catchError(() => of({ 
        alert: (this.localData.alerts || []).find((a: any) => a.id === alertId) 
      }))
    );
  }

  /**
   * Assign alert to analyst
   * POST /v1/api/finca/alerts/<alert_id>/assign
   */
  assignAlert(alertId: string, analyst: string): Observable<any> {
    return this.http.post<any>(
      `${this.base}/finca/alerts/${alertId}/assign`, 
      { analyst }, 
      this.headers()
    ).pipe(
      map((res) => {
        const a = (this.localData.alerts || []).find((x: any) => x.id === alertId);
        if (a) {
          a.status = 'ASSIGNED';
          a.assigned_to = analyst;
          a.assigned_at = res?.alert?.assigned_at || new Date().toISOString();
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        const a = (this.localData.alerts || []).find((x: any) => x.id === alertId);
        if (a) {
          a.status = 'ASSIGNED';
          a.assigned_to = analyst;
          this.saveLocal();
          return of({ success: true, alert: a });
        }
        return of({ success: false });
      })
    );
  }


  markAlertRead(alertId: string): Observable<any> {
    return this.http.post<any>(
      `${this.base}/finca/alerts/${alertId}/read`, 
      {}, 
      this.headers()
    ).pipe(
      map((res) => {
        const a = (this.localData.alerts || []).find((x: any) => x.id === alertId);
        if (a) { 
          a.read = true; 
          this.saveLocal(); 
        }
        return res;
      }),
      catchError(() => {
        const a = (this.localData.alerts || []).find((x: any) => x.id === alertId);
        if (a) { 
          a.read = true; 
          this.saveLocal(); 
          return of({ success: true, alert: a });
        }
        return of({ success: false });
      })
    );
  }

  /**
   * Save alerts locally (for offline/fallback)
   */
  saveAlerts(alerts: any[]): Observable<any> {
    this.localData.alerts = alerts || [];
    this.saveLocal();
    return of({ success: true });
  }

  // ============= CASES =============

  listCases(page = 1, size = 1000, status?: string): Observable<any> {
    // Prefer local cases when available
    if ((this.localData.cases || []).length > 0) {
      return of({ 
        status: 'success',
        cases: this.getLocalCases(page, size),
        pagination: {
          page,
          size,
          total: this.localData.cases.length,
          total_pages: Math.ceil(this.localData.cases.length / size)
        }
      });
    }

    const payload: any = { page, size };
    if (status) payload.status = status;

    return this.http.post<any>(`${this.base}/finca/cases`, payload, this.headers()).pipe(
      map((res) => {
        if (res && res.cases && Array.isArray(res.cases) && res.cases.length > 0) {
          this.localData.cases = res.cases;
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => of({ 
        status: 'success',
        cases: this.getLocalCases(page, size),
        pagination: { page, size, total: this.localData.cases.length }
      }))
    );
  }

  /**
   * Get single case
   * GET /v1/api/finca/cases/<case_id>
   */
  getCase(caseId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/cases/${caseId}`, this.headers()).pipe(
      map((res) => {
        if (res && res.case) {
          this.localData.cases = this.localData.cases || [];
          const idx = this.localData.cases.findIndex((x: any) => x.id === res.case.id);
          if (idx >= 0) {
            this.localData.cases[idx] = res.case;
          } else {
            this.localData.cases.push(res.case);
          }
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => of({ 
        case: (this.localData.cases || []).find((c: any) => c.id === caseId) 
      }))
    );
  }

  /**
   * Assign case to analyst
   * POST /v1/api/finca/cases/<case_id>/assign
   */
  assignCase(caseId: string, analyst: string): Observable<any> {
    return this.http.post<any>(
      `${this.base}/finca/cases/${caseId}/assign`, 
      { analyst }, 
      this.headers()
    ).pipe(
      map((res) => {
        const c = (this.localData.cases || []).find((x: any) => x.id === caseId);
        if (c) {
          c.assigned_to = analyst;
          c.status = 'INVESTIGATING';
          c.assigned_at = res?.case?.assigned_at || new Date().toISOString();
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        const c = (this.localData.cases || []).find((x: any) => x.id === caseId);
        if (c) {
          c.assigned_to = analyst;
          c.status = 'INVESTIGATING';
          this.saveLocal();
          return of({ success: true, case: c });
        }
        return of({ success: false });
      })
    );
  }

  /**
   * Add case note
   * POST /v1/api/finca/cases/<case_id>/notes
   */
  addCaseNote(caseId: string, note: string, analyst = 'Analyst'): Observable<any> {
    return this.http.post<any>(
      `${this.base}/finca/cases/${caseId}/notes`, 
      { note, analyst }, 
      this.headers()
    ).pipe(
      map((res) => {
        const c = (this.localData.cases || []).find((x: any) => x.id === caseId);
        if (c) {
          c.notes = c.notes || [];
          c.notes.push({ 
            timestamp: new Date().toISOString(), 
            analyst, 
            note 
          });
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        const c = (this.localData.cases || []).find((x: any) => x.id === caseId);
        if (c) {
          c.notes = c.notes || [];
          c.notes.push({ 
            timestamp: new Date().toISOString(), 
            analyst, 
            note 
          });
          this.saveLocal();
          return of({ case: c });
        }
        return of({ success: false });
      })
    );
  }

  /**
   * Resolve case
   * POST /v1/api/finca/cases/<case_id>/resolve
   */
  resolveCase(
    caseId: string, 
    resolution: 'FRAUD_CONFIRMED' | 'FALSE_POSITIVE', 
    notes = '', 
    analyst = 'Analyst'
  ): Observable<any> {
    return this.http.post<any>(
      `${this.base}/finca/cases/${caseId}/resolve`, 
      { resolution, notes, analyst }, 
      this.headers()
    ).pipe(
      map((res) => {
        const c = (this.localData.cases || []).find((x: any) => x.id === caseId);
        if (c) {
          c.status = 'RESOLVED';
          c.resolution = {
            verdict: resolution,
            resolved_at: new Date().toISOString(),
            resolved_by: analyst,
            notes
          };
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        const c = (this.localData.cases || []).find((x: any) => x.id === caseId);
        if (c) {
          c.status = 'RESOLVED';
          c.resolution = {
            verdict: resolution,
            resolved_at: new Date().toISOString(),
            resolved_by: analyst,
            notes
          };
          this.saveLocal();
          return of({ case: c });
        }
        return of({ success: false });
      })
    );
  }

  /**
   * Escalate case (uses assign with priority override)
   * POST /v1/api/finca/cases/<case_id>/assign
   */
  escalateCase(caseId: string, level = 'URGENT', analyst = 'Supervisor'): Observable<any> {
    return this.assignCase(caseId, analyst).pipe(
      map((res) => {
        const c = (this.localData.cases || []).find((x: any) => x.id === caseId);
        if (c) {
          c.priority = level;
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        const c = (this.localData.cases || []).find((x: any) => x.id === caseId);
        if (c) {
          c.priority = level;
          this.saveLocal();
          return of({ success: true, case: c });
        }
        return of({ success: false });
      })
    );
  }

  saveCases(cases: any[]): Observable<any> {
    this.localData.cases = cases || [];
    this.saveLocal();
    return of({ success: true });
  }

  updateCaseLocal(caseId: string, changes: any): Observable<any> {
    this.localData.cases = this.localData.cases || [];
    const idx = this.localData.cases.findIndex((x: any) => x.id === caseId);
    if (idx >= 0) {
      this.localData.cases[idx] = { ...this.localData.cases[idx], ...changes };
      this.saveLocal();
      return of({ case: this.localData.cases[idx] });
    }
    return of({ success: false });
  }


  deleteCaseLocal(caseId: string): Observable<any> {
    this.localData.cases = this.localData.cases || [];
    const before = this.localData.cases.length;
    this.localData.cases = this.localData.cases.filter((c: any) => c.id !== caseId);
    this.saveLocal();
    return of({ success: true, removed: before - this.localData.cases.length });
  }

  // ============= TRANSACTIONS =============

  getTransaction(transactionId: string): Observable<any> {
    return this.http.post<any>(
      `${this.base}/transactions`, 
      { transaction_id: transactionId }, 
      this.headers()
    ).pipe(
      map((res) => {
        if (res && (res.transaction_details || res.transaction)) {
          const t = res.transaction_details || res.transaction || res;
          this.localData.transactions = this.localData.transactions || [];
          const idx = this.localData.transactions.findIndex(
            (x: any) => x.id === t.id || x.transaction_id === t.transaction_id
          );
          if (idx >= 0) {
            this.localData.transactions[idx] = t;
          } else {
            this.localData.transactions.push(t);
          }
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        const t = this.findLocalTransaction(transactionId);
        return of(t || { transaction_id: transactionId });
      })
    );
  }

  getRelatedTransactions(transactionId: string): Observable<any> {
    return this.http.post<any>(
      `${this.base}/transactions/related`, 
      { transaction_id: transactionId }, 
      this.headers()
    ).pipe(
      catchError(() => of({ related_transactions: [] }))
    );
  }

  updateTransactionStatus(transactionId: string, status: string, notes?: string): Observable<any> {
    return this.http.post<any>(
      `${this.base}/transactions/status`, 
      {
        transaction_id: transactionId,
        status,
        notes,
        action_by: 'Analyst'
      }, 
      this.headers()
    ).pipe(
      map((res) => {
        const t = this.findLocalTransaction(transactionId);
        if (t) {
          t.status = status;
          t.status_notes = notes;
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        const t = this.findLocalTransaction(transactionId);
        if (t) {
          t.status = status;
          t.status_notes = notes;
          this.saveLocal();
        }
        return of({ success: true });
      })
    );
  }

  allowTransaction(transactionId: string): Observable<any> {
    // Try custom endpoint first, fallback to status update
    return this.http.post<any>(
      `${this.base}/finca/allow_transaction`, 
      { transaction_id: transactionId }, 
      this.headers()
    ).pipe(
      map((res) => {
        const t = this.findLocalTransaction(transactionId);
        if (t) {
          t.allowed = true;
          t.status = 'Approved';
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        // Fallback: update status
        return this.updateTransactionStatus(transactionId, 'Approved', 'Allowed by analyst');
      })
    );
  }

  getFraudHistory(page: number = 1, size: number = 1000): Observable<any> {
    return this.http.post<any>(
      `${this.base}/fraud_history`, 
      { page, size }, 
      this.headers()
    ).pipe(
      catchError(() => of({ 
        fraud_transactions: [], 
        pagination: { total: 0 } 
      }))
    );
  }

  // ============= FEEDBACK =============
  submitFraudFeedback(
    transactionId: string, 
    feedback: 'confirmed_fraud' | 'false_positive', 
    signals?: any
  ): Observable<any> {
    return this.http.post<any>(
      `${this.base}/fraud_feedback`, 
      { transaction_id: transactionId, feedback, signals }, 
      this.headers()
    ).pipe(
      map((res) => {
        this.localData.feedback = this.localData.feedback || [];
        this.localData.feedback.push({
          transaction_id: transactionId,
          feedback,
          signals,
          timestamp: new Date().toISOString()
        });
        this.saveLocal();
        return res;
      }),
      catchError(() => {
        this.localData.feedback = this.localData.feedback || [];
        this.localData.feedback.push({
          transaction_id: transactionId,
          feedback,
          signals,
          timestamp: new Date().toISOString()
        });
        this.saveLocal();
        return of({ success: true });
      })
    );
  }

  // ============= DASHBOARD =============
  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/dashboard`, this.headers()).pipe(
      map((res) => {
        if (res && res.metrics) {
          this.localData.metrics = res.metrics;
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => of({ 
        metrics: this.localData.metrics || {
          total_transactions: 0,
          total_alerts: 0,
          open_cases: 0,
          blocked: 0
        }
      }))
    );
  }

  // ============= SYSTEM =============
  getSystemStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/system/stats`, this.headers()).pipe(
      catchError(() => of({ 
        transactions_analyzed: 0, 
        avg_response_ms: 0,
        model_version: 'v1.0.0',
        threshold: 6.0
      }))
    );
  }

  getModelMetrics(): Observable<any> {
    return this.http.get<any>(`${this.base}/model_metrics`, this.headers()).pipe(
      catchError(() => of({ metrics: {} }))
    );
  }

  getAuditLog(): Observable<any> {
    return this.http.get<any>(`${this.base}/audit_log`, this.headers()).pipe(
      catchError(() => of({ logs: [] }))
    );
  }
  getQueueStatus(): Observable<any> {
    return this.http.get<any>(`${this.base}/queue_status`, this.headers()).pipe(
      catchError(() => of({ 
        active_threads: 0, 
        async_mode: true,
        thread_pool_max_workers: 10
      }))
    );
  }

  toggleAlertMode(enable: boolean): Observable<any> {
    return this.http.post<any>(
      `${this.base}/system/alert_mode`, 
      { enable }, 
      this.headers()
    ).pipe(
      catchError(() => of({ 
        success: false, 
        message: 'Failed to toggle alert mode' 
      }))
    );
  }

  toggleSovereignMode(enable: boolean): Observable<any> {
    return this.http.post<any>(
      `${this.base}/system/sovereign_mode`, 
      { enable }, 
      this.headers()
    ).pipe(
      catchError(() => of({ 
        success: false, 
        message: 'Failed to toggle sovereign mode' 
      }))
    );
  }

  // ============= BATCH / SIMULATION =============

  simulateBatch(count: number = 10, fraud_ratio: number = 0.3): Observable<any> {
    return this.http.post<any>(
      `${this.base}/finca/simulate_batch`, 
      { count, fraud_ratio }, 
      this.headers()
    ).pipe(
      catchError(this.handleError('simulateBatch', { 
        status: 'error', 
        summary: { total: 0 },
        transactions: [] 
      }))
    );
  }


  simulateBatchQuick(): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/simulate_batch/quick`, this.headers()).pipe(
      catchError(this.handleError('simulateBatchQuick', { 
        status: 'error', 
        summary: { total: 0 },
        transactions: [] 
      }))
    );
  }

  getFincaTransactions(page: number = 1, size: number = 1000): Observable<any> {
    return this.http.post<any>(
      `${this.base}/finca/get_transactions`, 
      { page, size }, 
      this.headers()
    ).pipe(
      catchError(this.handleError('getFincaTransactions', { 
        transactions: [], 
        pagination: { total: 0 } 
      }))
    );
  }

  // ============= DATABASE =============

  getDbStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/db/stats`, this.headers()).pipe(
      catchError(this.handleError('getDbStats', { 
        stats: { total_transactions: 0, high_risk_transactions: 0, pending_review: 0 } 
      }))
    );
  }

  getDbTransactions(page: number = 1, size: number = 1000): Observable<any> {
    return this.http.get<any>(
      `${this.base}/db/transactions?page=${page}&size=${size}`, 
      this.headers()
    ).pipe(
      catchError(this.handleError('getDbTransactions', { 
        transactions: [], 
        total: 0 
      }))
    );
  }
}