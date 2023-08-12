import { Router } from '@angular/router';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { Injectable } from '@angular/core';
import { GlobalService } from './global.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { EMPTY } from 'rxjs';
import { ToastrService } from 'ngx-toastr';



@Injectable(
  {
    providedIn: 'root'
  }
)
export class CheckTokenValidityInterceptor implements HttpInterceptor {
  constructor(private router: Router,
     private toastr: ToastrService,
    //  private toast: NgToastService,
    private globalService: GlobalService) {;
    }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isAuthRoute = req.url.includes('/auth');
    const isStandardsRoute = req.url.includes('/standards') || req.url.includes('/standards/all-standards');

    if (isAuthRoute || isStandardsRoute) {
      // console.log('Allowing request without token validation:', req.url);
      return next.handle(req);
    }

    if (!this.globalService.getToken()) {
      // console.log('Navigating to /standards due to missing token:', req.url);
      // this.router.navigate(['/standards']);
      return EMPTY;
    } else {
      const helper = new JwtHelperService();
      if (helper.isTokenExpired(this.globalService.getToken())) {
        this.toastr.warning( 'Login Out!!!');  
        // this.toast.warning({detail:"WARN",summary:'Login Out !!!',duration:5000});
        this.router.navigate(['/auth/login']);
        return EMPTY;
      } else {
        // console.log('Allowing request with valid token:', req.url);
        return next.handle(req);
      }
    }
  }

  isTokenValid() {
    const helper = new JwtHelperService();
    if (!this.globalService.getToken()) {
      console.log("No token available");
      return false;
    } else if (this.globalService.getToken() && helper.isTokenExpired(this.globalService.getToken())) {

      // send refresh to backend
      // receive new access
      // update local storage
      // this.isTokenValid();

      return false;
    } else {
      return true;
    }
  }
}