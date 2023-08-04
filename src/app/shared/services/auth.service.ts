import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import jwt_decode from 'jwt-decode';
@Injectable({
    providedIn: 'root',
})
export class AuthService {

    private loggedIn = false;
    private helper = new JwtHelperService();
    public redirectURL = '';
    private tokenExpirationTime: Date;
    constructor(
        private _router: Router
        ) {}

    public logout(): void {
        localStorage.removeItem('access_token');
        localStorage.clear();
        this._router.navigate(['login']);
        this.loggedIn = false;
    }
   

    // setTokenExpiration(expirationTime: Date) {
    //   this.tokenExpirationTime = expirationTime;
    // }
  
    // checkTokenExpiration() {
    //   const currentTime = new Date();
    //   if (currentTime >= this.tokenExpirationTime) {
    //     this.logout();
    //   } else {
    //     const timeUntilExpiration = this.tokenExpirationTime.getTime() - currentTime.getTime();
    //     setTimeout(() => this.checkTokenExpiration(), timeUntilExpiration);
    //   }
    // }
  
    // // logoutUser() {
    
    // //   localStorage.removeItem('access_token'); 
    // //   window.location.href = '/login'; 
    // // }
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

    private tokenKey = 'access_token';
    private timer: any;
    private tokenExpirationTimer: any;
    
    startExpirationTimer(expirationTime: number) {
      // Clear the existing timer if it's running
      if (this.tokenExpirationTimer) {
        clearTimeout(this.tokenExpirationTimer);
      }
  
      // Start a new timer
      this.tokenExpirationTimer = setTimeout(() => {
        // Call your logout or token refresh method here

        this.logout();
      }, expirationTime);
    }
  
    clearExpirationTimer() {
      if (this.tokenExpirationTimer) {
        clearTimeout(this.tokenExpirationTimer);
      }
    }
    
      setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
        const tokenData: any = jwt_decode(token);
        const expirationTime = tokenData.exp * 1000; // Convert expiration time to milliseconds
        const currentTime = new Date().getTime();
        const timeToExpire = expirationTime - currentTime;
        this.startExpirationTimer(timeToExpire);
      }
    
  
}
