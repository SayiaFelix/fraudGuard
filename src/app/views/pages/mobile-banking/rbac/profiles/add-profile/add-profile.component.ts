import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ToastrService} from 'ngx-toastr';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {GlobalService} from '../../../shared/services/global.service';


@Component({
  selector: 'app-add-profile',
  templateUrl: './add-profile.component.html',
  styleUrls: ['./add-profile.component.scss']
})
export class AddProfileComponent implements OnInit {

  @Input() title;
  @Input() formData;
  public loading = false;
  public hasErrors = false;
  public errorMessages;
  public form: FormGroup;

  constructor(
      public activeModal: NgbActiveModal,
      public fb: FormBuilder,
      private _httpService: HttpService,
      public toastrService: ToastrService,
      public globalService: GlobalService) {
  }

  ngOnInit() {
    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [this.formData ? this.formData.description : '', [Validators.required]],
      is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
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
        name: this.form.value.name,
        remarks: this.form.value.description
    };


    this._httpService.advancysPost('api/v1/bank/profile/new', model).subscribe(
        result => {
          if (result.status === 200) {
            this.toastrService.success('Profile staged successfully!', 'Created Successfully!');
            this.activeModal.close('success');
          } else {
            this.toastrService.error(result.message, 'Failed!');
            this.activeModal.close('error');

          }
        },
        error => {
        },
        complete => {
          this.loading = false;
        }
    );
  }

  private saveChanges(): any {

    const model = {
        name: this.form.value.name,
        remarks: this.form.value.description
    };


    this._httpService.advancysPost('api/v1/bank/profile/new', model).subscribe(
        result => {
          if (result.status === 200) {
            this.toastrService.success('Profile updated successfully!', 'Updated Successfully!');
            this.activeModal.close('success');
          } else {
            this.toastrService.error('Failed to update!', 'Failed!');
            this.activeModal.close('error');
          }
        },
        error => {
        },
        complete => {
          this.loading = false;
        }
    );
  }

}
