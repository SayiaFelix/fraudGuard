import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {ConfirmDialogComponent} from "../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {HttpService} from "../../../../shared/services/http.service";
import {AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators} from "@angular/forms";
import {CustomValidators} from "ngx-custom-validators";

@Component({
  selector: 'app-first-time-login',
  templateUrl: './first-time-login.component.html',
  styleUrls: ['./first-time-login.component.scss']
})
export class FirstTimeLoginComponent implements OnInit {
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  returnUrl: any;
  public modalRef: NgbModalRef;

  public form: FormGroup;
  public showingPassword = false;
  inputType = 'password';

  MatchPassword(passName: string, confirmPassName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[passName];
      const matchingControl = formGroup.controls[confirmPassName];
      if (matchingControl.errors && !matchingControl.errors['MatchPass']) {
        return
      }
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ MatchPassword: true });
      }
      else {
        matchingControl.setErrors(null);
      }
    }

  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private modalService: NgbModal,
    fb: FormBuilder,
  ) {
    this.form = fb.group({
      lookUpToken: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8), this.complexPasswordValidator()]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    }, {
      validators: this.MatchPassword('password', 'confirmPassword')
    });
  }

  ngOnInit(): void {
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  complexPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
  
      // Define the password complexity rules here
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
      const isComplex = hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
  
      // Return the validation result
      return isComplex ? null : { complexPassword: true };
    };
  }
  
  onSubmit(e: Event) {
    console.log("On button click")
    e.preventDefault();
    this.setPassword();
  }

setPassword() {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true });
    this.modalRef.componentInstance.title = 'Set Password';
    this.modalRef.componentInstance.body = "Do you want to set this as your new password?";

    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.hasError = false;
        this.isLoading = true;

        // Make sure the token is present and valid
        const access_token = localStorage.getItem('access_token');
        if (!access_token) {
          this.hasError = true;
          this.errorMsg = 'No authentication token found. Please log in again.';
          Swal.fire('Error', this.errorMsg, 'error');
          this.isLoading = false;
          return;
        }

        // Prepare payload according to backend requirements
        const model = {
          old_password: this.form.value.lookUpToken,
          new_password: this.form.value.password,
          confirm_password: this.form.value.confirmPassword
        };

        const headers = { Authorization: `Bearer ${access_token}` };

        this.httpService.customerPortalAuth('auth/change-password', model, { headers }).subscribe({
          next: (response: any) => {
            if (response.status === '00') {
              Swal.fire('Password Set', 'Password Set Successfully.', 'success');
              this.router.navigate(["/auth/login"]);
              localStorage.setItem('isLoggedin', 'true');
            } else {
              Swal.fire('Error', response.error || 'You have entered an incorrect password', 'error');
              this.hasError = true;
              this.errorMsg = response.error || 'An unknown error occurred.';
              this.form.reset();
            }
            this.isLoading = false;
          },
          error: (err) => {
            this.hasError = true;
            this.errorMsg = 'A network error occurred or you are not authorized. Please check your token and try again.';
            Swal.fire('Network Error', this.errorMsg, 'error');
            this.isLoading = false;
          }
        });
      }
    }).catch(() => {
      console.log('Password set cancelled by user.');
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

}
