// import {Component, Input, OnInit} from '@angular/core';
// import {FormBuilder, FormGroup, Validators} from '@angular/forms';
// import {ToastrService} from 'ngx-toastr';
//
// import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
// import {HttpService} from '../../../../../shared/services/http.service';
// import {GlobalService} from '../../../../../shared/services/global.service';
//
//
// @Component({
//   selector: 'app-add-product',
//   templateUrl: './add-product.component.html',
//   styleUrls: ['./add-product.component.scss']
// })
// export class AddProductComponent implements OnInit {
//
//   @Input() title;
//   @Input() formData;
//   public loading = false;
//   public hasErrors = false;
//   public errorMessages;
//   public form: FormGroup;
//   public imageFile: File;
//   constructor(
//       public activeModal: NgbActiveModal,
//       public fb: FormBuilder,
//       private _httpService: HttpService,
//       public toastrService: ToastrService,
//       public globalService: GlobalService) {
//   }
//
//   ngOnInit() {
//     this.form = this.fb.group({
//       name: [this.formData ? this.formData.name : '', [Validators.required]],
//       description: [this.formData ? this.formData.description : '', [Validators.required]],
//       is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
//     });
//
//   }
//
//   public submitData(): void {
//     if (this.formData) {
//       this.saveChanges();
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
//   private createRecord(): any {
//
//     const model = {
//         name: this.form.value.name,
//         remarks: this.form.value.description
//     };
//
//
//     this._httpService.advancysPost('corporate/admin/profile/create', model).subscribe(
//         result => {
//           if (result.status === 200) {
//             this.toastrService.success('Product staged successfully!', 'Created Successfully!');
//             this.activeModal.close('success');
//           } else {
//             this.toastrService.error(result.message, 'Failed!');
//             this.activeModal.close('error');
//
//           }
//         },
//         error => {
//         },
//         complete => {
//           this.loading = false;
//         }
//     );
//   }
//
//   private saveChanges(): any {
//
//     const model = {
//         name: this.form.value.name,
//         remarks: this.form.value.description
//     };
//
//
//     this._httpService.advancysPost('corporate/update/profile', model).subscribe(
//         result => {
//           if (result.status === 200) {
//             this.toastrService.success('Product updated successfully!', 'Updated Successfully!');
//             this.activeModal.close('success');
//           } else {
//             this.toastrService.error('Failed to update!', 'Failed!');
//             this.activeModal.close('error');
//           }
//         },
//         error => {
//         },
//         complete => {
//           this.loading = false;
//         }
//     );
//   }
//
//   onFileChange(event: any) {
//     if (event.target.files && event.target.files.length) {
//       this.imageFile = event.target.files[0];
//     }
//   }
// }
