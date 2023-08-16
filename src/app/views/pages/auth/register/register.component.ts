import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, catchError, map, throwError } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  public form: FormGroup;
  registerResponse$: Observable<any>;
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  enterpriseData: any;

  constructor(
     private router: Router,
     private httpService: HttpService,
     private http: HttpClient,
     fb: FormBuilder,) { 
      this.form = fb.group({
        licenceNumber: ['',Validators.compose([Validators.required,Validators.minLength(6)])],
      });
     }

  ngOnInit(): void {
    // this.getEnterpriseEmail(this.enterpriseData)
    // this.getUsers();
  }

  // getUsers() {
  //   this.httpService.getEnterpriseUsers('api/v1/auth/facilities').subscribe( res=>{
  //     this.enterpriseData = res;
  //     console.log(this.enterpriseData)
  //   })
  // }

  onRegister(e: Event) {
    this.hasError = false;
    this.isLoading = true;
    e.preventDefault();

    // let selectedUser = this.enterpriseData.data.filter((user: any) => user.licenceNo === this.form.value.licenceNo)[0]

    // console.log(selectedUser);
    
    let model = {
      licenceNumber:this.form.value.licenceNumber
    };
    console.log(model);
    this.registerResponse$ = this.httpService
      .customerPortalActivate('api/v1/auth/lookUpFacility', model)
      .pipe(
        catchError((error: any) => {
          console.log(error);
          this.hasError = error.message;
          this.isLoading = false;
          return throwError(error);
        }),
        map((result) => {
          this.isLoading = false;
          if (result['status'] != '00') {
            this.hasError = true;
            this.errorMsg = result['message'];
            setTimeout(() => {
              this.hasError = false;
              this.errorMsg = '';
              this.form.reset();
            }, 3000);
          } else {
            setTimeout(() => {
              this.router.navigate(['/auth/first-time-password']);
            }, 2000);
            return result;
          }
        })
      );
  }
}
