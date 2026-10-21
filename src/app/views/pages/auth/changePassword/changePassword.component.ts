
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
  selector: 'app-changePassword',
  templateUrl: './changePassword.component.html',
  styleUrls: ['./changePassword.component.scss']
})
export class ChangeAuthPasswordComponent implements OnInit {

  form: FormGroup;

  inputType = 'password';
  showingPassword = false;

  isLoading = false;
  hasError = false;
  errorMsg = '';

  username = '';
  expiresAt: string | null = null;
  isExpired = false;

  private passwordChangeToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private router: Router,
    private route: ActivatedRoute
  ) {

    this.form = this.fb.group(
      {
        newPassword: [
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
        validators: this.passwordMatchValidator()
      }
    );

  }

  ngOnInit(): void {

    // Restricted token from first-time login.
    this.passwordChangeToken =
      sessionStorage.getItem('password_change_token');

    this.username =
      sessionStorage.getItem('password_change_username') || '';

    this.expiresAt =
      sessionStorage.getItem('password_change_expires_at');

    // No restricted token means the user must log in
    // with their temporary password first.
    if (!this.passwordChangeToken) {
      this.hasError = true;
      this.errorMsg =
        'No active password setup session was found. ' +
        'Please log in using your temporary password.';
      return;
    }

    this.checkExpiry();

  }

  // =====================================================
  // PASSWORD VALIDATORS
  // =====================================================

  private maxUtf8BytesValidator(maxBytes: number): ValidatorFn {

    return (control: AbstractControl): ValidationErrors | null => {

      const value = String(control.value || '');

      if (!value) {
        return null;
      }

      // Calculate actual UTF-8 byte length.
      const byteLength = new TextEncoder().encode(value).length;

      if (byteLength > maxBytes) {
        return {
          maxUtf8Bytes: {
            max: maxBytes,
            actual: byteLength
          }
        };
      }

      return null;

    };

  }

  private passwordMatchValidator(): ValidatorFn {

    return (group: AbstractControl): ValidationErrors | null => {

      const newPassword =
        group.get('newPassword')?.value;

      const confirmPassword =
        group.get('confirmPassword')?.value;

      if (!newPassword || !confirmPassword) {
        return null;
      }

      return newPassword === confirmPassword
        ? null
        : { passwordMismatch: true };

    };

  }

  // =====================================================
  // TOKEN EXPIRY
  // =====================================================

  checkExpiry(): void {

    if (!this.expiresAt) {
      return;
    }

    const expiryTime = new Date(this.expiresAt).getTime();

    if (Number.isNaN(expiryTime)) {
      return;
    }

    if (Date.now() >= expiryTime) {

      this.isExpired = true;
      this.hasError = true;

      this.errorMsg =
        'Your temporary password setup session has expired. ' +
        'Contact your administrator for a new invitation ' +
        'or password reset.';

      this.clearRestrictedSession();

    }

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
  // FORM SUBMISSION
  // =====================================================

  onSubmit(event: Event): void {

    event.preventDefault();

    if (this.isLoading) {
      return;
    }

    this.hasError = false;
    this.errorMsg = '';

    this.checkExpiry();

    if (this.isExpired) {
      return;
    }

    if (!this.passwordChangeToken) {

      this.hasError = true;

      this.errorMsg =
        'Your password setup session is missing. ' +
        'Please return to login.';

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
        'with the new password.',
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
  // SET PERMANENT PASSWORD
  // POST /v1/api/auth/change-password
  // =====================================================

  setPassword(): void {

    if (this.isLoading || this.form.invalid) {
      return;
    }

    this.checkExpiry();

    if (this.isExpired || !this.passwordChangeToken) {
      return;
    }

    const payload = {

      password_change_token: this.passwordChangeToken,

      new_password: this.form.value.newPassword,

      confirm_password: this.form.value.confirmPassword

    };

    this.isLoading = true;
    this.hasError = false;

    // HttpService.userPost is expected to prefix /v1/api.
    this.httpService.userPost(
      '/auth/change-password',
      payload
    ).subscribe({

      next: () => {

        this.isLoading = false;

        // HTTP 200 indicates success.
        this.clearRestrictedSession();

        // Remove sensitive values from the form.
        this.form.reset();

        Swal.fire({
          title: 'Password Set Successfully!',
          text:
            'Your permanent password has been created. ' +
            'You can now log in using your username ' +
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

        let message =
          error.error?.error ||
          error.error?.message ||
          'Could not set your password. Please try again.';

        if (error.status === 401) {

          message =
            'Your password setup session is invalid or expired. ' +
            'Please request new temporary credentials.';

          this.isExpired = true;
          this.clearRestrictedSession();

        } else if (error.status === 400) {

          message =
            error.error?.error ||
            error.error?.message ||
            'The new password was rejected. ' +
            'Please check the password requirements.';

        } else if (error.status === 0) {

          message =
            'Unable to connect to the server. ' +
            'Please check your network connection.';

        }

        this.hasError = true;
        this.errorMsg = message;

        Swal.fire({
          title: 'Password Setup Failed',
          text: message,
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });

      }

    });

  }

  
passwordChangeTokenAvailable(): boolean {
  return !!this.passwordChangeToken && !this.isExpired;
}


  // =====================================================
  // CLEAR RESTRICTED SESSION
  // =====================================================

  private clearRestrictedSession(): void {

    sessionStorage.removeItem('password_change_token');
    sessionStorage.removeItem('password_change_username');
    sessionStorage.removeItem('password_change_expires_at');

    this.passwordChangeToken = null;

  }

  // =====================================================
  // RETURN TO LOGIN
  // =====================================================

  backToLogin(): void {

    this.clearRestrictedSession();

    this.form.reset();

    this.router.navigate(['/auth/login']);

  }

}
