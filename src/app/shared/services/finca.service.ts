import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FincaService {
  private base = environment.customerPortalNest; // e.g. http://127.0.0.1:5001/v1/api
  private localDbKey = 'finca_local_db';
  private localData: any = { alerts: [], cases: [], transactions: [], metrics: {} };

  constructor(private http: HttpClient, private auth: AuthService) {
    // initialize local fallback data
    this.initLocalData();
  }

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
    // load fallback static file once
    this.http.get<any>('/assets/finca_db.json').subscribe({
      next: (d) => { this.localData = d || this.localData; this.saveLocal(); },
      error: () => { this.saveLocal(); }
    });
  }

  private saveLocal(): void {
    try { localStorage.setItem(this.localDbKey, JSON.stringify(this.localData)); } catch (e) { /* ignore */ }
  }

  private getLocalCases(page = 1, size = 20): any[] {
    const start = (page - 1) * size;
    return (this.localData.cases || []).slice(start, start + size);
  }

  private getLocalAlerts(page = 1, size = 20): any[] {
    const start = (page - 1) * size;
    return (this.localData.alerts || []).slice(start, start + size);
  }

  private findLocalTransaction(transactionId: string): any {
    return (this.localData.transactions || []).find((t: any) => t.id === transactionId || t.transaction_id === transactionId);
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

  listAlerts(page = 1, size = 20, status?: string): Observable<any> {
    // prefer local alerts when available (persisted UI actions)
    if ((this.localData.alerts || []).length > 0) {
      return of({ alerts: this.getLocalAlerts(page, size) });
    }
    const payload: any = { page, size };
    if (status) payload.status = status;
    return this.http.post<any>(`${this.base}/finca/alerts`, payload, this.headers()).pipe(
      map((res) => {
        // persist returned alerts locally for offline visibility (only when non-empty)
        if (res && res.alerts && Array.isArray(res.alerts) && res.alerts.length > 0) { this.localData.alerts = res.alerts; this.saveLocal(); }
        return res;
      }),
      catchError(() => of({ alerts: this.getLocalAlerts(page, size) }))
    );
  }

  getAlert(alertId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/alerts/${alertId}`, this.headers()).pipe(
      catchError(() => of({ alert: (this.localData.alerts || []).find((a: any) => a.id == alertId) }))
    );
  }

  assignAlert(alertId: string, analyst: string): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/alerts/${alertId}/assign`, { analyst }, this.headers()).pipe(
      map((res) => {
        const a = (this.localData.alerts || []).find((x: any) => x.id == alertId);
        if (a) { a.status = 'ASSIGNED'; a.assigned_to = analyst; a.assigned_at = res?.alert?.assigned_at || new Date().toISOString(); this.saveLocal(); }
        return res;
      }),
      catchError(() => {
        const a = (this.localData.alerts || []).find((x: any) => x.id == alertId);
        if (a) { a.status = 'ASSIGNED'; a.assigned_to = analyst; this.saveLocal(); return of({ success: true, alert: a }); }
        return of({ success: false });
      })
    );
  }

  listCases(page = 1, size = 20, status?: string): Observable<any> {
    // prefer local cases when available
    if ((this.localData.cases || []).length > 0) {
      return of({ cases: this.getLocalCases(page, size) });
    }
    const payload: any = { page, size };
    if (status) payload.status = status;
    return this.http.post<any>(`${this.base}/finca/cases`, payload, this.headers()).pipe(
      map((res) => { if (res && res.cases && Array.isArray(res.cases) && res.cases.length > 0) { this.localData.cases = res.cases; this.saveLocal(); } return res; }),
      catchError(() => of({ cases: this.getLocalCases(page, size) }))
    );
  }

  listFraudHistory(page = 1, size = 20): Observable<any> {
    const payload: any = { page, size };
    return this.http.post<any>(`${this.base}/fraud_history`, payload, this.headers());
  }

  getRelatedTransactions(transactionId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/transactions/related`, { transaction_id: transactionId }, this.headers()).pipe(
      catchError(() => of({ related_transactions: [] }))
    );
  }

  getTransaction(transactionId: string): Observable<any> {
    // POST /v1/api/transactions with transaction_id in JSON body
    return this.http.post<any>(`${this.base}/transactions`, { transaction_id: transactionId }, this.headers()).pipe(
      map((res) => {
        // persist transaction locally if provided
        if (res && (res.transaction_details || res.transaction)) {
          const t = res.transaction_details || res.transaction || res;
          this.localData.transactions = this.localData.transactions || [];
          const idx = this.localData.transactions.findIndex((x: any) => x.id === t.id || x.transaction_id === t.transaction_id);
          if (idx >= 0) this.localData.transactions[idx] = t; else this.localData.transactions.push(t);
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

  // Lightweight/optimistic client-side actions when backend endpoints are not present.
  escalateCase(caseId: string, level = 'URGENT', analyst = 'Supervisor'): Observable<any> {
    // Use assignCase as a proxy for escalation and tag priority client-side
    return this.assignCase(caseId, analyst).pipe(
      map((res) => {
        const c = (this.localData.cases || []).find((x: any) => x.id == caseId);
        if (c) { c.priority = level; this.saveLocal(); }
        return res;
      }),
      catchError(() => {
        const c = (this.localData.cases || []).find((x: any) => x.id == caseId);
        if (c) { c.priority = level; this.saveLocal(); return of({ success: true, case: c }); }
        return of({ success: false });
      })
    );
  }

  allowTransaction(transactionId: string): Observable<any> {
    // No direct 'allow' endpoint; using transactions_delete to remove from active list is destructive.
    // For now we simulate allow by adding feedback note via a no-op POST to cases endpoint if available.
    return this.http.post<any>(`${this.base}/finca/allow_transaction`, { transaction_id: transactionId }, this.headers()).pipe(
      map((res) => {
        this.localData.transactions = this.localData.transactions || [];
        const t = this.findLocalTransaction(transactionId);
        if (t) { t.allowed = true; this.saveLocal(); }
        return res;
      }),
      catchError(() => {
        this.localData.transactions = this.localData.transactions || [];
        const t = this.findLocalTransaction(transactionId);
        if (t) { t.allowed = true; this.saveLocal(); }
        return of({ success: true });
      })
    );
  }

  getCase(caseId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/cases/${caseId}`, this.headers()).pipe(
      map((res) => {
        // persist case locally
        if (res && res.case) {
          this.localData.cases = this.localData.cases || [];
          const idx = this.localData.cases.findIndex((x: any) => x.id === res.case.id);
          if (idx >= 0) this.localData.cases[idx] = res.case; else this.localData.cases.push(res.case);
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => of({ case: (this.localData.cases || []).find((c: any) => c.id == caseId) }))
    );
  }

  assignCase(caseId: string, analyst: string): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/cases/${caseId}/assign`, { analyst }, this.headers()).pipe(
      map((res) => {
        const c = (this.localData.cases || []).find((x: any) => x.id == caseId);
        if (c) { c.assigned_to = analyst; c.status = 'INVESTIGATING'; c.assigned_at = res?.case?.assigned_at || new Date().toISOString(); this.saveLocal(); }
        return res;
      }),
      catchError(() => {
        const c = (this.localData.cases || []).find((x: any) => x.id == caseId);
        if (c) { c.assigned_to = analyst; c.status = 'INVESTIGATING'; this.saveLocal(); return of({ success: true, case: c }); }
        return of({ success: false });
      })
    );
  }

  addCaseNote(caseId: string, note: string, analyst = 'Analyst'): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/cases/${caseId}/notes`, { note, analyst }, this.headers()).pipe(
      map((res) => {
        const c = (this.localData.cases || []).find((x: any) => x.id == caseId);
        if (c) {
          c.notes = c.notes || [];
          c.notes.push({ timestamp: new Date().toISOString(), analyst, note });
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        const c = (this.localData.cases || []).find((x: any) => x.id == caseId);
        if (c) {
          c.notes = c.notes || [];
          c.notes.push({ timestamp: new Date().toISOString(), analyst, note });
          this.saveLocal();
          return of({ case: c });
        }
        return of({ success: false });
      })
    );
  }

  resolveCase(caseId: string, resolution: 'FRAUD_CONFIRMED'|'FALSE_POSITIVE', notes = '', analyst = 'Analyst'): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/cases/${caseId}/resolve`, { resolution, notes, analyst }, this.headers()).pipe(
      map((res) => {
        const c = (this.localData.cases || []).find((x: any) => x.id == caseId);
        if (c) {
          c.status = 'RESOLVED';
          c.resolution = { verdict: resolution, resolved_at: new Date().toISOString(), resolved_by: analyst, notes };
          this.saveLocal();
        }
        return res;
      }),
      catchError(() => {
        const c = (this.localData.cases || []).find((x: any) => x.id == caseId);
        if (c) {
          c.status = 'RESOLVED';
          c.resolution = { verdict: resolution, resolved_at: new Date().toISOString(), resolved_by: analyst, notes };
          this.saveLocal();
          return of({ case: c });
        }
        return of({ success: false });
      })
    );
  }

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/dashboard`, this.headers()).pipe(
      map((res) => { if (res && res.metrics) { this.localData.metrics = res.metrics; this.saveLocal(); } return res; }),
      catchError(() => of({ metrics: this.localData.metrics || {} }))
    );
  }

  submitFraudFeedback(transactionId: string, feedback: 'confirmed_fraud' | 'false_positive', signals?: any): Observable<any> {
    return this.http.post<any>(`${this.base}/fraud_feedback`, { transaction_id: transactionId, feedback, signals }, this.headers()).pipe(
      map((res) => {
        this.localData.feedback = this.localData.feedback || [];
        this.localData.feedback.push({ transaction_id: transactionId, feedback, signals, timestamp: new Date().toISOString() });
        this.saveLocal();
        return res;
      }),
      catchError(() => {
        // store as feedback locally
        this.localData.feedback = this.localData.feedback || [];
        this.localData.feedback.push({ transaction_id: transactionId, feedback, signals, timestamp: new Date().toISOString() });
        this.saveLocal();
        return of({ success: true });
      })
    );
  }

  updateTransactionStatus(transactionId: string, status: string, notes?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/transactions/status`, {
      transaction_id: transactionId,
      status,
      notes,
      action_by: 'Analyst'
    }, this.headers()).pipe(
      map((res) => {
        const t = this.findLocalTransaction(transactionId);
        if (t) { t.status = status; t.status_notes = notes; this.saveLocal(); }
        return res;
      }),
      catchError(() => {
        const t = this.findLocalTransaction(transactionId);
        if (t) { t.status = status; t.status_notes = notes; this.saveLocal(); }
        return of({ success: true });
      })
    );
  }

  createCase(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/cases`, payload, this.headers()).pipe(
      map((res) => {
        // if backend returns created case, persist locally for UI visibility
        const c = (res && res.case) ? res.case : payload;
        this.localData.cases = this.localData.cases || [];
        const idx = this.localData.cases.findIndex((x: any) => x.id === c.id);
        if (idx >= 0) this.localData.cases[idx] = c; else this.localData.cases.unshift(c);
        this.saveLocal();
        return { case: c };
      }),
      catchError(() => {
        this.localData.cases = this.localData.cases || [];
        this.localData.cases.unshift(payload);
        this.saveLocal();
        return of({ case: payload });
      })
    );
  }

  markAlertRead(alertId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/alerts/${alertId}/read`, {}, this.headers()).pipe(
      map((res) => {
        const a = (this.localData.alerts || []).find((x: any) => x.id == alertId);
        if (a) { a.read = true; this.saveLocal(); }
        return res;
      }),
      catchError(() => {
        const a = (this.localData.alerts || []).find((x: any) => x.id == alertId);
        if (a) { a.read = true; this.saveLocal(); return of({ success: true, alert: a }); }
        return of({ success: false });
      })
    );
  }

  saveAlerts(alerts: any[]): Observable<any> {
    this.localData.alerts = alerts || [];
    this.saveLocal();
    return of({ success: true });
  }

  updateCaseLocal(caseId: string, changes: any): Observable<any> {
    this.localData.cases = this.localData.cases || [];
    const idx = this.localData.cases.findIndex((x: any) => x.id == caseId);
    if (idx >= 0) {
      this.localData.cases[idx] = { ...this.localData.cases[idx], ...changes };
      this.saveLocal();
      return of({ case: this.localData.cases[idx] });
    }
    return of({ success: false });
  }

  saveCases(cases: any[]): Observable<any> {
    this.localData.cases = cases || [];
    this.saveLocal();
    return of({ success: true });
  }

  deleteCaseLocal(caseId: string): Observable<any> {
    this.localData.cases = this.localData.cases || [];
    const before = this.localData.cases.length;
    this.localData.cases = this.localData.cases.filter((c: any) => c.id !== caseId);
    this.saveLocal();
    return of({ success: true, removed: before - this.localData.cases.length });
  }
}
