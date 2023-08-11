import {Router} from '@angular/router';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs/internal/Observable';
import {Injectable} from '@angular/core';
import {GlobalService} from './global.service';
import {JwtHelperService} from '@auth0/angular-jwt';
// import { ToastrService } from 'ngx-toastr';

@Injectable(
    {
        providedIn: 'root'
    }
)
export class CheckTokenValidityInterceptor implements HttpInterceptor {
    constructor(private router: Router,
              //  private toastrService: ToastrService,
                private globalService: GlobalService) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      if (!this.isTokenValid()) {
            localStorage.clear();
            this.router.navigate(['/standards']);
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