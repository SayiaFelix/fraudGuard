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
  private displayNameKey = 'userDisplayName';
  private userTitleKey = 'userTitle';

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
        // console.log('Loaded stored user:', JSON.parse(user));
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
        // console.log('Login response:', response);
        
        localStorage.setItem(this.tokenKey, response.access_token);
        localStorage.setItem(this.refreshTokenKey, response.refresh_token);
        localStorage.setItem(this.userKey, JSON.stringify(response.user));
        localStorage.setItem('userRole', response.user?.role || 'admin');
        localStorage.setItem('userEmail', response.user?.email || email);
        localStorage.setItem('userName', response.user?.username || email.split('@')[0]);
        localStorage.setItem(this.displayNameKey, this.resolveDisplayName(response.user, email));
        localStorage.setItem(this.userTitleKey, this.resolveUserTitle(response.user));
        
        // console.log('Stored in localStorage:', {
        //   token: !!localStorage.getItem(this.tokenKey),
        //   role: localStorage.getItem('userRole'),
        //   email: localStorage.getItem('userEmail')
        // });
        
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
    localStorage.removeItem(this.displayNameKey);
    localStorage.removeItem(this.userTitleKey);
    
    this.currentUserSubject.next(null);
    console.log('Local storage cleared on logout');
  }

getToken(): string | null {

  const token = localStorage.getItem('access_token') || 
                localStorage.getItem('token') || 
                sessionStorage.getItem('access_token');
  
  // console.log('getToken - Retrieved:', token ? `${token.substring(0, 20)}...` : 'null');
  return token;
}

isAuthenticated(): boolean {
  const token = this.getToken();
  console.log('isAuthenticated - Token exists?', !!token);
  
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expired = payload.exp * 1000 < Date.now();
    // console.log('isAuthenticated - Expired?', expired);
    if (expired) {
      this.logout();
      return false;
    }
    return true;
  } catch (e) {
    // console.error('Error checking token:', e);
    return false;
  }
}

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    return localStorage.getItem('userRole');
  }

  getUserDisplayName(): string {
    return localStorage.getItem(this.displayNameKey) || 'User';
  }

  getUserTitle(): string {
    const title = localStorage.getItem(this.userTitleKey);
    if (title) return title;
    const role = this.getUserRole();
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  }

  private resolveDisplayName(user: any, email: string): string {
    if (user?.full_name) return user.full_name;
    if (user?.name) return user.name;
    if (user?.display_name) return user.display_name;
    const username = user?.username || email.split('@')[0];
    return username
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  private resolveUserTitle(user: any): string {
    if (user?.title) return user.title;
    if (user?.job_title) return user.job_title;
    const role = user?.role || 'admin';
    return role.charAt(0).toUpperCase() + role.slice(1);
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