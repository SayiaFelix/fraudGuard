
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import Swal from 'sweetalert2';
import { HttpService } from '../../../../shared/services/http.service';

@Component({
  selector: 'app-first-time-login',
  templateUrl: './first-time-login.component.html',
  styleUrls: ['./first-time-login.component.scss']
})
export class FirstTimeLoginComponent implements OnInit {

  errorMsg = '';
  hasError = false;
  isLoading = false;

  public form: FormGroup;

  public showingPassword = false;
  inputType = 'password';

  username = '';
  expiresAt: string | null = null;
  isExpired = false;

  private passwordChangeToken: string | null = null;

  constructor(
    private router: Router,
    private httpService: HttpService,
    private fb: FormBuilder
  ) {

    this.form = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(12),
            this.maxUtf8BytesValidator(72)
          ]
        ],

        confirmPassword: [
          '',
          [Validators.required]
        ]
      },
      {
        validators: this.matchPasswordValidator()
      }
    );
  }

  // =====================================================
  // INITIALIZATION
  // =====================================================

  ngOnInit(): void {

    this.passwordChangeToken =
      sessionStorage.getItem('password_change_token');

    this.username =
      sessionStorage.getItem('password_change_username') || '';

    this.expiresAt =
      sessionStorage.getItem('password_change_expires_at');

    if (!this.passwordChangeToken) {

      this.showError(
        'No password setup session was found. ' +
        'Please log in using your temporary password.'
      );

      return;
    }

    this.checkTokenExpiry();
  }

  // =====================================================
  // PASSWORD VALIDATION
  // =====================================================

  private maxUtf8BytesValidator(maxBytes: number): ValidatorFn {

    return (
      control: AbstractControl
    ): ValidationErrors | null => {

      const value = String(control.value || '');

      if (!value) {
        return null;
      }

      const byteLength =
        new TextEncoder().encode(value).length;

      return byteLength > maxBytes
        ? {
            maxUtf8Bytes: {
              max: maxBytes,
              actual: byteLength
            }
          }
        : null;
    };
  }

  private matchPasswordValidator(): ValidatorFn {

    return (
      control: AbstractControl
    ): ValidationErrors | null => {

      const password =
        control.get('password')?.value;

      const confirmPassword =
        control.get('confirmPassword')?.value;

      if (!password || !confirmPassword) {
        return null;
      }

      return password === confirmPassword
        ? null
        : { passwordMismatch: true };
    };
  }

  // =====================================================
  // TOKEN EXPIRY
  // =====================================================

  checkTokenExpiry(): void {

    if (!this.expiresAt) {
      return;
    }

    const expiry = new Date(this.expiresAt).getTime();

    if (Number.isNaN(expiry)) {
      return;
    }

    if (Date.now() >= expiry) {

      this.isExpired = true;

      this.clearPasswordChangeSession();

      this.showError(
        'Your password setup session has expired. ' +
        'Please contact your administrator to ' +
        'resend the invitation or reset your password.'
      );
    }
  }

  get hasValidSetupSession(): boolean {

    return !!this.passwordChangeToken &&
      !this.isExpired;
  }

  // =====================================================
  // SHOW / HIDE PASSWORD
  // =====================================================

  toggleShowPassword(): void {

    this.showingPassword = !this.showingPassword;

    this.inputType =
      this.showingPassword ? 'text' : 'password';
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  onSubmit(event: Event): void {

    event.preventDefault();

    if (this.isLoading) {
      return;
    }

    this.hasError = false;
    this.errorMsg = '';

    this.checkTokenExpiry();

    if (!this.hasValidSetupSession) {

      this.showError(
        'Your password setup session is missing or expired. ' +
        'Please log in again.'
      );

      return;
    }

    if (this.form.invalid) {

      this.form.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: 'Set Permanent Password?',
      text:
        'Your temporary password will be replaced ' +
        'with the new permanent password.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Set Password',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d'
    }).then(result => {

      if (result.isConfirmed) {

        this.setPassword();

      }
    });
  }

  // =====================================================
  // SET FIRST PERMANENT PASSWORD
  // POST /v1/api/auth/change-password
  // =====================================================

  setPassword(): void {

    if (this.isLoading || this.form.invalid) {
      return;
    }

    this.checkTokenExpiry();

    if (!this.hasValidSetupSession) {

      this.showError(
        'Your password setup session is missing or expired.'
      );

      return;
    }

    const payload = {

      password_change_token: this.passwordChangeToken,

      new_password: this.form.value.password,

      confirm_password: this.form.value.confirmPassword

    };

    this.isLoading = true;

    this.hasError = false;
    this.errorMsg = '';

    this.httpService.setFirstTimePassword(
      payload.password_change_token!,
      payload.new_password,
      payload.confirm_password
    ).subscribe({

      next: () => {

        this.isLoading = false;

        // Clear restricted credentials immediately.
        this.clearPasswordChangeSession();

        // Remove passwords from the form.
        this.form.reset();

        Swal.fire({
          title: 'Password Set Successfully!',
          text:
            'Your permanent password has been created. ' +
            'Please log in using your username ' +
            'and new password.',
          icon: 'success',
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#28a745',
          allowOutsideClick: false
        }).then(() => {

          this.router.navigate(['/auth/login']);

        });

      },

      error: (error: any) => {

        this.isLoading = false;

        const errorCode = error.error?.code;

        let message =
          error.error?.error ||
          error.error?.message ||
          'Could not set your password. Please try again.';

        if (
          error.status === 401 ||
          errorCode === 'TEMPORARY_PASSWORD_EXPIRED'
        ) {

          message =
            'Your password setup credentials are invalid ' +
            'or expired. Please request a new invitation ' +
            'or password reset.';

          this.isExpired = true;

          this.clearPasswordChangeSession();

        } else if (error.status === 0) {

          message =
            'Unable to connect to the server. ' +
            'Please check your connection.';

        }

        this.showError(message);

        Swal.fire({
          title: 'Password Setup Failed',
          text: message,
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });

      }

    });
  }

  // =====================================================
  // ERROR HANDLING
  // =====================================================

  private showError(message: string): void {

    this.hasError = true;
    this.errorMsg = message;

  }

  // =====================================================
  // CLEAR RESTRICTED SESSION
  // =====================================================

  private clearPasswordChangeSession(): void {

    sessionStorage.removeItem('password_change_token');

    sessionStorage.removeItem('password_change_username');

    sessionStorage.removeItem('password_change_expires_at');

    this.passwordChangeToken = null;
  }

  // =====================================================
  // BACK TO LOGIN
  // =====================================================

  backToLogin(): void {

    this.clearPasswordChangeSession();

    this.form.reset();

    this.router.navigate(['/auth/login']);
  }

}
