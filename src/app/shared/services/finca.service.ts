import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FincaService {
  private base = environment.customerPortalNest; // e.g. http://127.0.0.1:5001/v1/api

  constructor(private http: HttpClient, private auth: AuthService) {}

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
    const payload: any = { page, size };
    if (status) payload.status = status;
    return this.http.post<any>(`${this.base}/finca/alerts`, payload, this.headers());
  }

  getAlert(alertId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/alerts/${alertId}`, this.headers());
  }

  assignAlert(alertId: string, analyst: string): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/alerts/${alertId}/assign`, { analyst }, this.headers());
  }

  listCases(page = 1, size = 20, status?: string): Observable<any> {
    const payload: any = { page, size };
    if (status) payload.status = status;
    return this.http.post<any>(`${this.base}/finca/cases`, payload, this.headers());
  }

  listFraudHistory(page = 1, size = 20): Observable<any> {
    const payload: any = { page, size };
    return this.http.post<any>(`${this.base}/fraud_history`, payload, this.headers());
  }

  getRelatedTransactions(transactionId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/transactions/related`, { transaction_id: transactionId }, this.headers());
  }

  getTransaction(transactionId: string): Observable<any> {
    // POST /v1/api/transactions with transaction_id in JSON body
    return this.http.post<any>(`${this.base}/transactions`, { transaction_id: transactionId }, this.headers());
  }

  // Lightweight/optimistic client-side actions when backend endpoints are not present.
  escalateCase(caseId: string, level = 'URGENT', analyst = 'Supervisor'): Observable<any> {
    // Use assignCase as a proxy for escalation and tag priority client-side
    return this.assignCase(caseId, analyst);
  }

  allowTransaction(transactionId: string): Observable<any> {
    // No direct 'allow' endpoint; using transactions_delete to remove from active list is destructive.
    // For now we simulate allow by adding feedback note via a no-op POST to cases endpoint if available.
    return this.http.post<any>(`${this.base}/finca/allow_transaction`, { transaction_id: transactionId }, this.headers());
  }

  getCase(caseId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/cases/${caseId}`, this.headers());
  }

  assignCase(caseId: string, analyst: string): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/cases/${caseId}/assign`, { analyst }, this.headers());
  }

  addCaseNote(caseId: string, note: string, analyst = 'Analyst'): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/cases/${caseId}/notes`, { note, analyst }, this.headers());
  }

  resolveCase(caseId: string, resolution: 'FRAUD_CONFIRMED'|'FALSE_POSITIVE', notes = '', analyst = 'Analyst'): Observable<any> {
    return this.http.post<any>(`${this.base}/finca/cases/${caseId}/resolve`, { resolution, notes, analyst }, this.headers());
  }

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.base}/finca/dashboard`, this.headers());
  }

  submitFraudFeedback(transactionId: string, feedback: 'confirmed_fraud' | 'false_positive', signals?: any): Observable<any> {
    return this.http.post<any>(`${this.base}/fraud_feedback`, { transaction_id: transactionId, feedback, signals }, this.headers());
  }

  updateTransactionStatus(transactionId: string, status: string, notes?: string): Observable<any> {
    return this.http.post<any>(`${this.base}/transactions/status`, {
      transaction_id: transactionId,
      status,
      notes,
      action_by: 'Analyst'
    }, this.headers());
  }
}
