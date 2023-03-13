import { Injectable } from '@angular/core';
import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private httpService: HttpService) {}

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
    if (this.httpService.isLoggedIn) {
      const userRole = this.httpService.getProfile;
      
      if (route.data.role && !route.data.role.includes(userRole)) {
        this.router.navigate(['/auth/login']);
        return false;
      }
      return true;
    }
    
    this.router.navigate(['/auth/login']);
    return false;
  }
}