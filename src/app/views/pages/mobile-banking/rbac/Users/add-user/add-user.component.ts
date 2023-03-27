import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {GlobalService} from "../../../../../../shared/services/global.service";
import {catchError, map, Observable, throwError} from "rxjs";
import Swal from "sweetalert2";


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
  public editUser$: Observable<any>;
  public allProfiles: any;

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


    this.httpService.mobileBankingPost('api/v1/admin/user/create', model).subscribe(
      (result: any) => {
          if (result.status === 200) {
            this.activeModal.close('success');
            Swal.fire('success',result.mesage)
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
      id: this.formData.id,
      firstName: this.form.value.firstName,
      lastName: this.form.value.firstName,
      profileId: this.form.value.profile
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
}
