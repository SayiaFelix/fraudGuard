
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { HttpService } from 'src/app/shared/services/http.service';
import { GlobalService } from 'src/app/shared/services/global.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  returnUrl: string = '/dashboard';

  public form: FormGroup;

  public showingPassword = false;
  inputType = 'password';

  errorMsg = '';
  hasError = false;
  isLoading = false;

  selectedLanguage = 'English';
  selectedLanguageFlag = 'assets/images/flags/us.svg';

  private readonly passwordChangeRoute = '/auth/first-time-password';

  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private authservice: AuthService,
    private httpService: HttpService,
    private fb: FormBuilder,
    private globalService: GlobalService
  ) {

    this.form = this.fb.group({
      username: [
        '',
        [
          Validators.required
        ]
      ],
      password: [
        '',
        [
          Validators.required
        ]
      ]
    });

  }

  ngOnInit(): void {

    this.returnUrl =
      this.route.snapshot.queryParams['returnUrl'] ||
      '/dashboard';

  }

  // =====================================================
  // LOGIN
  // POST /v1/api/auth/login
  // =====================================================

  onSubmit(event: Event): void {

    event.preventDefault();

    if (this.isLoading) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMsg = '';

    const username = String(
      this.form.value.username || ''
    ).trim();

    const password = this.form.value.password;

    // Frontend demo: do not call POST /v1/api/auth/login.
    this.router.navigate(['/dashboard']);
    return;

    /*
    this.authservice.login(username, password).subscribe({

      next: (response: any) => {

        this.isLoading = false;

        // =================================================
        // CASE 1: FIRST-TIME LOGIN
        // =================================================

        if (
          response?.must_change_password === true ||
          response?.status === 'password_change_required'
        ) {

          if (!response.password_change_token) {
            this.showError(
              'The server did not return a password change token.'
            );
            return;
          }

          // Remove any previous normal authentication
          // credentials to prevent stale-session access.
          this.clearLoginSession();

          // Restricted token is NOT a normal access token.
          // Keep it separate and temporary.
          sessionStorage.setItem(
            'password_change_token',
            response.password_change_token
          );

          sessionStorage.setItem(
            'password_change_username',
            username
          );

          if (response.expires_at) {
            sessionStorage.setItem(
              'password_change_expires_at',
              response.expires_at
            );
          }

          // Never retain the temporary password.
          this.form.patchValue({
            password: ''
          });

          this.router.navigate(
            [this.passwordChangeRoute],
            {
              queryParams: {
                firstTime: 'true'
              }
            }
          ).then(navigated => {
            if (!navigated) {
              this.showError(
                'Password change page could not be opened. Check the authentication route.'
              );
            }
          });

          return;
        }

        // =================================================
        // CASE 2: NORMAL LOGIN
        // =================================================

        if (
          response?.access_token &&
          response?.refresh_token &&
          response?.user
        ) {

          // Remove any old first-time login state.
          this.clearPasswordChangeSession();

          localStorage.setItem(
            'access_token',
            response.access_token
          );

          localStorage.setItem(
            'refresh_token',
            response.refresh_token
          );

          const user = response.user;

          localStorage.setItem(
            'userRole',
            user.role || ''
          );

          localStorage.setItem(
            'userEmail',
            user.email || ''
          );

          localStorage.setItem(
            'userName',
            user.username || username
          );

          localStorage.setItem(
            'current_user',
            JSON.stringify(user)
          );

          localStorage.setItem(
            'userDisplayName',
            this.authservice.getUserDisplayName()
          );

          localStorage.setItem(
            'userTitle',
            this.authservice.getUserTitle()
          );

          // Only allow an internal application route.
          const destination =
            this.returnUrl.startsWith('/') &&
            !this.returnUrl.startsWith('//') &&
            !this.returnUrl.includes('\\') &&
            !this.returnUrl.startsWith('/auth/')
              ? this.returnUrl
              : '/dashboard';

          this.router.navigateByUrl(destination)
            .then(navigated => {
              if (!navigated) {
                this.showError(
                  'Login succeeded, but the dashboard could not be opened.'
                );
              }
            });

          return;
        }

        // =================================================
        // CASE 3: UNEXPECTED RESPONSE
        // =================================================

        this.showError(
          'Invalid login response received from the server.'
        );

      },

      error: (error: any) => {

        this.isLoading = false;

        this.handleLoginError(error);

      }

    });
    */

  }

  // =====================================================
  // HANDLE LOGIN ERRORS
  // =====================================================

  private handleLoginError(error: any): void {

    const errorCode = error.error?.code;

    let message = '';

    if (
      error.status === 401 &&
      errorCode === 'TEMPORARY_PASSWORD_EXPIRED'
    ) {

      message =
        'Your temporary password has expired. ' +
        'Please contact your administrator to resend ' +
        'the invitation or reset your password.';

    } else if (error.status === 401) {

      message =
        'Invalid username or password. ' +
        'Please check your credentials and try again.';

    } else if (error.status === 403) {

      message =
        'Your account does not have permission to log in. ' +
        'Please contact your administrator.';

    } else if (error.status === 429) {

      message =
        'Too many login attempts. Please try again later.';

    } else if (error.status === 0) {

      message =
        'Unable to connect to the authentication server. ' +
        'Please check your connection and try again.';

    } else {

      message =
        error.error?.error ||
        error.error?.message ||
        'Login failed. Please try again.';

    }

    this.showError(message);

  }

  private showError(message: string): void {
    this.hasError = true;
    this.errorMsg = message;
  }

  // =====================================================
  // CLEAN UP PREVIOUS SESSIONS
  // =====================================================

  private clearLoginSession(): void {

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('current_user');
    localStorage.removeItem('userDisplayName');
    localStorage.removeItem('userTitle');

  }

  private clearPasswordChangeSession(): void {

    sessionStorage.removeItem('password_change_token');
    sessionStorage.removeItem('password_change_username');
    sessionStorage.removeItem('password_change_expires_at');

  }

  // =====================================================
  // PASSWORD VISIBILITY
  // =====================================================

  toggleShowPassword(): void {

    this.showingPassword = !this.showingPassword;

    this.inputType =
      this.showingPassword ? 'text' : 'password';

  }

  // =====================================================
  // LANGUAGE
  // =====================================================

  changeLanguage(lang: string): void {

    this.translate.use(lang);

    if (lang === 'en') {

      this.selectedLanguage = 'English';
      this.selectedLanguageFlag =
        'assets/images/flags/us.svg';

    } else if (lang === 'kis') {

      this.selectedLanguage = 'Kiswahili';
      this.selectedLanguageFlag =
        'assets/images/flags/ke.svg';

    }

  }

}
