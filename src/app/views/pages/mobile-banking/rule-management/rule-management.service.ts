import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RuleService {
  // Update this URL to match your Flask server address
  private baseUrl = 'http://localhost:5001/v1/api/finca/rules';
  constructor(private http: HttpClient) {}

  getRules(): Observable<any> {
    return this.http.get(`${this.baseUrl}`);
  }

  createRule(ruleData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}`, ruleData);
  }

  toggleRule(ruleId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${ruleId}/toggle`, {});
  }

  simulateRule(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/simulate`, payload);
  }
}