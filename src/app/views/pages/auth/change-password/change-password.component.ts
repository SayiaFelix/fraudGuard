// =========================
// Angular: change-password.component.ts
// =========================
 
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
 
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { HttpService } from '../../../../shared/services/http.service';
 
@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit {
  errorMsg: string = '';
  hasError: boolean = false;
  isLoading: boolean = false;
 
  public form: FormGroup;
  public showingPassword = false;
  public inputType = 'password';
  public modalRef: NgbModalRef;
  public returnUrl: string;
 
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private modalService: NgbModal,
    fb: FormBuilder
  ) {
    this.form = fb.group({
      code: ['', Validators.required], // changed from resetToken to code
      new_password: ['', [Validators.required, Validators.minLength(8), this.complexPasswordValidator()]],
      confirm_password: ['', [Validators.required, Validators.minLength(8)]]
    }, {
      validators: this.matchPassword('new_password', 'confirm_password')
    });
  }
 
  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }
 
  matchPassword(passwordKey: string, confirmKey: string): ValidatorFn {
    return (formGroup: AbstractControl): { [key: string]: any } | null => {
      const password = formGroup.get(passwordKey);
      const confirm = formGroup.get(confirmKey);
      if (password && confirm && password.value !== confirm.value) {
        confirm.setErrors({ MatchPassword: true });
      } else {
        confirm?.setErrors(null);
      }
      return null;
    };
  }
 
  complexPasswordValidator(): ValidatorFn {
    const valueCheck = (value: string) => ({
      hasUpperCase: /[A-Z]/.test(value),
      hasLowerCase: /[a-z]/.test(value),
      hasNumber: /\d/.test(value),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
 
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) return null;
 
      const { hasUpperCase, hasLowerCase, hasNumber, hasSpecial } = valueCheck(value);
      const isValid = hasUpperCase && hasLowerCase && hasNumber && hasSpecial;
 
      return isValid ? null : { complexPassword: true };
    };
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
    this.modalRef.componentInstance.title = 'Set Password';
    this.modalRef.componentInstance.body = 'Do you want to set this as your new password?';
 
    this.modalRef.result.then(result => {
      if (result === 'success') {
        this.hasError = false;
        this.isLoading = true;
 
        const model = {
          code: this.form.value.code,
          new_password: this.form.value.new_password,
          confirm_password: this.form.value.confirm_password
        };
 
        this.httpService.customerPortalAuth('reset-password', model).subscribe({
          next: (response: any) => {
            if (response.status !== '00') {
              Swal.fire('Error', response.message || 'Reset failed', 'error');
              this.hasError = true;
              this.errorMsg = response.message || 'Unknown error';
              this.form.reset();
            } else {
              Swal.fire('Success', 'Password Set Successfully', 'success');
              this.router.navigate(['/auth/login']);
              localStorage.setItem('isLoggedin', 'true');
            }
            this.isLoading = false;
          },
          error: () => {
            this.hasError = true;
            this.errorMsg = 'Network or server error';
            this.isLoading = false;
          }
        });
      }
    }).catch(() => {
      console.log('Modal closed or dismissed');
    });
  }
}
 
 