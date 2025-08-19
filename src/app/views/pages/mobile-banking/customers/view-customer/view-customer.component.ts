import {Component, ElementRef, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ActivatedRoute, Params} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { ColumnMode } from '@swimlane/ngx-datatable';
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {ChannelDetailsWrapper} from "../../../../../shared/services/channelDetailsWrapper";

@Component({
  selector: 'app-view-customer',
  templateUrl: './view-customer.component.html',
  styleUrls: ['./view-customer.component.scss']
})
export class ViewCustomerComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef;
  breadCrumbItems: Array<{}>;
  rows: any = [];
  channelRows: any = [];
  loadingIndicator = true;
  reorderable = true;
  uploadedFile: File | null = null;
  trainingForm: FormGroup;  
  chatbotId: string;
  showUrlInput = false;
  showCodeInput = false;

  Transactioncolumns = [
    // { name: 'ID', prop: 'id' },
    { name: 'Trans. ID', prop:'TransID' },
    { name: 'Created On', prop:'CreatedOn' },
    {name:'Service Name',prop:'ServiceName'},
    {name:'Account No.',prop:'AccountNo.'},
    {name:'Amount',prop:'Amount'},
    {name:'Charge Amt.',prop:'ChargeAmt'},
    {name:'Res. Code',prop:'Respons'},
    // { name: 'IsActive', prop:'isActive' },
    // { name: 'Actions', prop: 'id' }
  ];

Accountscolumns = [
  { name:'Manufacturer', prop:'manufacturer'},
  { name:'Device Name', prop:'deviceName'},
  { name:'Android Version', prop:'androidVersion'},
  { name:'Acc. Balance', prop:'AccBalance'},
  { name:'Status', prop:'Status'},

];

  channelsColumns = [
    { name: 'Channel', prop: 'channel'},
    { name: 'Created At', prop: 'createdOn'},
    { name: 'Status', prop:'active'},

  ];

  public mainProduct: any;
  public subcategoryTitle: any;

  @Input() formData: any;
  public form: FormGroup;

  public imageFile: File;

  ColumnMode = ColumnMode;

  modalRef: NgbModalRef;

  loading: boolean;
  customerId: any;
  customerDetails: any;
  channelsLoading: boolean = true;
  customerLoading: boolean = true;

  constructor(private httpService: HttpService,
              public globalService: GlobalService,
              public activatedRoute: ActivatedRoute,
              private modalService: NgbModal,
              public fb: FormBuilder,

  ) {
    activatedRoute.queryParams.subscribe(
      params => {

        this.mainProduct = params;
        console.log('queryParams', params);
      });
  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        this.customerId = params.id;
      }
    })
    
    this.trainingForm = this.fb.group({
      prompt: ['', [Validators.required]],
      url: [''],
      // codeSnippet: ['']
    });

    // this.loadCustomerData();
    // this.loadChannelData();

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '',
        [Validators.required]],
      description: [this.formData ? this.formData.description : '',
        [Validators.required]],
      longDescription: [this.formData ? this.formData.longDescription : '',
        [Validators.required]],
      feature: [this.formData ? this.formData.feature : ''],
      requirement: [this.formData ? this.formData.requirement : '']
    });

  }

 toggleUrlInput() {
  this.showUrlInput = true;
  this.showCodeInput = false;
}

cancelUrlInput() {
  this.showUrlInput = false;
  this.trainingForm.get('url')?.setValue(''); 
}

toggleCodeInput() {
  this.showCodeInput = true;
  this.showUrlInput = false; 
}

cancelCodeInput() {
  this.showCodeInput = false;
  this.trainingForm.get('codeSnippet')?.setValue(''); // Clear the input
}

get isFormValid(): boolean {
  return !!(
    this.uploadedFile || 
    this.trainingForm.value.url || 
    this.trainingForm.value.codeSnippet
  );
}

submitTraining(): void {

  const id = this.globalService.getChatbotId();
  this.chatbotId = id ? id.toString() : '';
  console.log('For chatbot ID:', this.chatbotId);
   

  if (!this.chatbotId) {
    Swal.fire('Error', 'No chatbot ID found, create Chatbot first', 'error');
    return;
  }

  if (!this.uploadedFile && !this.trainingForm.value.url) {
    Swal.fire('Error', 'Please provide either a file or URL', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('prompt', this.trainingForm.value.prompt);
  formData.append('url', this.trainingForm.value.url || '');
  formData.append('chatbot_id', this.chatbotId); 

  if (this.uploadedFile) {
    formData.append('file', this.uploadedFile);
  }

  console.log("Form Data Model =====>", formData)

  this.httpService
    .mobileBankingPostFormData('llm/personalise', formData)
    .subscribe({
      next: (res: any) => {
        if (res.status === "00") {
          Swal.fire('Success', res.message || 'Knowledge base updated.', 'success');
          this.resetInputs();
        } else {
          Swal.fire('Error', res.message || 'Failed to update knowledge base', 'error');
        }
      },
      error: (err: any) => {
        console.error('Error submitting training:', err);
        Swal.fire('Error', 'Failed to update knowledge base', 'error');
      }
    });
}

resetInputs(): void {
  this.uploadedFile = null;
  if (this.fileInput && this.fileInput.nativeElement) {
    this.fileInput.nativeElement.value = '';
  }

  this.showUrlInput = false;
  this.trainingForm.get('url')?.setValue('');

  this.showCodeInput = false;
  this.trainingForm.get('codeSnippet')?.setValue('');

  // Keep the prompt as it might be reusable
  // this.trainingForm.get('prompt')?.setValue(''); // Uncomment if you want to clear prompt too
}

onFileChange(event: any) {
  const files = event.target.files;
  if (files && files.length) {
    this.uploadedFile = files[0];
  }
}

removeFile() {
  this.uploadedFile = null;
  this.fileInput.nativeElement.value = '';
}

//   private loadChannelData(): any {
//     this.channelsLoading = true;
//     let model = ChannelDetailsWrapper.channelDetailsWrapper;

//     model.payload = {
//       customerId: this.customerId
//     }

//     this.httpService
//       .mobileBankingPostUpdated('api/v1/kyc/portal/get-user-channels', model)
//       .subscribe((res: any) => {
//         if (res.status === '00') {
//           setTimeout(() => {


//             let response = res['data'].map((item: any, index: any) => {
//               let res = {...item,
//                 createdOn: new Date(item.createdOn).toLocaleDateString()
//               };
//               return res;
//             })

//             this.channelRows = response;


//             let total = res.metadata.numofrecords;
//           }, 10);
//         } else {
//         }
//       });

//     this.channelsLoading = false;

//   }

//   private loadCustomerData(): any {
//     this.customerLoading = true;

//     // let model = ChannelDetailsWrapper.channelDetailsWrapper;

//     let payload = {
//       id: this.customerId
//     }

//     this.httpService
//       .mobileBankingPostNest('customers/getCustomerById', payload)
//       .subscribe((res: any) => {
//         if (res.status === 201) {
//           setTimeout(() => {
//             let response = res['data'];

//             this.customerDetails = response;
//           }, 10);
//         } else {
//         }
//       });

//     this.channelsLoading = false;

//   }

//   isAsideNavCollapsed: any;
//   openAddProductSubcategoryModal(content: TemplateRef<any>) {
//     this.modalService.open(content, {centered: true, size: "lg"}).result.then((result) => {
//       console.log("Modal closed" + result);
//     }).catch((res) => {});
//   }


//   private createRecord(): any {

//     const model = {
//       firstName: this.form.value.firstName,
//       lastName: this.form.value.lastName,
//       middleName: this.form.value.middleName,
//       phoneNumber: this.form.value.phoneNumber,
//       email: this.form.value.email,
//       position: this.form.value.position,
//       profileId: this.form.value.profile
//     };

//     this.httpService.mobileBankingPost('api/v1/corporate/admin/create', model).subscribe(
//       (result: any) => {
//         if (result.status === 200) {
//         } else {

//         }
//       }
//     );
//   }

//   private disableCustomer(id: string) {
//     const model = {
//       id
//     };

//     this.httpService
//       .mobileBankingPostNest('customers/disableCustomerById', model)
//       .subscribe((res: any) => {
//         if (res.status === 201) {
//           setTimeout(() => {
//             Swal.fire('Disable Successful',
//               'Customer has been disabled successfully!',
//               'success').then(r => {});
//           }, 10);
//         } else {
//           Swal.fire('Unable to disable customer',
//             'Customer could not be disabled!',
//             'error').then(r => {});
//         }
//       });
//   }
//   openResetPinModal(content: TemplateRef<any>){
//     this.modalService.open(content, {centered: true, size: "md"}).result.then((result) => {
//       console.log("Modal closed" + result);
//     }).catch((res) => {});
//   }
//   openDisableCustomerModal(){
//     this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
//     this.modalRef.componentInstance.title = 'Delete Customer';
//     this.modalRef.componentInstance.body = 'Do you want to permanently delete this customer?';
//     this.modalRef.result.then((result) => {
//       if (result === 'success') {
//         Swal.fire('Delete Successful',
//           'Customer has been deleted successfully!',
//           'success').then(r => {});
//       } else {
//         console.log("Error occurred")
//       }
//     });
//   }


//   openBlockCustomerModal(id: string) {
//     this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
//     this.modalRef.componentInstance.title = 'Disable Customer';
//     this.modalRef.componentInstance.body = 'Do you want to  disable this customer?';
//     this.modalRef.result.then((result) => {
//       if (result === 'success') {
//         this.disableCustomer(id);
//       }
//     });
//   }



//   resetCustomerPassword() {
//     this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
//     this.modalRef.componentInstance.title = 'Reset Customer Password';
//     this.modalRef.componentInstance.body = 'Do you want to reset customer password?';
//     this.modalRef.result.then((result) => {
//       if (result === 'success') {
//         Swal.fire('Reset Password',
//           'Customer password has been reset successfully!',
//           'success').then(r => {});
//       } else {
//         console.log("Error occurred")
//       }
//     });
//   }
}
