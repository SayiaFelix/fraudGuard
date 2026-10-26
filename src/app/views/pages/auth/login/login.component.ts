
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
  public currentYear: number = new Date().getFullYear();

  returnUrl = '/dashboard';

  public form: FormGroup;

  public showingPassword = false;
  public inputType = 'password';

  public isLoading = false;
  public hasError = false;
  public errorMsg = '';


  private readonly DEMO_USERNAME =
    'sayia.felix@eclectics.io';

  private readonly DEMO_PASSWORD =
    'Demo@123';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {

    this.form = this.fb.group({
      username: [
        '',
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

    this.returnUrl =
      this.getSafeReturnUrl(requestedUrl);

  }

  // ==========================================
  // FRONTEND-ONLY LOGIN
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

    // Validate predefined credentials
    if (
      username !== this.DEMO_USERNAME ||
      password !== this.DEMO_PASSWORD
    ) {

      this.showError(
        'Invalid username or password.'
      );

      return;
    }

    // ==========================================
    // CREATE MOCK USER SESSION
    // ==========================================

    const demoUser = {
      id: 1,
      username: username,
      email: username,
      role: 'CREDIT_ANALYST',
      first_name: 'Felix',
      last_name: 'Sayia',
      is_active: true,
      is_demo: true
    };

    // Remove any stale backend tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    sessionStorage.setItem(
      'uba_demo_mode',
      'true'
    );

    sessionStorage.setItem(
      'uba_demo_user',
      JSON.stringify(demoUser)
    );

    sessionStorage.setItem(
      'uba_demo_display_name',
      'Felix Sayia'
    );

    // ==========================================
    // NAVIGATE TO DASHBOARD
    // ==========================================

    // ==========================================
// NAVIGATE TO CREDIT DASHBOARD
// ==========================================

this.router.navigateByUrl('/dashboard')
  .then(navigated => {

    this.isLoading = false;

    if (navigated) {
      this.form.patchValue({
        password: ''
      });
    } else {
      this.showError(
        'Unable to open Credit Intelligence Dashboard.'
      );
    }

  })
  .catch(() => {
    this.showError(
      'Dashboard navigation failed.'
    );
  });

  }

  // ==========================================
  // PASSWORD VISIBILITY
  // ==========================================

  toggleShowPassword(): void {

    this.showingPassword =
      !this.showingPassword;

    this.inputType =
      this.showingPassword
        ? 'text'
        : 'password';

  }

  // ==========================================
  // SAFE RETURN URL
  // ==========================================

  private getSafeReturnUrl(value: any): string {

    if (typeof value !== 'string') {
      return '/dashboard';
    }

    if (
      !value.startsWith('/') ||
      value.startsWith('//') ||
      value.includes('\\') ||
      value.startsWith('/auth/')
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

}
