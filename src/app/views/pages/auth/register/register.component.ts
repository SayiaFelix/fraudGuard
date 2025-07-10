import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, catchError, map, throwError } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';
import { environment } from 'src/environments/environment'; // Import environment

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
    fb: FormBuilder
  ) {
    this.form = fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // this.getEnterpriseEmail(this.enterpriseData)
    // this.getUsers();
  }

  onRegister(e: Event) {
    this.hasError = false;
    this.isLoading = true;
    e.preventDefault();

    const model = {
      name: this.form.value.name,
      email: this.form.value.email
    };

    // Use customerPortalNest from environment
    
    console.log('Register Payload:', model);
  

    this.registerResponse$ = this.httpService
      .customerPortalActivate('register', model)
      .pipe(
        catchError((error: any) => {
          console.error('Registration error:', error);
          this.hasError = true;
          this.errorMsg = error?.error?.message || 'Something went wrong during registration.';
          this.isLoading = false;
          return throwError(() => error);
        }),
        map((result: any) => {
          this.isLoading = false;

          if (result?.status !== '00') {
            this.hasError = true;
            this.errorMsg = result?.message || 'Registration failed.';
            setTimeout(() => {
              this.hasError = false;
              this.errorMsg = '';
              this.form.reset();
            }, 3000);
          } else {
            setTimeout(() => {
                //console.log('Register Payload:', model);
                //console.log('Registration successful:', result);
  
  
              this.router.navigate(['/auth/first-time-password']);
            }, 1500);
          }

          return result;
        })
      );
  }
}