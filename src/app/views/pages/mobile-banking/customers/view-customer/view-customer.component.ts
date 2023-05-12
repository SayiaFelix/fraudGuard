import {Component, Input, OnInit, TemplateRef} from '@angular/core';
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

  breadCrumbItems: Array<{}>;
  rows: any = [];
  channelRows: any = [];
  loadingIndicator = true;
  reorderable = true;


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
    { name:'Channel', prop:'channel'},
    { name:'Created On', prop:'createdOn'},
    { name:'Status', prop:'status'},

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
  channelsLoading: boolean = true;

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

    // this.loadData();

    this.loadChannelData();

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

  // private loadData(): any {
  //
  //   const model = {
  //     page: 0,
  //     size: 100
  //   };
  //
  //   this.httpService.mobileBankingPost('api/v1/corporate/admin/list-products/all', model).subscribe(
  //     (result: any) => {
  //     }
  //   );
  // }

  private loadChannelData(): any {
    this.channelsLoading = true;
    let model = ChannelDetailsWrapper.channelDetailsWrapper;

    model.payload = {
      customerId: this.customerId
    }

    this.httpService
      .mobileBankingPostUpdated('api/v1/kyc/portal/get-user-channels', model)
      .subscribe((res: any) => {
        if (res.status === '00') {
          setTimeout(() => {
            this.channelRows = res.data;

            let total = res.metadata.numofrecords;
          }, 10);
        } else {
        }
      });

    this.channelsLoading = false;

  }

  isAsideNavCollapsed: any;
  openAddProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true, size: "lg"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }


  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }



  private createRecord(): any {

    const model = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      middleName: this.form.value.middleName,
      phoneNumber: this.form.value.phoneNumber,
      email: this.form.value.email,
      position: this.form.value.position,
      profileId: this.form.value.profile
    };

    this.httpService.mobileBankingPost('api/v1/corporate/admin/create', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
        } else {

        }
      }
    );
  }

  private loadProducts() {
    const model = {
      page: 0,
      size: 100
    };

    this.httpService.mobileBankingPost('api/v1/corporate/admin/profiles/all', model).subscribe(
      (result: any) => {

        // console.log(result.status);

        if (result.status === 200) {


        } else {
        }
      }
    );
  }
  openResetPinModal(content: TemplateRef<any>){
    this.modalService.open(content, {centered: true, size: "md"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }
  openDisableCustomerModal(){
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Delete Customer';
    this.modalRef.componentInstance.body = 'Do you want to permanently delete this customer?';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Delete Successful',
          'Customer has been deleted successfully!',
          'success').then(r => {});
      } else {
        console.log("Error occurred")
      }
    });
  }


  openBlockCustomerModal() {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Block Customer';
    this.modalRef.componentInstance.body = 'Do you want to  block this customer?';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Blocking Successful',
          'Customer has been blocked successfully!',
          'success').then(r => {});
      } else {
        console.log("Error occurred")
      }
    });
  }
}
