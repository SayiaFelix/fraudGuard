import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GlobalService } from './global.service';
import { AuthService } from './auth.service';
import { map } from 'rxjs/operators';
import { forkJoin, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  userId: any;
  post(arg0: string, model: { profileId: any; roleIds: any; active: string; remarks: any; }) {
    throw new Error('Method not implemented.');
  }
  constructor(
    private http: HttpClient,
    private globalService: GlobalService,
    private authService: AuthService,
    private router: Router
  ) {}

  public getEnterpriseUsers(endpoint: string):Observable<any> {
    return this.http.get(this.globalService.customerPortalNest + endpoint)
  }
  public channelManagerLogin(){

  }
  public customerPortalActivate(endpoint: string, model: any): Observable<any> {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model
      )
      .pipe(
        map((result: any) => {
          if (result['status'] == '00') {
            localStorage.setItem('isActivated', 'true');
          } else {
            throwError(() => new Error(result['message']));
          }
          return result;
        })
      );
  }

  public customerPortalAuth(endpoint: string, model: any): Observable<any> {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((result: any) => {
          if (result['status'] == '00') {
            localStorage.setItem('isLoggedin', 'true');
            localStorage.setItem('access_token', result['access_token']);
            localStorage.setItem('data', JSON.stringify(result['data']));
          } else {
            throwError(() => new Error(result['message']));
          }
          return result;
        })
      );
  }

  public customerUserDetails(): Observable<any> {

    let userId = JSON.parse(localStorage.getItem('data')!).id
    const userDetails$ = this.http
      .get(
        this.globalService.customerPortalNest +
          `api/v1/auth/userProfile/${userId}`,
        this.getHeaders()
      )
      .pipe(
        map((result: any) => {
          console.log(result)
          localStorage.setItem(
            'userData',
            JSON.stringify(result['data'])
          );
          return result['data'];
        })
      );
    return userDetails$;
  }

  
  public customerPortalPost(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }
  public mobileBankingGetUserDetailsAndPermissions(): Observable<any> {
    const userDetails$ = this.http
      .post(
        this.globalService.channelManagerHost +
          'api/v1/corporate/admin/corporate/details',
        {},
        this.getHeaders()
      )
      .pipe(
        map((result: any) => {
          localStorage.setItem(
            'userData',
            JSON.stringify(result['data']['corporate'])
          );
          return result['data']['corporate'];
        })
      );

    const userPermissions$ = this.http
      .post(
        this.globalService.channelManagerHost +
          'api/v1/corporate/admin/permissions',
        {},
        this.getHeaders()
      )
      .pipe(
        map((result: any) => {
          localStorage.setItem(
            'profile',
            JSON.stringify(result['data']['data']['profile']['userType'])
          );
          localStorage.setItem(
            'roles',
            JSON.stringify(result['data']['data']['roleList'])
          );
          return result['data']['data']['profile'];
        })
      );

    return forkJoin([userDetails$, userPermissions$]);
  }

  public mobileBankingPost(endpoint: string, model: any): any {
    return this.http
      .post(

        this.globalService.channelManagerHost + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public mobileBankingPostFormData(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.channelManagerHost + endpoint,
        model,
        this.getFormHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  // For Pagination
  public mobileBankingPaginationPost(endpoint: string, model: any): any {
    const updatedModel = {
      page: model.page - 1,
      size: model.size,
    };

    return this.http
      .post(
        this.globalService.channelManagerHost + endpoint,
        updatedModel,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  // endpoint for submitting form Data
  public mobileBankingFormRequestPost(endpoint: string, model: any): any {


    return this.http
      .post(
        this.globalService.channelManagerHost + endpoint,
        model,
        this.getFormHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  public getMapCoordinates(endpoint: string): any {
    return this.http.get(endpoint, this.getHeaders()).pipe(
      map((response) => {
        response = response;
        return response;
      })
    );
  }

  private getHeaders(): any {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.globalService.getToken(),
      }),
    };
  }

  private getFormHeaders(): any {
    return {
      headers: new HttpHeaders({
        // 'Content-Type': 'multipart/form-data',
        Authorization: 'Bearer ' + this.globalService.getToken()

      })
    };
  }


  private generateLoginHeaders(): { headers: HttpHeaders } {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + btoa('ADMIN_PORTAL' + ':' + 'PAr6hu6n}k;@'),
      }),
    };
  }

  get getRoles() {
    let roles = JSON.parse(localStorage.getItem('roles')!);
    return roles;
  }

  // Other requests to backend...Mobile Banking extended endpoints
  public mobileBankingPostUpdated(endpoint: string, model: any): any {
    return this.http
      .post(

        this.globalService.mobileBankingHost + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

  // Other requests to backend...Nest Mobile Banking extended endpoints
  public mobileBankingPostNest(endpoint: string, model: any): any {
    return this.http
      .post(

        this.globalService.customerPortalNest + endpoint,
        model,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

}
