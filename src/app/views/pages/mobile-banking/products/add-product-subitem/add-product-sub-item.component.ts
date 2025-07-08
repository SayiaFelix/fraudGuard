import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';
import Swal from "sweetalert2";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-product-sub-item',
  templateUrl: './add-product-sub-item.component.html',
  styleUrls: ['./add-product-sub-item.component.scss']
})
export class AddProductSubItemComponent implements OnInit {
  @Input() title: any;
  @Input() formData: any;
  @Input() productCategoryId: any;
  public loading = false;
  public hasErrors = false;
  public errorMessages: any;
  public form: FormGroup;

  public allProfiles: any[];
  public imageFile: File;

  public features = ['Get access up to 70% of your monthly salary'];
  public requirements = ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'];

  constructor(
    public activeModal: NgbActiveModal,
    public fb: FormBuilder,
    private httpService: HttpService,
    private activatedRoute: ActivatedRoute,
    public globalService: GlobalService) {
  }

  ngOnInit() {
    this.loadProducts();

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '',
        [Validators.required]],
      shortDescription: [this.formData ? this.formData.shortDescription : '',
        [Validators.required]],
      productCode: [this.formData ? this.formData.productCode : '',
        [Validators.required]],
      productDescription: [this.formData ? this.formData.detailedDescription : '',
        [Validators.required]],

      feature: [this.formData ? this.formData.feature : ''],
      requirement: [this.formData ? this.formData.requirement : '']
    });

  }

  public submitData(): void {
    if (this.formData) {
      this.saveChanges(this.formData);
    } else {
      this.createRecord();
    }
    this.loading = true;
  }

  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

  logForm() {
    // console.log(this.form);
  }

  onFileChange(event: any) {

    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  addFeature() {
    this.features = [this.form.value.feature, ...this.features];
  }

  addRequirement() {
    this.requirements = [this.form.value.requirement, ...this.requirements];
  }

  private createRecord(): any {

    this.loading = true;

    const model = {
      name: this.form.value.name,
      shortDescription: this.form.value.shortDescription,
      productDescription: this.form.value.productDescription,
      productCode: this.form.value.productCode,
      productCategoryId: this.productCategoryId,
      approvalId: 4
    };


    let formData = new FormData();

    console.log("model")
    console.log(model)

    formData.append('product',
      new Blob([JSON.stringify(model)], {type: "application/json"} ));
    formData.append('image', this.imageFile);
    // formData.append("image", this.imageFile, "/home/allang/Downloads/eclectics/tylersoft-backend/esb-wallet/src/main/resources/images/mari.png");


    console.log("here is the formData")
    console.log(formData)

    this.httpService.mobileBankingFormRequestPost('product/portal/create', formData).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.activeModal.close('success');
          Swal.fire('Product Created',
            'Product has been created successfully.',
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
          `Record creation error`,
          'error')
      }
    );


  }

  private saveChanges(data: any): any {

    this.loading = true;

    // console.log('prev data');
    // console.log(data);


    const model = {
      id: data.id,
      name: this.form.value.name,
      shortDescription: this.form.value.shortDescription,
      productDescription: this.form.value.productDescription,
      productCategoryId: this.productCategoryId
    };


    const formData = new FormData();

    formData.append('product',
      new Blob([JSON.stringify(model)], {type: "application/json"} ));
    formData.append('image', this.imageFile);

    this.httpService.mobileBankingPostFormData('product/portal/update', formData).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.activeModal.close('success');
          Swal.fire('Product Updated',
            'Product has been updated successfully.',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Record update error',
            'Product could not be updated.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record creation error',
          `Record creation error`,
          'error')
      }
    );

  }

  private loadProducts() {
    const model = {
      page: 0,
      size: 100
    };


  }
}
