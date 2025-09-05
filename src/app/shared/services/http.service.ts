import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { GlobalService } from './global.service';
import { AuthService } from './auth.service';
import { map, catchError } from 'rxjs/operators';
import { forkJoin, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private subclassDataUrl = 'assets/subclass-data.json';
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

  private cytonUrl = 'http://130.61.111.65:5016/api/get_all_charts_kpis'; 
  private apiUrl = 'http://127.0.0.1:5020/api/chat'; 

  // private baseUrl = "http://130.61.111.65:5016"; 
  private baseUrl = "http://130.61.111.65:5016";

  private baseUrls = 'http://localhost:5015/api'; // Flask API Base URL

  getDashboardData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/get_all_charts_kpis`);
  }

  getForecastData(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/generate_forecasts`);
  }

  sendMessage(userMessage: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(this.apiUrl, { message: userMessage });
  }
  
  getCytonData(page: number, page_size: number): Observable<any> {
    const model = { page, page_size };
    return this.http.post(`${this.baseUrl}/api/clustered_data`, model);
  }
  


  // Upload File API
  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrls}/upload`, formData);
  }

  // AI Chatbot API
  chatWithBot(query: string): Observable<any> {
    return this.http.post(`${this.baseUrls}/chat`, { query });
  }







  

  public getEnterpriseUsers(endpoint: string):Observable<any> {
    return this.http.get(this.globalService.customerPortalNest + endpoint)
  }
  public channelManagerLogin(){

  }
  // In: http.service.ts

// In: http.service.ts

public customerPortalLogin(endpoint: string, model: any): Observable<any> {
  return this.http
    .post(
      this.globalService.customerPortalNest + endpoint,
      model,
      this.generateLoginHeaders()
    )
    .pipe(
      map((result: any) => {
        // We check for the 'token' field from your login response
        if (result.status === '00' && result.token) {
          localStorage.setItem('isLoggedin', 'true');
          
          // *** CRITICAL FIX HERE: Save the token under the 'authToken' key ***
          // This ensures that globalService.getToken() can find it later.
          localStorage.setItem('authToken', result.token); 
          
          localStorage.setItem('data', JSON.stringify(result));
        } else {
          // If login is successful but there's no token, something is wrong.
          throwError(() => new Error(result.message || 'Login failed.'));
        }
        return result;
      }),
      catchError((err) => {
        // console.error('customerPortalLogin error:', err);
        return throwError(() => err);
      })
    );
}
  
  public customerPortalActivate(endpoint: string, model: any): Observable<any> {
        return this.http
            .post(this.globalService.customerPortalNest + endpoint, model) 
            .pipe(
                map((result: any) => {
                    if (result['status'] == '00') {
                      console.log('Activation successful:', result); 
                        // localStorage.setItem('isActivated', 'true');
                    } else {
                        throw new Error(result['message']);
                    }
                    return result;
                }),
                catchError((err) => {
                    console.error('customerPortalActivate error:', err); 
                    return throwError(() => err); 
                })
            );
    }


  getClassAndSubclassData(): Observable<any> {
    return this.http.get<any>(this.subclassDataUrl);
  }

  // Accepts optional options (e.g., headers) as third argument
  public customerPortalAuth(endpoint: string, model: any, options?: any): Observable<any> {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        options // Pass headers or other options if provided
      )
      .pipe(
        map((result: any) => {
          if (result['status'] == '00') {
            // localStorage.setItem('isLoggedin', 'true');
            // localStorage.setItem('token', result['token']);
            // localStorage.setItem('data', JSON.stringify(result['data']));
            console.log('Reset successful:', result);
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


  public customerPortalPostData(endpoint: string,model: { page: { toString: () => string | number | boolean; }; size: { toString: () => string | number | boolean; }; }): any {
    const params = new HttpParams()
    .set('page', model.page.toString())
    .set('size', model.size.toString());
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        {params},this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
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

  public customerPortalPostFile(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.getHeadersFile()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }
  public customerPortalGet(endpoint: string, model: any): any {
    return this.http
      .get(
        this.globalService.customerPortalNest + endpoint,
        model,
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }
  
  public customerPortalPosts(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.standardApi + endpoint,
        model,
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }
  public customerPortalPostsImage(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.standardApi + endpoint,
        model,
        {}
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }
  public customerPortalComments(endpoint: string, model: any): any {
    return this.http
      .post(
        this.globalService.standardComments + endpoint,
        model,
      
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

   public mobileBankingGet(endpoint: string, model: any): any {
    return this.http
      .get(
        this.globalService.customerPortalNest + endpoint,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }

public mobileBankingPatch(endpoint: string, model: any): any {
    return this.http
      .patch(
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

  public mobileBankingDel(endpoint: string, model: any): any {
    return this.http
      .delete(
        this.globalService.customerPortalNest + endpoint,
        this.getHeaders()
      )
      .pipe(
        map((response) => {
          response = response;
          return response;
        })
      );
  }


  public mobileBankingPostFormData(endpoint: string, model: FormData): Observable<any> {
    return this.http.post(
        this.globalService.customerPortalNest + endpoint,
        model,
        this.getFormHeaders()
    ).pipe(
        map((response) => response) // Simplified the map operation
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

 getHeadersFile(): any {
    return {
      headers: new HttpHeaders({
        Authorization: 'Bearer ' + this.globalService.getToken(),
      }),
    };
  }

getHeaders(): any {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + this.globalService.getToken(),
      }),
    };
  }

   getFormHeaders(): any {
    return {
      headers: new HttpHeaders({
        // Remove 'Content-Type': 'multipart/form-data' - let the browser set it automatically
        'Authorization': 'Bearer ' + this.globalService.getToken()
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