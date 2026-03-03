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
 
    // Hardcoded credentials for POC
  readonly demoCredentials = {
    email: 'investigator@fraudsentinel.ai',
    password: 'FraudSentinel2026',
    role: 'FraudInvestigator'
  };

  readonly roleCredentials = {
    'RiskAnalyst': { email: 'analyst@fraudsentinel.ai', password: 'Riskanalysit@123' },
    'FraudInvestigator': { email: 'investigator@fraudsentinel.ai', password: 'FraudSentinel@2026' },
    'ComplianceOfficer': { email: 'compliance@fraudsentinel.ai', password: 'Complyanalysit@2026' }
  };


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
      role: ['RiskAnalyst', Validators.required]
    });
  }
 
  ngOnInit(): void {
    localStorage.clear();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }
 
   onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.invalid) return;

    this.isLoading = true;
    this.hasError = false;
    // this.loginSuccess = false;

    const { email, password, role } = this.form.value;

    // Hardcoded validation for POC
    setTimeout(() => {
      const validCredentials = this.roleCredentials[role as keyof typeof this.roleCredentials];
      
      if (validCredentials && email === validCredentials.email && password === validCredentials.password) {
        // Success
        // this.loginSuccess = true;
        
        // Store user data
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', email.split('@')[0]);
        localStorage.setItem('access_token', 'mock-jwt-token-for-poc');
        
        // Show success message
        this.toastr?.success(`Welcome back, ${role}!`, 'Login Successful');
        
        // Navigate to dashboard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 500);
      } else {
        // Error
        this.hasError = true;
        // this.loginSuccess = false;
        this.errorMsg = 'Invalid credentials. Try demo credentials below.';
      }
      
      this.isLoading = false;
    }, 1200);
  }
 

//   onSubmit(event: Event) {
//   event.preventDefault();

//   if (this.form.invalid) return;

//   this.hasError = false;
//   this.isLoading = true;

//   const { email, password, role } = this.form.value;

//   // Hardcoded demo credentials
//   const demoUsers = [
//     {
//       email: 'analyst@fraudsentinel.ai',
//       password: 'Sentinel@123',
//       role: 'RiskAnalyst'
//     },
//     {
//       email: 'investigator@fraudsentinel.ai',
//       password: 'Sentinel@123',
//       role: 'FraudInvestigator'
//     },
//     {
//       email: 'compliance@fraudsentinel.ai',
//       password: 'Sentinel@123',
//       role: 'ComplianceOfficer'
//     }
//   ];

//   setTimeout(() => {
//     const user = demoUsers.find(
//       u =>
//         u.email === email &&
//         u.password === password &&
//         u.role === role
//     );

//     if (user) {
//       localStorage.setItem('userRole', user.role);
//       localStorage.setItem('userEmail', user.email);

//       this.router.navigate(['/dashboard']);
//     } else {
//       this.hasError = true;
//       this.errorMsg = 'Invalid demo credentials. Please use provided access details.';
//     }

//     this.isLoading = false;
//   }, 1000);
// }

// onSubmit(event: Event) {
//   event.preventDefault();
 
//   if (this.isLoading) return;
 
//   this.hasError = false;
//   this.isLoading = true;
 
//   const { email, password, role } = this.form.value;
 
//   this.httpService
//     .login(email, password)   
//     .subscribe(users => {
//       this.isLoading = false;
 
//       if (users.length > 0) {
//         const user = users[0];
//         if (user.role === role) {
//           localStorage.setItem('userRole', user.role);
//           localStorage.setItem('userEmail', user.email);
//           localStorage.setItem('username', user.username);
 
//           // Redirect
//           this.router.navigate(['/dashboard']);
//           // console.log('Login successful:', user);
//         } else {
//           this.hasError = true;
//           this.errorMsg = `Role mismatch. You selected "${role}", but your account is "${user.role}".`;
//         }
//       } else {
//         this.hasError = true;
//         this.errorMsg = 'Invalid credentials';
//       }
//     });
// }
 
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
 
    fillDemoCredentials(role: string) {
    const creds = this.roleCredentials[role as keyof typeof this.roleCredentials];
    if (creds) {
      this.form.patchValue({
        role: role,
        email: creds.email,
        password: creds.password
      });
      
      // Optional: Show tooltip or notification
      this.toastr?.info(`Demo credentials loaded for ${role}`, 'Demo Mode');
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
 