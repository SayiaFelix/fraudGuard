import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from "sweetalert2";

@Component({
  selector: 'app-add-workflow-step',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent implements OnInit {

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

    console.log("this.formData");
    console.log(this.formData);

    this.form = this.fb.group({
      name: [this.formData ? this.formData.productName : '', [Validators.required]],
      description: [this.formData ? this.formData.remarks : '', [Validators.required]],
      parentId: [this.formData ? this.formData.parentId : '', [Validators.nullValidator]],
      image: [this.formData ? this.formData.image : '', [Validators.nullValidator]]
    });

  }

  public submitData(): void {
    if (this.formData) {
      this.editRecord();
    } else {
      this.createRecord();
    }
    this.loading = true;
  }

  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  private createRecord(): any {

    const model = {
      name: this.form.value.name,
      description: this.form.value.description,
      parentCategoryId: this.form.value.parentId,
      approvalId: null
    };


    this._httpService.mobileBankingPost('api/v1/bank/profile/new', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.activeModal.close('success');
          Swal.fire('Product Category Created',
            'Product Category has been created successfully.',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Record creation error',
            'Product Category could not be created.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record creation error',
          `${error}`,
          'error')
      }
    );

  }

  private editRecord(): any {
  }
}
