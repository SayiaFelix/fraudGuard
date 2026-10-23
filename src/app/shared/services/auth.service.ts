
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.customerPortalNest}`;

  private tokenKey = 'access_token';
  private refreshTokenKey = 'refresh_token';
  private userKey = 'current_user';
  private displayNameKey = 'userDisplayName';
  private userTitleKey = 'userTitle';

  private passwordChangeTokenKey = 'password_change_token';
  private passwordChangeUsernameKey = 'password_change_username';
  private passwordChangeExpiryKey = 'password_change_expires_at';

  private currentUserSubject = new BehaviorSubject<any>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public redirectURL: string | null = null;

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  // =====================================================
  // LOAD STORED USER
  // =====================================================

  private loadStoredUser(): void {

    const user = localStorage.getItem(this.userKey);

    if (!user) {
      return;
    }

    try {
      this.currentUserSubject.next(JSON.parse(user));
    } catch (error) {
      console.error('Invalid stored user information');
      this.clearLocalSession();
    }
  }

  // =====================================================
  // LOGIN
  // POST /v1/api/auth/login
  // =====================================================

  login(
    username: string,
    password: string
  ): Observable<any> {

    // Frontend demo. POST /v1/api/auth/login is not called.
    const demoUser = {
      username: (username || 'demo.user').trim(),
      email: 'demo.user@ubagroup.com',
      role: 'analyst',
      name: 'Demo User',
      title: 'Bank Officer'
    };
    const demoResponse = {
      access_token: 'frontend-demo-token',
      refresh_token: 'frontend-demo-refresh',
      user: demoUser
    };

    return of(demoResponse).pipe(
      tap(() => {
        this.saveAuthenticatedSession(demoResponse, demoUser.username);
      })
    );

    // return this.http.post<any>(
    //   `${this.apiUrl}/auth/login`,
    //   {
    //     username: username.trim(),
    //     password
    //   }
    // ).pipe(
    //   tap((response: any) => {
    //     if (
    //       response?.must_change_password === true ||
    //       response?.status === 'password_change_required'
    //     ) {
    //       if (!response?.password_change_token) {
    //         throw new Error('Password change token missing from login response.');
    //       }
    //       this.clearLocalSession();
    //       this.clearPasswordChangeSession();
    //       sessionStorage.setItem(this.passwordChangeTokenKey, response.password_change_token);
    //       sessionStorage.setItem(this.passwordChangeUsernameKey, username.trim());
    //       if (response.expires_at) {
    //         sessionStorage.setItem(this.passwordChangeExpiryKey, response.expires_at);
    //       }
    //       return;
    //     }
    //     if (response?.access_token && response?.refresh_token && response?.user) {
    //       this.clearPasswordChangeSession();
    //       this.saveAuthenticatedSession(response, username);
    //       return;
    //     }
    //     throw new Error('Invalid authentication response from server.');
    //   })
    // );
  }

  // =====================================================
  // SAVE NORMAL AUTHENTICATED SESSION
  // =====================================================

  private saveAuthenticatedSession(
    response: any,
    username: string
  ): void {

    const user = response.user;

    localStorage.setItem(
      this.tokenKey,
      response.access_token
    );

    localStorage.setItem(
      this.refreshTokenKey,
      response.refresh_token
    );

    localStorage.setItem(
      this.userKey,
      JSON.stringify(user)
    );

    localStorage.setItem(
      'userRole',
      user.role || ''
    );

    localStorage.setItem(
      'userEmail',
      user.email || ''
    );

    localStorage.setItem(
      'userName',
      user.username || username
    );

    localStorage.setItem(
      this.displayNameKey,
      this.resolveDisplayName(user, username)
    );

    localStorage.setItem(
      this.userTitleKey,
      this.resolveUserTitle(user)
    );

    localStorage.setItem(
      'isLoggedin',
      'true'
    );

    this.currentUserSubject.next(user);
  }

  // =====================================================
  // FIRST-TIME PASSWORD CHANGE
  // POST /v1/api/auth/change-password
  // =====================================================

  setFirstTimePassword(
    newPassword: string,
    confirmPassword: string
  ): Observable<any> {

    // POST /v1/api/auth/change-password is disabled in the frontend demo.
    return throwError(() => new Error('Password change is disabled in the frontend demo.'));

    // const restrictedToken = this.getPasswordChangeToken();
    // if (!restrictedToken) {
    //   return throwError(() => new Error('Password setup session missing or expired.'));
    // }
    // return this.http.post<any>(
    //   `${this.apiUrl}/auth/change-password`,
    //   {
    //     password_change_token: restrictedToken,
    //     new_password: newPassword,
    //     confirm_password: confirmPassword
    //   },
    //   { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    // ).pipe(tap(() => {
    //   this.clearPasswordChangeSession();
    //   this.clearLocalSession();
    // }));
  }

  // =====================================================
  // RESTRICTED TOKEN
  // =====================================================

  getPasswordChangeToken(): string | null {

    const token = sessionStorage.getItem(
      this.passwordChangeTokenKey
    );

    const expiry = sessionStorage.getItem(
      this.passwordChangeExpiryKey
    );

    if (expiry) {

      const expiryTime = new Date(expiry).getTime();

      if (
        !Number.isNaN(expiryTime) &&
        Date.now() >= expiryTime
      ) {

        this.clearPasswordChangeSession();

        return null;
      }
    }

    return token;
  }

  getPasswordChangeUsername(): string {

    return sessionStorage.getItem(
      this.passwordChangeUsernameKey
    ) || '';
  }

  getPasswordChangeExpiry(): string | null {

    return sessionStorage.getItem(
      this.passwordChangeExpiryKey
    );
  }

  clearPasswordChangeSession(): void {

    sessionStorage.removeItem(
      this.passwordChangeTokenKey
    );

    sessionStorage.removeItem(
      this.passwordChangeUsernameKey
    );

    sessionStorage.removeItem(
      this.passwordChangeExpiryKey
    );
  }

  // =====================================================
  // CURRENT USER
  // GET /v1/api/auth/me
  // =====================================================

  fetchCurrentUser(): Observable<any> {

    // GET /v1/api/auth/me is disabled in the frontend demo.
    return of(this.getCurrentUser());

    // const token = this.getToken();
    // if (!token) {
    //   return throwError(() => new Error('No authentication token available.'));
    // }
    // return this.http.get<any>(`${this.apiUrl}/auth/me`, {
    //   headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    // });
  }

  // =====================================================
  // GET NORMAL ACCESS TOKEN
  // =====================================================

  getToken(): string | null {

    return localStorage.getItem(this.tokenKey);
  }

  // =====================================================
  // CHECK AUTHENTICATION STATUS
  // =====================================================

  isAuthenticated(): boolean {

    const token = this.getToken();

    if (!token) {
      return false;
    }

    try {

      const parts = token.split('.');

      if (parts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(
        atob(
          parts[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
        )
      );

      if (
        typeof payload.exp !== 'number' ||
        payload.exp * 1000 <= Date.now()
      ) {

        this.clearLocalSession();

        return false;
      }

      return true;

    } catch (error) {

      return false;
    }
  }

  // =====================================================
  // USER DETAILS
  // =====================================================

  getCurrentUser(): any {

    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {

    return localStorage.getItem('userRole');
  }

  getUserDisplayName(): string {

    return localStorage.getItem(
      this.displayNameKey
    ) || 'User';
  }

  getUserTitle(): string {

    const title = localStorage.getItem(
      this.userTitleKey
    );

    if (title) {
      return title;
    }

    const role = this.getUserRole();

    return role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : 'User';
  }

  // =====================================================
  // DISPLAY NAME HELPERS
  // =====================================================

  private resolveDisplayName(
    user: any,
    username: string
  ): string {

    if (user?.full_name) {
      return user.full_name;
    }

    if (user?.name) {
      return user.name;
    }

    if (user?.display_name) {
      return user.display_name;
    }

    const resolvedUsername =
      user?.username || username;

    return resolvedUsername
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, (character: string) =>
        character.toUpperCase()
      );
  }

  private resolveUserTitle(user: any): string {

    if (user?.title) {
      return user.title;
    }

    if (user?.job_title) {
      return user.job_title;
    }

    const role = user?.role || '';

    return role
      ? role.charAt(0).toUpperCase() + role.slice(1)
      : 'User';
  }

  // =====================================================
  // REFRESH ACCESS TOKEN
  // Endpoint exists in previous implementation;
  // confirm backend contract.
  // =====================================================

  refreshToken(): Observable<any> {

    // POST /auth/refresh is disabled in the frontend demo.
    return of({ access_token: 'frontend-demo-token' });

    // const refreshToken = localStorage.getItem(this.refreshTokenKey);
    // if (!refreshToken) {
    //   return throwError(() => new Error('Refresh token not available.'));
    // }
    // return this.http.post<any>(`${this.apiUrl}/auth/refresh`, { refresh_token: refreshToken });
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    // Frontend demo: POST /auth/logout is not called,
    // and the local demo session stays on this browser.
    // const refreshToken = localStorage.getItem(this.refreshTokenKey);
    // this.clearLocalSession();
    // this.clearPasswordChangeSession();
    // if (refreshToken) {
    //   this.http.post(`${this.apiUrl}/auth/logout`, { refresh_token: refreshToken }).subscribe({
    //     next: () => {},
    //     error: () => {}
    //   });
    // }
  }

  // =====================================================
  // CLEAR LOCAL AUTHENTICATION
  // =====================================================

  private clearLocalSession(): void {

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);

    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');

    localStorage.removeItem(this.displayNameKey);
    localStorage.removeItem(this.userTitleKey);

    localStorage.removeItem('isLoggedin');

    // Remove older token keys to prevent
    // accidental fallback authentication.
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');

    this.currentUserSubject.next(null);
  }

  // =====================================================
  // LEGACY REGISTRATION
  // Not used by the invitation-only authentication flow.
  // =====================================================

  register(userData: any): Observable<any> {

    // POST /auth/register is disabled in the frontend demo.
    return throwError(() => new Error('Registration is disabled in the frontend demo.'));
    // return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

}
