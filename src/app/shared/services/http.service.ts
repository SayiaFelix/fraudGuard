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
  constructor(
    private http: HttpClient,
    private globalService: GlobalService,
    private authService: AuthService,
    private router: Router
  ) {}

  public channelManagerLogin(endpoint: string, model: any): Observable<any> {
    return this.http
      .post(
        this.globalService.channelManagerHost + endpoint,
        model,
        this.generateLoginHeaders()
      )
      .pipe(
        map((result: any) => {
          if (result['status'] == 200) {
            localStorage.setItem('isLoggedin', 'true');
            localStorage.setItem('access_token', result['access_token']);
          } else {
            throwError(() => new Error(result['message']));
          }
          return result;
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

}
