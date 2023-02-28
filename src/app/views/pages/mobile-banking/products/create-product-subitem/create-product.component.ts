// import {FormBuilder, FormGroup, Validators} from '@angular/forms';
// import {Component, Input, OnInit} from '@angular/core';
// import {ToastrService} from 'ngx-toastr';
// import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
// import {HttpService} from '../../../../../shared/services/http.service';
// import {GlobalService} from '../../../../../shared/services/global.service';
//
// @Component({
//   selector: 'app-create-product',
//   templateUrl: './create-product.component.html',
//   styleUrls: ['./create-product.component.scss']
// })
// export class CreateProductComponent implements OnInit {
//   @Input() title;
//   @Input() formData;
//   public loading = false;
//   public hasErrors = false;
//   public errorMessages;
//   public form: FormGroup;
//
//   public allProfiles: any[];
//   public imageFile: File;
//
//   public features = ['Get access up to 70% of your monthly salary'];
//   public requirements = ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'];
//
//   constructor(
//     public activeModal: NgbActiveModal,
//     public fb: FormBuilder,
//     private httpService: HttpService,
//     public toastrService: ToastrService,
//     public globalService: GlobalService) {
//   }
//
//   ngOnInit() {
//     this.loadProducts();
//
//
//     this.form = this.fb.group({
//       name: [this.formData ? this.formData.name : '',
//         [Validators.required]],
//       description: [this.formData ? this.formData.description : '',
//         [Validators.required]],
//       longDescription: [this.formData ? this.formData.longDescription : '',
//         [Validators.required]],
//       feature: [this.formData ? this.formData.feature : ''],
//       requirement: [this.formData ? this.formData.requirement : '']
//     });
//
//   }
//
//   public submitData(): void {
//     if (this.formData) {
//       this.saveChanges(this.formData);
//     } else {
//       this.createRecord();
//     }
//     this.loading = true;
//   }
//
//   public closeModal(): void {
//     this.activeModal.dismiss('Cross click');
//   }
//
//   logForm() {
//     // console.log(this.form);
//   }
//
//   onFileChange(event: any) {
//     if (event.target.files && event.target.files.length) {
//       this.imageFile = event.target.files[0];
//     }
//   }
//
//   addFeature() {
//     this.features = [this.form.value.feature, ...this.features];
//   }
//
//   addRequirement() {
//     this.requirements = [this.form.value.requirement, ...this.requirements];
//   }
//
//   private createRecord(): any {
//
//     this.loading = true;
//
//     const model = {
//       firstName: this.form.value.firstName,
//       lastName: this.form.value.lastName,
//       middleName: this.form.value.middleName,
//       phoneNumber: this.form.value.phoneNumber,
//       email: this.form.value.email,
//       position: this.form.value.position,
//       profileId: this.form.value.profile
//     };
//
//     this.httpService.advancysPost('api/v1/corporate/admin/create', model).subscribe(
//       result => {
//         if (result.status === 200) {
//           this.toastrService.success(result.message, 'Created Successfully!');
//           this.activeModal.close('success');
//         } else {
//           this.activeModal.close('failed');
//           this.toastrService.error(result.message, 'Failed!');
//         }
//       },
//       error => {
//         this.toastrService.error(error, 'Failed!');
//       },
//       complete => {
//         this.loading = false;
//       }
//     );
//   }
//
//   private saveChanges(data): any {
//
//     this.loading = true;
//
//     // console.log('prev data');
//     // console.log(data);
//
//
//     const model = {
//       adminId: data.id,
//       firstName: this.form.value.firstName,
//       lastName: this.form.value.lastName,
//       middleName: this.form.value.middleName,
//       phoneNumber: this.form.value.phoneNumber,
//       email: data.email,
//       position: this.form.value.position,
//       profileId: this.form.value.profile
//     };
//
//     // console.log("here is the model");
//     // console.log(model);
//     this.httpService.advancysPost('api/v1/corporate/admin/update', model).subscribe(
//       result => {
//         if (result.status === 200) {
//           this.toastrService.success(result.message, 'Saved Changes!');
//           this.activeModal.close('success');
//         } else {
//           this.activeModal.close('failed');
//           this.toastrService.error(result.message, 'Error');
//         }
//       },
//       error => {
//         this.loading = false;
//         this.toastrService.error(error, 'Error');
//         this.errorMessages = error.error.error_messages;
//       },
//       complete => {
//         this.loading = false;
//       }
//     );
//   }
//
//   private loadProducts() {
//     const model = {
//       page: 0,
//       size: 100
//     };
//
//     this.httpService.advancysPost('api/v1/corporate/admin/list-products/all', model).subscribe(
//       result => {
//
//         // console.log(result.status);
//
//         if (result.status === 200) {
//
//           this.allProfiles = result.data;
//
//         } else {
//           this.toastrService.error('Failed to fetch profile records!', 'Failed!');
//         }
//       }
//     );
//   }
// }
