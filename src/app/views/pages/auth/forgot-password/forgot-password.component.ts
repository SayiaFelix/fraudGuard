import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ConfirmDialogComponent } from "../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
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
  public modalRef: NgbModalRef;
  errorMsg: string;
  hasError: boolean = false;
  hasSuccess: boolean = false;
  isLoading: boolean = false;

  constructor(private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    private modalService: NgbModal,
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
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onLoggedin(e: Event) {
    e.preventDefault();

    this.resetPassword();


  }

  resetPassword() {

    this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true });
    this.modalRef.componentInstance.title = 'Reset Password';

    this.modalRef.componentInstance.body = "Do you want to Reset password for this email address?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.hasError = false;
        this.hasSuccess = false
        this.isLoading = true;
        const model = {
          email: this.form.value.email,
        };
        this.httpService.customerPortalAuth('forgot-password', model).subscribe(
          (result: any) => {
            if (result.status != "00") {
              setTimeout(() => {
                Swal.fire('Password Reset', 'Fail to Sent to Password.', 'error')
                console.log('Reset failed:', result);
                this.hasError = true;
                this.errorMsg = result['error'];
                this.form.reset()
                this.isLoading = false;
              }, 2000);
            } else {
              setTimeout(() => {
                Swal.fire('Password Reset', 'Password Sent to Email.', 'success')
                this.router.navigate(['/auth/change-password']);
                // console.log('Reset successful:', result);
                // localStorage.setItem('isLoggedin', 'true');
                this.hasSuccess = true
                this.isLoading = false;
                this.form.reset()
              }, 1000);
            }
            this.isLoading = false;
          }
        );
        // Swal.fire('Password Reset',  'Failed To Sent Password ,Try Again.',  'error')
      } else {
        console.log("Error occurred")
      }
    });
  }

}
