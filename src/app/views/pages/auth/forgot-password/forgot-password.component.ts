import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from "sweetalert2";
import { HttpService } from "../../../../shared/services/http.service";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomValidators } from 'ngx-custom-validators';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  public form: FormGroup;
  returnUrl: any;
  errorMsg: string;
  hasError: boolean = false;
  hasSuccess: boolean = false;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    fb: FormBuilder,
  ) {
    this.form = fb.group({
      email: [
        '',
        Validators.compose([Validators.required, CustomValidators.email]),
      ]
    });
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

onLoggedin(e: Event) {
    e.preventDefault();
    this.resetPassword();
  }

resetPassword() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: 'Reset Password?',
      text: `We will send password reset instructions to ${this.form.value.email}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, reset it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.hasError = false;
        this.hasSuccess = false;
        this.isLoading = true;
        
        const model = {
          email: this.form.value.email,
        };
        
        this.httpService.forgotPassword(model).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            
            if (response.status === 'success') {
              if (response.temporaryPassword) {
                Swal.fire({
                  title: 'Password Reset Successful!',
                  html: `
                    <div class="text-center">
                      <i class="fas fa-key fa-3x text-warning mb-3"></i>
                      <p>A temporary password has been generated for:</p>
                      <p class="fw-bold text-primary">${response.email}</p>
                      <div class="alert alert-success mt-3">
                        <strong>Temporary Password:</strong>
                        <div class="temporary-password mt-2 p-2 bg-light rounded font-monospace">
                          ${response.temporaryPassword}
                        </div>
                        <small class="text-muted d-block mt-2">
                          Please use this password to login and change it immediately.
                        </small>
                      </div>
                    </div>
                  `,
                  icon: 'success',
                  confirmButtonText: 'Copy Password & Login',
                  confirmButtonColor: '#28a745',
                  showCancelButton: true,
                  cancelButtonText: 'Close',
                  customClass: {
                    confirmButton: 'btn btn-success',
                    popup: 'swal-wide'
                  },
                  preConfirm: () => {
                    navigator.clipboard.writeText(response.temporaryPassword);
                    Swal.fire({
                      icon: 'info',
                      title: 'Copied!',
                      text: 'Password copied to clipboard',
                      timer: 1500,
                      showConfirmButton: false
                    });
                    return response.temporaryPassword;
                  }
                }).then((copyResult) => {
                  if (copyResult.isConfirmed) {
                    this.router.navigate(['/auth/login']);
                  }
                });
              } else {
                Swal.fire({
                  title: 'Reset Link Sent!',
                  html: `
                    <div class="text-center">
                      <i class="fas fa-envelope fa-3x text-primary mb-3"></i>
                      <p class="text-danger"> Feature will be live soon in PRODUCTION !!</p>
                      <p>Password reset instructions have been sent to:</p>
                      <p class="fw-bold text-primary">${response.email || this.form.value.email}</p>
                      <div class="alert alert-info mt-3 small">
                        <i class="fas fa-info-circle me-1"></i>
                        Check your email for the reset link.
                      </div>
                    </div>
                  `,
                  icon: 'success',
                  confirmButtonText: 'OK',
                  confirmButtonColor: '#28a745'
                }).then(() => {
                  this.router.navigate(['/auth/login']);
                });
              }
              
              this.hasSuccess = true;
              this.form.reset();
            } else {
              this.hasError = true;
              this.errorMsg = response.error || 'Failed to reset password. Please try again.';
              
              Swal.fire({
                title: 'Reset Failed',
                text: this.errorMsg,
                icon: 'error',
                confirmButtonColor: '#dc3545'
              });
            }
          },
          error: (error: any) => {
            this.isLoading = false;
            this.hasError = true;
            this.errorMsg = error.error?.error || 'An error occurred. Please try again.';
            
            Swal.fire({
              title: 'Error',
              text: this.errorMsg,
              icon: 'error',
              confirmButtonColor: '#dc3545'
            });
            
            console.error('Forgot password error:', error);
          }
        });
      }
    });
  }
}