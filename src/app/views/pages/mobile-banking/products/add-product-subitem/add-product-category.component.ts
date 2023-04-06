import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';
import Swal from "sweetalert2";

@Component({
  selector: 'app-product-category',
  templateUrl: './add-product-category.component.html',
  styleUrls: ['./add-product-category.component.scss']
})
export class AddProductCategoryComponent implements OnInit {
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
    public globalService: GlobalService) {
  }

  ngOnInit() {
    this.loadProducts();


    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '',
        [Validators.required]],
      shortDescription: [this.formData ? this.formData.shortDescription : '',
        [Validators.required]],
      productDescription: [this.formData ? this.formData.productDescription : '',
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
      productCategoryId: this.productCategoryId
    };


    const formData = new FormData();

    formData.append('product', JSON.stringify(model));
    formData.append('image', this.imageFile);

    this.httpService.mobileBankingFormRequestPost('product/portal/category/create', formData).subscribe(
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
          `${error}`,
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

    formData.append('product', JSON.stringify(model));
    formData.append('image', this.imageFile);

    this.httpService.mobileBankingPost('product/portal/category/update', formData).subscribe(
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
          `${error}`,
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
