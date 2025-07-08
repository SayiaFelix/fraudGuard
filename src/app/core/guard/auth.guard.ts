import { Injectable } from '@angular/core';
import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';

@Injectable()
export class AuthGuard implements CanActivate {
  currState: RouterStateSnapshot;
  constructor(private router: Router, 
    private httpService: HttpService, private globalService: GlobalService) {
      this.currState = router.routerState.snapshot;
    }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    let url: string = state.url;
    return this.checkUserLogin(route, url);
  }

  canActivateChild(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.canActivate(next, state);
  }

  checkUserLogin(route: ActivatedRouteSnapshot, url: any): boolean {

    // console.log(this.currState.url);

    if (!!this.globalService.getToken()) {
      // let userRole = this.httpService.getRoles;
      let userRole = "CORPORATE_ADMIN";

      // console.log("route details:::");
      // console.log(route);

      // console.log("user role details:::");
      // console.log(userRole);

      if (route.data.role && !route.data.role.includes(userRole)) {
        this.router.navigate(['/auth/login']);
        return false;
      }
      return true;
    } else if (this.currState.url === '/standards') {
      return true;
    } else {
    this.router.navigate(['/auth/login']);
    return false;
    }
  }
}
