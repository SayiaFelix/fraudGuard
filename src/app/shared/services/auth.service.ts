// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5001/v1/api/auth';
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'current_user';

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const user = localStorage.getItem(this.userKey);
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password })
      .pipe(tap((response: any) => {
        if (response.access_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          localStorage.setItem(this.refreshTokenKey, response.refresh_token);
          localStorage.setItem(this.userKey, JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      }));
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
}