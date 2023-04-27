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

  public allProductCategories: any;

  isLoading: boolean;

  constructor(
    public activeModal: NgbActiveModal,
    public fb: FormBuilder,
    private _httpService: HttpService) {
  }

  ngOnInit() {

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [this.formData ? this.formData.description : '', [Validators.required]],
      parentId: [this.formData ? this.formData.parentId : '', [Validators.nullValidator]],
    });


    this.getAllProductCategories();
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


  private createRecord(): any {

    this.isLoading = true;

    const model = {
      name: this.form.value.name,
      description: this.form.value.description,
      parentCategoryId: this.form.value.parentId,
    };

    let formData=new FormData;
    formData.append('category',
    new Blob([JSON.stringify(model)], {type: "application/json"} ));
    formData.append('file', this.imageFile);
     console.log(formData)

    this._httpService.mobileBankingFormRequestPost('product/portal/category/create', formData).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.isLoading = false;

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

    this.isLoading = true;
    const model = {
      id: this.formData.id,
      name: this.form.value.name,
      description: this.form.value.description,
      parentCategoryId: this.form.value.parentId,
    };

    let formData=new FormData;
    formData.append('category',
      new Blob([JSON.stringify(model)], {type: "application/json"} ));
    formData.append('file', this.imageFile);
    console.log(formData)

    this._httpService.mobileBankingPostFormData('product/portal/category/update', formData).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.activeModal.close('success');
          this.isLoading = false;

          Swal.fire('Product Category Edited',
            'Product Category has been edited successfully.',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Record editing error',
            'Product Category could not be edited.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record editing error',
          `${error}`,
          'error')
      }
    );
  }

  private getAllProductCategories() {
    const model = {
      page: 0,
      size: 50,
    };

    this._httpService
      .mobileBankingPost('product/portal/category/fetch/all', model)
      .subscribe((res: any) => {
        if (res.status === 200) {
          setTimeout(() => {
            this.allProductCategories = res.data;
          }, 10);
        } else {
        }
      });
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

}
