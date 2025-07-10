import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import Swal from 'sweetalert2';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../../shared/services/http.service';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-changePassword',
  templateUrl: './changePassword.component.html',
  styleUrls: ['./changePassword.component.scss']
})
export class ChangeAuthPasswordComponent implements OnInit {
  form!: FormGroup;
  inputType = 'password';
  showingPassword = false;
  isLoading = false;
  hasError = false;
  errorMsg = '';
  modalRef!: NgbModalRef;
  returnUrl: string = '/';

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private modalService: NgbModal,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        newPassword: ['', [Validators.required, Validators.minLength(8), this.complexPasswordValidator()]],
        confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
      },
      {
        validators: this.matchPassword('newPassword', 'confirmPassword')
      }
    );
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  toggleShowPassword(): void {
    this.showingPassword = !this.showingPassword;
    this.inputType = this.showingPassword ? 'text' : 'password';
  }

  onSubmit(e: Event): void {
    e.preventDefault();
    this.setPassword();
  }

  setPassword(): void {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true });
    this.modalRef.componentInstance.title = 'Change Password';
    this.modalRef.componentInstance.body = 'Do you want to set this as your new password?';

    this.modalRef.result.then((result) => {
      if (result === 'success') {
        const model = {
          password: this.form.value.password,
          newPassword: this.form.value.newPassword,
          confirmPassword: this.form.value.confirmPassword
        };

        this.isLoading = true;
        this.httpService.customerPortalAuth('api/v1/auth/change-password', model).subscribe(
          (res: any) => {
            this.isLoading = false;
            if (res.status === '00') {
              Swal.fire('Success', 'Password changed successfully.', 'success');
              localStorage.removeItem('authToken'); // optional logout
              this.router.navigate(['/auth/login']);
            } else {
              Swal.fire('Error', res.message || 'Incorrect password', 'error');
            }
          },
          (error) => {
            this.isLoading = false;
            Swal.fire('Server Error', 'Something went wrong. Please try again.', 'error');
          }
        );
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  matchPassword(newPass: string, confirmPass: string) {
    return (formGroup: FormGroup) => {
      const newPassword = formGroup.controls[newPass];
      const confirmPassword = formGroup.controls[confirmPass];

      if (newPassword.value !== confirmPassword.value) {
        confirmPassword.setErrors({ matchPassword: true });
      } else {
        confirmPassword.setErrors(null);
      }
    };
  }

  complexPasswordValidator() {
    return (control: AbstractControl) => {
      const value = control.value;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const valid = hasUpper && hasLower && hasNumber && hasSpecial;

      if (valid) {
        return null;
      } else {
        return {
          complexPassword: {
            requiresUpper: !hasUpper,
            requiresLower: !hasLower,
            requiresNumber: !hasNumber,
            requiresSpecial: !hasSpecial
          }
        };
      }
    };
  }
}
