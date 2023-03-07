import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {GlobalService} from "../../../../../../shared/services/global.service";


@Component({
  selector: 'app-add-branch',
  templateUrl: './add-branch.component.html',
  styleUrls: ['./add-branch.component.scss']
})
export class AddBranchComponent implements OnInit {

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
      branchName: [this.formData ? this.formData.branchName : '', [Validators.required]],
      branchCode: [this.formData ? this.formData.branchCode : '', [Validators.required]],
      region: [this.formData ? this.formData.region : '', [Validators.required]],
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


    this._httpService.mobileBankingPost('api/v1/bank/profile/new', model).subscribe(
      (result: any) => {
          if (result.status === 200) {
            this.activeModal.close('success');
          } else {
            this.activeModal.close('error');

          }
        }
    );
  }

  private saveChanges(): any {

    const model = {
        name: this.form.value.name,
        remarks: this.form.value.description
    };


    this._httpService.mobileBankingPost('api/v1/bank/profile/new', model).subscribe(
      (result: any) => {
          if (result.status === 200) {
            this.activeModal.close('success');
          } else {
            this.activeModal.close('error');
          }
        }
    );
  }

}
