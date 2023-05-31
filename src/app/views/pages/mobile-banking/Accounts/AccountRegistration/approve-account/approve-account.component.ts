import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from "sweetalert2";

@Component({
  selector: 'app-approve-account',
  templateUrl: './approve-account.component.html',
  styleUrls: ['./approve-account.component.scss']
})
export class ApproveAccountComponent implements OnInit {
  @Input() title: any;
  @Input() formData: any;
  public loading = false;
  public hasErrors = false;
  public errorMessages: any;
  public form: FormGroup;
  public imageFile: File;

  constructor(
      public activeModal: NgbActiveModal,
      public fb: FormBuilder,
      private _httpService: HttpService) {
  }

  ngOnInit() {

    console.log('this.formData');
    console.log(this.formData);

      this.form = this.fb.group({
          remarks: ['', [Validators.required]],
      });

  }

  public closeModal(): void {
      this.activeModal.dismiss('Cross click');
  }

  approveAccount(status: string) {

    const model = {
      action: status,
      message: this.form.value.remarks,
      requestId: this.formData.requestId
    }

    this._httpService.mobileBankingPostUpdated('api/v1/mbs/on-board/accounts/process', model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.activeModal.close('success');
          Swal.fire('Approval Successful',
            'Account has been approved successfully.',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Approval failed',
            'Account could not be approved.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record editing error',
          `Record editing error`,
          'error')
      }
    );

  }

  rejectAccount(status: string) {
    const model = {
      action: status,
      message: this.form.value.remarks,
      requestId: this.formData.requestId
    }

    this._httpService.mobileBankingPostUpdated('api/v1/mbs/on-board/accounts/process', model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.activeModal.close('success');
          Swal.fire('Rejection Successful',
            'Account has been rejected successfully.',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Rejection failed',
            'Account could not be rejected.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record editing error',
          `Record editing error`,
          'error')
      }
    );
  }

onFileChange(event: any) {
  if (event.target.files && event.target.files.length) {
    this.imageFile = event.target.files[0];
  }
}



}
