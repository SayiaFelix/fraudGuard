import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {ConfirmDialogComponent} from "../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {HttpService} from "../../../../shared/services/http.service";

@Component({
  selector: 'app-first-time-login',
  templateUrl: './first-time-login.component.html',
  styleUrls: ['./first-time-login.component.scss']
})
export class FirstTimeLoginComponent implements OnInit {

  returnUrl: any;
  public modalRef: NgbModalRef;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              private modalService: NgbModal,
              ) { }

  ngOnInit(): void {
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onLoggedin(e: Event) {
    e.preventDefault();

    this.resetPassword();


  }

  resetPassword(){
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Reset Password';

    this.modalRef.componentInstance.body= "Do you want to Reset password for this email address?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        const model = {
          email: "testEmail@gmail.com"
        };

        this.httpService.mobileBankingPost('endpoint', model).subscribe(
          (result: any) => {
            if (result.status === 200) {
              Swal.fire('Password Reset',  'Password Sent to Email.',  'success')

              // Navigate back to login screen.
              localStorage.setItem('isLoggedin', 'true');
              if (localStorage.getItem('isLoggedin')) {
                this.router.navigate([this.returnUrl]);
              }
            } else {

            }
          }
        );
        Swal.fire('Password Reset',  'Password Sent to Email.',  'success')
      } else {
        console.log("Error occurred")
      }
    });
  }

}
