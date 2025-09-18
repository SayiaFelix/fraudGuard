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
      role: ['Auditor', Validators.required]  
    });
  }
 
  ngOnInit(): void {
    localStorage.clear();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

onSubmit(event: Event) {
  event.preventDefault();

  if (this.isLoading) return;

  this.hasError = false;
  this.isLoading = true;

  const { email, password, role } = this.form.value;

  this.httpService
    .login(email, password)   // <-- should return users[] from db.json
    .subscribe(users => {
      this.isLoading = false;

      if (users.length > 0) {
        const user = users[0];
        if (user.role === role) {
          localStorage.setItem('userRole', user.role);
          localStorage.setItem('userEmail', user.email);
          localStorage.setItem('username', user.username);

          // Redirect
          this.router.navigate(['/dashboard']);
          console.log('Login successful:', user);
        } else {
          this.hasError = true;
          this.errorMsg = `Role mismatch. You selected "${role}", but your account is "${user.role}".`;
        }
      } else {
        this.hasError = true;
        this.errorMsg = 'Invalid credentials';
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