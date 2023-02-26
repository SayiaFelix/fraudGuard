import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {GlobalService} from './global.service';
import {AuthService} from './auth.service';
import {map} from 'rxjs/operators';
import {Observable} from "rxjs";

@Injectable(
  {
    providedIn: 'root',
  }
)
export class HttpService {

  constructor(
    private http: HttpClient,
    private globalService: GlobalService,
    private authService: AuthService,
  ) {
  }


  public mobileBankingLogin(endpoint: string, model: any): Observable<any> {
    return this.http.post(this.globalService.mobileBankingHost + endpoint,
      model,
      this.generateLoginHeaders()
    )
      .pipe(
        map((result: any) => {
          return result;
        }));
  }

  public mobileBankingPost(endpoint: string, model: any): any {
    return this.http.post(this.globalService.mobileBankingHost + endpoint,
      model,
      this.getHeaders()
    ).pipe(map(response => {
      response = response;
      return response;
    }));
  }

  // For Pagination
  public mobileBankingPaginationPost(endpoint: string, model: any): any {

    const updatedModel = {
      page: (model.page - 1),
      size: model.size
    };

    return this.http.post(this.globalService.mobileBankingHost + endpoint, updatedModel, this.getHeaders())
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }


  // endpoint for submitting form Data
  public mobileBankingFormRequestPost(endpoint: string, model: any): any {
    return this.http.post(this.globalService.mobileBankingHost + endpoint,
      model,
      this.getFormHeaders()
    ).pipe(map(response => {
      response = response;
      return response;
    }));
  }

  private getHeaders(): any {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.globalService.getToken()
      })
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
        Authorization: 'Basic ' + btoa('BANK_ADMIN' + ':' + 'RPk68Y)5vL+gLQ(')
      })
    };
  }

}
