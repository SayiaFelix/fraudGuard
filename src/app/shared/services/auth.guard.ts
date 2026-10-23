import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Frontend demo: the login gate is disabled. The previous check is kept below.
    return true;

    // if (this.authService.isAuthenticated()) {
    //   return true;
    // }
    // this.authService.redirectURL = state.url;
    // this.router.navigate(['/auth/login'], {
    //   queryParams: { returnUrl: state.url }
    // });
    // return false;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(route, state);
  }
}