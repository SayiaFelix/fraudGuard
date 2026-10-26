
import { Injectable } from '@angular/core';

import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private readonly apiBaseUrl =
    environment.customerPortalNest.replace(/\/+$/, '');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    // =====================================================
    // IDENTIFY FRAUD GUARD API REQUESTS
    // =====================================================

    const apiPath = `${this.apiBaseUrl}/`;

    const isFraudGuardApi =
      req.url.startsWith(apiPath);

    // Only these endpoints are public.
    // They must not receive a normal access token.
    const isPublicAuthEndpoint =
      req.url === `${this.apiBaseUrl}/auth/login` ||
      req.url === `${this.apiBaseUrl}/auth/change-password`;

    // =====================================================
    // ADD ACCESS TOKEN TO PROTECTED REQUESTS
    // =====================================================

    let authReq = req;

    const token = this.authService.getToken();

    if (
      isFraudGuardApi &&
      !isPublicAuthEndpoint &&
      token
    ) {

      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

    }

    // Remove any stale bearer token from public
    // authentication requests.
    if (
      isPublicAuthEndpoint &&
      authReq.headers.has('Authorization')
    ) {

      authReq = authReq.clone({
        headers: authReq.headers.delete('Authorization')
      });

    }

    // =====================================================
    // HANDLE HTTP ERRORS
    // =====================================================

    return next.handle(authReq).pipe(

      catchError((error: HttpErrorResponse) => {

        if (error.status === 401) {

          // Frontend demo: do not clear the session or send the user to login.
          // if (isPublicAuthEndpoint) {
          //   return throwError(() => error);
          // }
          // const requestToken = authReq.headers.get('Authorization');
          // const currentToken = this.authService.getToken();
          // if (
          //   isFraudGuardApi &&
          //   currentToken &&
          //   requestToken === `Bearer ${currentToken}`
          // ) {
          //   this.authService.logout();
          //   this.router.navigate(['/auth/login'], {
          //     queryParams: { returnUrl: this.router.url }
          //   });
          // }

        }

        return throwError(() => error);

      })

    );

  }

}
