// src/app/shared/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.customerPortalNest}`
  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'current_user';

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public redirectURL: string | null = null;

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const user = localStorage.getItem(this.userKey);
    if (user) {
      try {
        this.currentUserSubject.next(JSON.parse(user));
        console.log('Loaded stored user:', JSON.parse(user));
      } catch (e) {
        console.error('Error parsing stored user', e);
        this.logout();
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { 
      username: email, 
      password: password 
    }).pipe(tap((response: any) => {
      if (response.access_token) {
        console.log('Login response:', response);
        
        localStorage.setItem(this.tokenKey, response.access_token);
        localStorage.setItem(this.refreshTokenKey, response.refresh_token);
        localStorage.setItem(this.userKey, JSON.stringify(response.user));
        localStorage.setItem('userRole', response.user?.role || 'admin');
        localStorage.setItem('userEmail', response.user?.email || email);
        localStorage.setItem('userName', response.user?.username || email.split('@')[0]);
        
        console.log('Stored in localStorage:', {
          token: !!localStorage.getItem(this.tokenKey),
          role: localStorage.getItem('userRole'),
          email: localStorage.getItem('userEmail')
        });
        
        this.currentUserSubject.next(response.user);
      }
    }));
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/auth/logout`, { refresh_token: refreshToken }).subscribe({
        next: () => console.log('Logged out from server'),
        error: (err) => console.error('Logout error:', err)
      });
    }
    
    // Clear storage
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    
    this.currentUserSubject.next(null);
    console.log('Local storage cleared on logout');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    console.log('isAuthenticated - Token exists?', !!token);
    
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = payload.exp * 1000 < Date.now();
      if (expired) {
        console.log('Token expired');
        this.logout();
        return false;
      }
      console.log('Token valid, expires:', new Date(payload.exp * 1000));
      return true;
    } catch (e) {
      console.error('Error checking token:', e);
      return false;
    }
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    return this.http.post(`${this.apiUrl}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(tap((response: any) => {
        if (response.access_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
        }
      }));
  }
}