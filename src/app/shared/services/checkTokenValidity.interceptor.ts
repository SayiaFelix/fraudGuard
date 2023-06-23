import {ResolveStart, Router, RouterStateSnapshot} from '@angular/router';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs/internal/Observable';
import {Injectable} from '@angular/core';
import {GlobalService} from './global.service';
import {JwtHelperService} from '@auth0/angular-jwt';

@Injectable(
    {
        providedIn: 'root'
    }
)
export class CheckTokenValidityInterceptor implements HttpInterceptor {
    constructor(private router: Router,
                private globalService: GlobalService,
                public state: RouterStateSnapshot) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {


      if (!this.isTokenValid()) {
            // this.toastrService.warning('Logging you out', 'Your Token is expired');
            // here remove the auth token
            localStorage.clear();
            this.router.navigate(['/auth/login']);
        } else {
      }
      return next.handle(req);
    }

    isTokenValid() {
        const helper = new JwtHelperService();

        if (!this.globalService.getToken()) {
          console.log("No token available");
            return false;
        } else if (this.globalService.getToken() && helper.isTokenExpired(this.globalService.getToken())){

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
