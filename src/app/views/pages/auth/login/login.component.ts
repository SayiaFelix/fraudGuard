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
 
  // Admin credentials for demo
  readonly adminCredentials = {
    email: 'admin@fraudsentinelAI.com',
    password: 'admin@123',
    role: 'admin'
  };

  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private authservice: AuthService,
    private httpService: HttpService,
    fb: FormBuilder,
    private _router: Router,
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
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

onSubmit(event: Event) {
  event.preventDefault();
  if (this.form.invalid) return;

  this.isLoading = true;
  this.hasError = false;

  const { email, password } = this.form.value;
  
  this.authservice.login(email, password).subscribe({
    next: (response: any) => {
      this.isLoading = false;
      
      if (response && response.access_token) {
        // Show success
        console.log('Login successful:', response);
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          localStorage.setItem('userRole', response.user?.role || 'admin');
          localStorage.setItem('userEmail', response.user?.email || email);
          localStorage.setItem('userName', response.user?.username || email.split('@')[0]);
          localStorage.setItem('current_user', JSON.stringify(response.user));
          
          console.log('User details stored in localStorage:', {
            email: response.user?.email || email,
            username: response.user?.username || email.split('@')[0],
            role: response.user?.role || 'admin'
          });
        
          // Swal.fire({
          //   icon: 'success',
          //   title: 'Login Successful!',
          //   text: `Welcome back, ${response.user?.username || email.split('@')[0]}!`,
          //   timer: 800,
          //   showConfirmButton: false,
          //   backdrop: true,
          //   toast: false,
          //   position: 'center'
          // });
        
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        
        setTimeout(() => {
          this.router.navigateByUrl(returnUrl);
        }, 800);
      } else {
        this.hasError = true;
        this.errorMsg = 'Invalid response from server.';
      }
    },
    error: (error) => {
        this.isLoading = false;
        this.hasError = true;
        
        let errorMessage = '';
        
        if (error.status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.status === 403) {
          errorMessage = 'Your account is disabled. Please contact administrator.';
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 5001.';
        } else {
          errorMessage = error.error?.error || 'Login failed. Please try again.';
        }
        
        this.errorMsg = errorMessage;
        console.error('Login error:', error);
      
        // Swal.fire({
        //   icon: 'error',
        //   title: 'Login Failed',
        //   text: errorMessage,
        //   confirmButtonColor: '#d33',
        //   confirmButtonText: 'Try Again'
        // });
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
 
  fillAdminCredentials() {
    this.form.patchValue({
      email: this.adminCredentials.email,
      password: this.adminCredentials.password
    });
    
    // Swal.fire({
    //   icon: 'info',
    //   title: 'Demo Credentials Loaded',
    //   text: `Admin credentials loaded. Click Sign In to continue.`,
    //   timer: 400,
    //   showConfirmButton: false,
    //   toast: false,
    //   position: 'center'
    // });
  }
}