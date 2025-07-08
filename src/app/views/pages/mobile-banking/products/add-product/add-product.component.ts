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
  ClassData: any[];
  SubClassData: any;
  enterpriseData: any;
  selectedClass: any;
  classData: any[];
  enterpriseItems: any;

  constructor(
    public activeModal: NgbActiveModal,
    public fb: FormBuilder,
    private _httpService: HttpService) {
  }

  ngOnInit() {

    this.form = this.fb.group({
      class_name: [this.formData ? this.formData.class_name : '', [Validators.required]],
      requestType: [this.formData ? this.formData.request_category : '', [Validators.required]],
      subClass_Id: [{ value: this.formData ? this.formData.subClass_Id : '', disabled: true }, [Validators.required]],
    });

    this.getUsers();
    this.getClassData(0);
    this.getSubClassData(0);
  }

  getUsers() {
    this._httpService.getEnterpriseUsers('api/v1/auth/facilities').subscribe( res=>{
      this.enterpriseData = res;
      console.log(this.enterpriseData)
    })
  }

  getClassData(event: number): void {
    this.loading = true;
    this._httpService
      .customerPortalPost('api/v1/portal/getClassAndSubclasses',{})
      .subscribe((res: any) => {
        console.log(res)
        if (res.status === '00') {
          this.loading = false;
          setTimeout(() => {
           this.ClassData = res.data
            console.log(this.ClassData)
          }, 10);
        } else {
          this.loading = false;
        }
      });
    this.loading = false;
  }

  getSubClassData(event: number): void {
    this.loading = true;
    this._httpService
      .customerPortalPost('api/v1/portal/getSubClassesAndClasses',{})
      .subscribe((res: any) => {
        console.log(res)
        if (res.status === '00') {
          this.loading = false;
          setTimeout(() => {
           this.SubClassData = res.data
            console.log(this.SubClassData)
          }, 10);
        } else {
          this.loading = false;
        }
      });
    this.loading = false;
  }

  public submitData(): void {

    console.log(this.form)
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

    let userId = JSON.parse(localStorage.getItem('data')!)['user']['id']
    const model = {
      userId,
      requestType: this.form.value.requestType,
      subClass_Id: this.form.value.subClass_Id,
    };
    console.log(model)
    this._httpService.customerPortalPost('api/v1/portal/requestAccreditation', model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.activeModal.close('success');
          Swal.fire('Request Recieved Successfully',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Request Failed, Try Again',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Request error',
          'error')
      }
    );

  }

  private editRecord(): any {

    // this.isLoading = true;
    // const model = {
    //   id: this.formData.id,
    //   name: this.form.value.name,
    //   description: this.form.value.description,
    //   parentCategoryId: this.form.value.parentId,
    // };

    // let formData=new FormData;
    // formData.append('category',
    //   new Blob([JSON.stringify(model)], {type: "application/json"} ));
    // formData.append('file', this.imageFile);
    // console.log(formData)

    // this._httpService.mobileBankingPostFormData('product/portal/category/update', formData).subscribe(
    //   (result: any) => {
    //     if (result.status === 200) {
    //       this.activeModal.close('success');
    //       this.isLoading = false;

    //       Swal.fire('Product Category Edited',
    //         'Product Category has been edited successfully.',
    //         'success').then(r => console.log(r))
    //     } else {
    //       this.activeModal.close('error');
    //       Swal.fire('Record editing error',
    //         'Product Category could not be edited.',
    //         'error').then(r => console.log(r))
    //     }
    //   },
    //   (error: any) => {
    //     Swal.fire('Record editing error',
    //       `Record deletion error`,
    //       'error')
    //   }
    // );
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  public checkFormValue(event:any) {
    console.log(event.target.value);
    // filter
    this.selectedClass = this.ClassData.filter(item => { 
    console.log(item);
    console.log(item.id)
      return parseInt(item.id) == parseInt(event.target.value)
    })

    this.enterpriseItems = this.selectedClass.map((item: any) => item.subEnterprises);

    console.log('this.enterpriseItems');
    console.log(this.enterpriseItems);

    if (this.form.value.class_name) {
      this.getSubClassData(event.target.value);
      this.form.controls['subClass_Id'].enable()
    } else {
      this.form.controls['subClass_Id'].disable()
    }
  }

}
