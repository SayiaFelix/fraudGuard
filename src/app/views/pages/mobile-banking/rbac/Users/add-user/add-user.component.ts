import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {GlobalService} from "../../../../../../shared/services/global.service";
import {catchError, map, Observable, throwError} from "rxjs";
import Swal from "sweetalert2";
import { CompanyEmailValidator } from 'src/app/shared/services/validators/CompanyEmailValidators';
import { EmployeePhoneNumberValidators } from 'src/app/shared/services/validators/EmployeePhoneNumberValidators';


@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {

  @Input() title: any;
  @Input() formData: any;
  public hasErrors = false;
  public errorMessages = "";
  public form: FormGroup;
  public editUser$: Observable<any>;
  public allProfiles: any;

  public isLoading: boolean;

  constructor(
      public activeModal: NgbActiveModal,
      public fb: FormBuilder,
      private httpService: HttpService,
      public globalService: GlobalService) {
  }

  ngOnInit() {

    console.log("this.formData");
    console.log(this.formData);

    this.getAllProfiles();

    this.form = this.fb.group({
      firstName: [this.formData ? this.formData.firstName : '', [Validators.required,Validators.pattern('^([^0-9]*)$')]],
      middleName: [this.formData ? this.formData.middleName : '', [Validators.required,Validators.pattern('^([^0-9]*)$')]],
      lastName: [this.formData ? this.formData.lastName : '', [Validators.required,Validators.pattern('^([^0-9]*)$')]],
      phoneNumber: [this.formData ? this.formData.phoneNumber : '', [Validators.required,EmployeePhoneNumberValidators.mustStartWith254]],
      email: [this.formData ? this.formData.email : '', [Validators.required, CompanyEmailValidator.mustBeBusinessEmail]],
      profile: [this.formData ? this.formData.profile : '', [Validators.nullValidator]]
    });


  }
  logErrors(){
    console.log(this.form);

  }

  public submitData(): void {
    this.isLoading = true;
    if (this.formData) {
      this.saveChanges();
    } else {
      this.createRecord();
    }
  }

  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

  private createRecord(): any {

    const model = {
      firstName: this.form.value.firstName,
      middleName:this.form.value.middleName,
      lastName: this.form.value.lastName,
      email: this.form.value.email,

      phoneNumber:this.form.value.phoneNumber,
      profileId:this.form.value.profile,
    };
    this.httpService.mobileBankingPost('api/v1/admin/user/create', model).subscribe(
      (result: any) => {
          if (result.status === 200) {
            this.isLoading = false;
            this.activeModal.close('success');
            Swal.fire('Success',result.mesage, "success")
            .then(r => console.log(r))
            console.log('result')
          } else {
            this.activeModal.close('error');
            Swal.fire('Error', result.message, "error")
            .then(r =>console.log(r))
          }
        }
    );
  }

  private saveChanges(): any {
    const model = {
      id: this.formData.id,
      firstName: this.form.value.firstName,
      middleName:this.form.value.middleName,
      lastName: this.form.value.firstName,
      email: this.form.value.email,
      phoneNumber:this.form.value.phoneNumber,
      profileId:parseInt(this.form.value.profile, 10)
    };

    this.editUser$ = this.httpService.mobileBankingPost('api/v1/admin/user/update',
      model)
      .pipe(
      catchError((error: any) => {
        Swal.fire('Failed', "Unable to Edit User", 'error')
        return throwError(error);
      }),
      map((res: any) => {
        if (res.status === 200) {
          this.isLoading = false;
          setTimeout(() => {
            Swal.fire('Success', 'User Edited Successfully.', 'success')
          }, 10);
        } else {
          Swal.fire('Failed', res.message, 'error')
        }
      }))

  }

  private getAllProfiles() {

    const model = {
      page: 0,
      size: 100
    };

    this.httpService.mobileBankingPost('api/v1/admin/profile/get/all', model).subscribe(
      (res: any) => {

        if (res.status === 200) {
            this.allProfiles = res.data;
        }
      });
  }

  showFormErrors(){
    console.log("this.form");
    console.log(this.form);
  }
}
