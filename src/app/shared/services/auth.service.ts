import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private loggedIn = false;
    private helper = new JwtHelperService();
    public redirectURL = '';

    constructor(
        private _router: Router
        ) {}

    public logout(): void {
        localStorage.removeItem('ussd-token');
        localStorage.clear();
        this._router.navigate(['login']);
        this.loggedIn = false;
    }

    public getRoles(): any {
      const user_details = localStorage.getItem('user_details');
      const userDetails = JSON.parse(user_details ? user_details : "");
        const rolesArray = userDetails.roleList.map((item: any) => item.name);

        return rolesArray;
    }

    public getToken(): any {
        return localStorage.getItem('access_token');
    }
    public unauthorizedAccess(error: any): void {
        this.logout();
        this._router.navigate(['/login']);
    }
    public isLoggedIn(): boolean {
         return !this.isExpired();
    }
    public isExpired(): boolean | Promise<Boolean> {
        const isExpired = this.helper.isTokenExpired(this.getToken());
        return isExpired;
    }

    public getJWTValue(): any {
        return this.helper.decodeToken(this.getToken());
    }
}
