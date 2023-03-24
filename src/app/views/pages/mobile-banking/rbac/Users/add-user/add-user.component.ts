import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {GlobalService} from "../../../../../../shared/services/global.service";
import Swal from "sweetalert2";
import { StringDecoder } from 'string_decoder';


@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {

  @Input() title: any;
  @Input() formData: any;
  public loading = false;
  public hasErrors = false;
  public errorMessages = "";
  public form: FormGroup;

  constructor(
      public activeModal: NgbActiveModal,
      public fb: FormBuilder,
      private _httpService: HttpService,
      public globalService: GlobalService) {
  }

  ngOnInit() {

    console.log("here is the this.formData")
    console.log(this.formData)

    this.form = this.fb.group({
      firstName: [this.formData ? this.formData.firstName : '', [Validators.required]],
      middleName: [this.formData ? this.formData.middleName : '', [Validators.required]],
      lastName: [this.formData ? this.formData.lastName : '', [Validators.required]],
      phone: [this.formData ? this.formData.phone : '', [Validators.required]],
      email: [this.formData ? this.formData.email : '', [Validators.required]],
      profile: [this.formData ? this.formData.profile : '', [Validators.nullValidator]]
    });

  }

  public submitData(): void {
    if (this.formData) {
      this.saveChanges();
    } else {
      this.createRecord();
    }
    this.loading = true;
  }

  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

  private createRecord(): any {

    const model = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      email: this.form.value.email,
      profileId:this.form.value.profile,
    };


    this._httpService.mobileBankingPost('api/v1/admin/user/create', model).subscribe(
      (result: any) => {
          if (result.status === 200) {
            this.activeModal.close('success');
            Swal.fire(result.mesage,'success')
            .then(r => console.log(r))
            console.log('result')
          } else {
            this.activeModal.close('error');
            Swal.fire(result.message,'error')
            .then(r =>console.log(r))
          }
        }
    );
  }

  private saveChanges(): any {

    const model = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      email: this.form.value.email,
      profileId:1
    };


    this._httpService.mobileBankingPost('api/v1/admin/user/update', model).subscribe(
      (result: any) => {
          if (result.status === 200) {
            this.activeModal.close('success');
            Swal.fire('Update successful','records updated successfully','success')
            .then(r =>(console.log(r)))
          } else {
            this.activeModal.close('error');
            Swal.fire('failed to update','error updating records','error')
            .then(r =>(console.log(r)))
          }
        }
    );
  }

}
