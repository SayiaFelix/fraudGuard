
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  returnUrl = '/dashboard';

  public form: FormGroup;

  public showingPassword = false;
  public inputType = 'password';

  public isLoading = false;
  public hasError = false;
  public errorMsg = '';

  public currentYear = new Date().getFullYear();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
  username: [
    'sayia.felix@eclectics.io',
    [Validators.required]
  ],
  password: [
    '',
    [Validators.required]
  ]
});
  }

  ngOnInit(): void {
    const requestedUrl =
      this.route.snapshot.queryParams['returnUrl'];

    this.returnUrl = this.getSafeReturnUrl(requestedUrl);
  }

  // ==========================================
  // FRONTEND DEMO LOGIN
  // NO BACKEND CALLS
  // ==========================================

  onSubmit(event?: Event): void {

    event?.preventDefault();

    if (this.isLoading) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.hasError = false;
    this.errorMsg = '';
    this.isLoading = true;

    const username = String(
      this.form.value.username || ''
    ).trim();

    const password = String(
      this.form.value.password || ''
    );

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

    if (!username || !password) {
      this.showError(
        'Please enter your username and password.'
      );
      return;
    }

    // Mock user for presentation purposes only.
    const demoUser = {
      id: 1,
      username: username,
      email: '',
      role: 'CREDIT_ANALYST',
      first_name: username.split('.')[0],
      last_name: '',
      is_active: true,
      is_demo: true
    };

    // Do not create or forge access tokens.
    // Remove any stale real authentication session.
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Isolated, non-sensitive demo state.
    sessionStorage.setItem(
      'uba_demo_mode',
      'true'
    );

    sessionStorage.setItem(
      'uba_demo_user',
      JSON.stringify(demoUser)
    );

    // For existing UI components that rely
    // on display-name storage.
    sessionStorage.setItem(
      'uba_demo_display_name',
      username
    );

    // Never store the entered password.
    this.form.patchValue({ password: '' });

    this.router.navigate(['/dashboard']).then(navigated => {
  this.isLoading = false;

  if (!navigated) {
    this.showError('Unable to open dashboard.');
  }
})
      .catch(() => {
        this.showError(
          'Unable to open the dashboard.'
        );
      });
  }

  // ==========================================
  // PASSWORD VISIBILITY
  // ==========================================

  toggleShowPassword(): void {
    this.showingPassword = !this.showingPassword;

    this.inputType = this.showingPassword
      ? 'text'
      : 'password';
  }

  // ==========================================
  // SAFE INTERNAL REDIRECT
  // ==========================================

  private getSafeReturnUrl(value: any): string {
    if (typeof value !== 'string') {
      return '/dashboard';
    }

    if (
      !value.startsWith('/') ||
      value.startsWith('//') ||
      value.includes('\\') ||
      value.startsWith('/auth/') ||
      /[\r\n]/.test(value)
    ) {
      return '/dashboard';
    }

    return value;
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  private showError(message: string): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMsg = message;
  }

  private readonly DEMO_USERNAME = 'sayia.felix@eclectics.io';
private readonly DEMO_PASSWORD = 'Demo@123';

}
