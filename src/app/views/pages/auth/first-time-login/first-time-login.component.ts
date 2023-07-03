import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {ConfirmDialogComponent} from "../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {HttpService} from "../../../../shared/services/http.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
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

  constructor(private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private modalService: NgbModal,
              fb: FormBuilder,

  ) {
    this.form = fb.group({
      lookUpToken: ['',Validators.compose([Validators.required])],
      password: ['',Validators.compose([Validators.required, Validators.minLength(6)])],
    });
  }

  ngOnInit(): void {
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(e: Event) {
    console.log("On button click")
    e.preventDefault();

    this.setPassword();


  }

  setPassword(){
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Set Password';

    this.modalRef.componentInstance.body= "Do you want to Set this as your new password?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        const model = {
          lookUpToken: this.form.value.lookUpToken,
          password: this.form.value.password
        };
        this.httpService.customerPortalAuth('api/v1/auth/first-time-password', model).subscribe(
          (result: any) => {
            if (result.status === '00') {
              Swal.fire('Password Set',  'Password Set Successfully.',  'success')
              // Navigate back to login screen.
              this.router.navigate(["/auth/login"]);
            } else {
              Swal.fire('Error',  'You have entered an incorrect password',  'error')
            }
          }
        );
      } else {
        console.log("Error occurred")
      }
    });
  }

}
