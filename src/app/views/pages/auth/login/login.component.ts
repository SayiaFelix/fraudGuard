
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

    // ==========================================
// VALIDATE PREDEFINED DEMO CREDENTIALS
// ==========================================

if (
  username !== this.DEMO_USERNAME ||
  password !== this.DEMO_PASSWORD
) {
  this.showError(
    'Invalid username or password. Please try again.'
  );
  return;
}

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
