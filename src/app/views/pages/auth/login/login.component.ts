import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CustomValidators } from 'ngx-custom-validators';
import { HttpParams } from '@angular/common/http';
 
import { catchError, concat, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from "sweetalert2";
import { AuthService } from 'src/app/shared/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from 'src/app/shared/services/global.service';
 
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  returnUrl: any;
  public form: FormGroup;
  public showingPassword = false;
  inputType = 'password';
 
  loginResponse$: Observable<any>;
 
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
 
  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';
 
  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private authservice: AuthService,
    private httpService: HttpService,
    fb: FormBuilder,
    private _router: Router,
    private toastr: ToastrService,
    private globalService: GlobalService
  ) {
    this.form = fb.group({
      email: [
        '',
        Validators.compose([Validators.required, CustomValidators.email]),
      ],
      password: [
        '',
        Validators.compose([Validators.required, Validators.minLength(6)]),
      ],
    });
  }
 
  ngOnInit(): void {
    localStorage.clear();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(e: Event) {
    e.preventDefault();
    
    if (this.isLoading) {
      return;
    }
    
    this.hasError = false;
    this.isLoading = true;

    // --- CHANGE #1: Convert email to lowercase for robust login ---
    const model = {
      email: this.form.value.email.toLowerCase(),
      password: this.form.value.password
    }

    this.httpService
      .customerPortalAuth('auth/login', model)
      .pipe(
        catchError((error: any) => {
          console.log(error);
          this.hasError = true;
          this.errorMsg = error.message || 'Login failed';
          this.isLoading = false;
          return throwError(error);
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Login result:', result);
          this.isLoading = false;
          
          if (result['status'] != '00') {
            this.hasError = true;
            this.errorMsg = result['error'] || result['message'] || 'Login failed';
            setTimeout(() => {
              this.hasError = false;
              this.errorMsg = '';
              this.form.reset();
            }, 3000);
          } else {
            this.hasError = false; 
            
            if (result['data']?.['access_token']) {
              localStorage.setItem('token', result['data']['access_token']);
              localStorage.setItem('access_token', result['data']['access_token']);
              localStorage.setItem('user_id', result['data']['user_id']);
              console.log('Token saved successfully');
            }
            
            if (result['data']) {
              localStorage.setItem('user_name', result['data']['name'] || '');
              localStorage.setItem('first_name', result['data']['first_name'] || '');
              localStorage.setItem('last_name', result['data']['last_name'] || '');
              localStorage.setItem('email', result['data']['email'] || '');

              //
              // --- CHANGE #2 (THE FIX): Save the user's role to localStorage ---
              //
              localStorage.setItem('user_role', result['data']['role']);
              //
              //

              console.log('User data saved:', result['data']);
            }

            this.globalService.setUserId(result['data']['user_id']);
            
            const isFirstTimeLogin = result['first_time_login'] === true || result['data']?.['first_time_login'] === true;
            
            if (isFirstTimeLogin) {
              console.log('Navigating to first-time password setup');
              this.router.navigate(['/auth/first-time-password']);
            } else {
              console.log('Navigating to dashboard');
              this.router.navigate(['/dashboard']).then(
                (success) => {
                  if (success) {
                    console.log('Navigation to dashboard successful');
                  } else {
                    console.log('Navigation to dashboard failed');
                  }
                },
                (error) => console.log('Navigation error:', error)
              );
            }
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.hasError = true;
          this.errorMsg = 'An unexpected error occurred. Please try again.';
          this.isLoading = false;
        }
      });
  }
  toggleShowPassword() {
    this.showingPassword = !this.showingPassword;
    if (this.showingPassword) {
      this.inputType = 'text';
    } else {
      this.inputType = 'password';
    }
  }

  navigateToSignUp() {
    this.router.navigate(['/auth/signup']);
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
    if (lang === 'en') {
      this.selectedLanguage = 'English';
    } else if (lang === 'kis') {
      this.selectedLanguage = 'Kiswahili';
      this.selectedLanguageFlag = 'assets/images/flags/ke.svg';
    }
  }
 
  private saveUsernameAndRolesOnLogin() {
    let accessToken = localStorage.getItem("access_token");
 
    let model = {
      token: accessToken,
    };

    this.httpService.mobileBankingPost('oauth/validate', model).subscribe((res: any) => {
      if (res.status === 200) {
        console.log(res.data);
        localStorage.setItem('userName', res.data.username);
        localStorage.setItem('roles', res.data.roles);
      } else {
        Swal.fire('Error', 'Unable to fetch user details.', 'error');
      }
    })
  }
}