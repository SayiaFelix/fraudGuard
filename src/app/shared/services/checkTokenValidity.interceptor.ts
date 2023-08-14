import { Router } from '@angular/router';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Injectable } from '@angular/core';
import { GlobalService } from './global.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { EMPTY, catchError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from './auth.service';



@Injectable(
  {
    providedIn: 'root'
  }
)
export class CheckTokenValidityInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
     private toastr: ToastrService,
    //  private toast: NgToastService,
    private authService: AuthService,
    private globalService: GlobalService) {;
    }
  
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      const isAuthRoute = req.url.includes('/auth');
      const isStandardsRoute = req.url.includes('/standards/all-standards');
  
      if (isAuthRoute || isStandardsRoute) {
        return next.handle(req);
      }
  
      const token = this.globalService.getToken();
      if (!token) {
        localStorage.clear();
      } else {
        const helper = new JwtHelperService();
        if (helper.isTokenExpired(token)) {
          this.toastr.warning('Logged Out! Session Expired');
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
      }
      
      return next.handle(req).pipe(
        catchError(error => {
          console.log(error);
          return EMPTY; 
        })
      );
    }
  
    isTokenValid() {
      const helper = new JwtHelperService();
      const token = this.globalService.getToken();
      
      if (!token) {
        console.log("No token available");
        return false;
      } else if (helper.isTokenExpired(token)) {
        // You might want to put some refresh logic here
        console.log("Token expired");
        return false;
      } else {
        return true;
      }
    }

}