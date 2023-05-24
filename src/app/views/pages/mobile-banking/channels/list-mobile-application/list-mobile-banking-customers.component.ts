import {Component, OnInit, ViewChild,} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import {AddCustomerComponent} from "../add-customer/add-customer.component";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import {SwalComponent} from "@sweetalert2/ngx-sweetalert2";
import Swal from "sweetalert2";
import {AddMobileAppCustomerComponent} from "../add-mobile-app-customer/add-mobile-app-customer.component";
import {ChannelDetailsWrapper} from "../../../../../shared/services/channelDetailsWrapper";

@Component({
  selector: 'app-list-internet-banking',
  templateUrl: './list-mobile-banking-customers.component.html',
  styleUrls: ['./list-mobile-banking-customers.component.scss'],
  providers: [DatePipe],
})

/**
 * Starter-component
 */
export class ListMobileBankingCustomersComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  tempProductData = [
    {
      frontendId: 1,
      customerName: 'Perpetua Kabute',
      phoneNumber:'0708453901',
      idNumber: '31397137',
      DeviceID:'IBank4567',
      primaryDevice:'Redmi Note 11 pro',
      email:'michaelmbugua004@gmail.com',
      createdOn: '12-02-2023',
    },
    {
      frontendId: 2,
      customerName: 'Lilian Kamau',
      phoneNumber:'0728675498',
      idNumber: '32859637',
      DeviceID:'IBank1234',
      primaryDevice:'Redmi 10 C',
      createdOn: '12-02-2023',
    },
    {
      frontendId: 3,
      customerName: 'Faisal Farah',
      phoneNumber:'0728378986',
      idNumber: '36059678',
      DeviceID:'IBank1234',
      primaryDevice:'Samsung Galaxy A02',
      createdOn: '12-02-2023',
    },
    {
      frontendId: 4,
      customerName: 'Chiuri Karanja',
      phoneNumber:'0713278096',
      idNumber: '31059673',
      DeviceID:'IBank1234',
      primaryDevice:'Oppo Reno 3',
      createdOn: '12-02-2023',
    },
    {
      frontendId: 5,
      customerName: 'Daniel Kimani',
      phoneNumber:'0712786543',
      idNumber: '30059677',
      DeviceID:'IBank1234',
      primaryDevice:'Oppo A16K',
      email:'lilian002@gmail.com',
      createdOn: '12-02-2023',
    },
    {
      frontendId: 6,
      customerName: 'Michael Mbugua',
      phoneNumber:'0725654318',
      idNumber: '31359673',
      DeviceID:'IBank1234',
      primaryDevice:'Redmi Note 10 pro',
      createdOn: '12-02-2023',
    },
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'Customer Name', prop: 'customerName' },
    {name:'Primary Phone No.',prop:'phoneNumber'},
    { name: 'ID Number', prop: 'idNumber' },
    { name: 'Device ID', prop: 'DeviceID' },
    { name: 'Primary Device', prop: 'primaryDevice' },
    // {name: 'CBSCustomerNumber',prop:'cbsCustomerNumber'},
    // {name: 'AccountNumber',prop:'accountNumber'},
    // {name: 'Email',prop:'email'},
    { name: 'Created On', prop: 'createdOn' },
    // {name: 'DOB',prop:'dob'},
    // {name: 'Gender',prop:'gender'},
    { name: 'Actions', prop: 'id' },
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Mobile App Customer";

  @ViewChild('mySwal')
  public readonly mySwal!: SwalComponent;
  actions = ["View"];
  channelEnabled: any;
  channels: any;
  channel: any;


  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService
  ) {
  }

  ngOnInit() {
    this.breadCrumbItems = [
      {
        label: 'Mobile banking',
        path: '/mobile-banking/products/all-products',
      },
      { label: 'Pages', path: '/' },
      { label: 'Products', active: true },
    ];
    this.getIndividualData(0);
    this.getChannelsToKnowStatus();

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
    });
  }

  getIndividualData(event: number): void {
    this.loading = true;
    this.rows = this.tempProductData;

    this.temp = [...this.tempProductData];

    const model = {
      page: 0,
      size: 50,
    };

    this.httpService
      .mobileBankingPost('api/v1/corporate/admin/list-products/all', model)
      .subscribe((res: any) => {
        if (res.status === 200) {
          setTimeout(() => {
            // this.data = res.data;
            this.rows = this.tempProductData;
            // let data = this.tempProductData;

            let total = res.totalItems;
          }, 10);
        } else {
        }
      });
    this.loading = false;

  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(AddMobileAppCustomerComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Customer to Channel';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openResetModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Reset Customer';
    this.modalRef.componentInstance.body = 'Do you want to reset this customer?';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Reset Successful',
          'Customer has been reset successfully!',
          'success').then(r => this.getIndividualData(0))
      } else {
        console.log("Error occurred")
      }
    });
  }


  toggleExpandRow(row: any) {
    console.log(row);
    console.log(this.table);

    this.table.rowDetail.toggleExpandRow(row);
  }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

  updateFilter(event: any, columnName: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const temp = this.temp.filter(function (d: any) {
      return d.productName.toLowerCase().indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  toggle(col: any) {
    const isChecked = this.isChecked(col);

    if (isChecked) {
      this.columns = this.columns.filter((c) => {
        return c.name !== col.name;
      });
    } else {
      this.columns = [...this.columns, col];
    }
  }

  isChecked(col: any) {
    return (
      this.columns.find((c) => {
        return c.name === col.name;
      }) !== undefined
    );
  }

  toggleDrop() {
    let checkList: HTMLElement = document.getElementById('list1')!;

    if (checkList.classList.contains('visible'))
      checkList.classList.remove('visible');
    else checkList.classList.add('visible');
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  navigateToView(data: any) {
    this.router.navigateByUrl(`/mobile-banking/channels/mobile-app/${data.id}`);
  }
  openEditProductModal(data:any){

  }
  triggerEvent(data:any){
    let eventData = JSON.parse(data)
    if (eventData.action == 'View') {
      this.navigateToView(eventData.row);
    }else if (eventData.action == 'Edit') {
      this.openEditProductModal(eventData.row);
    }
  }

  openDisableModal(channelName: string, status: boolean) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    if (status){
      this.modalRef.componentInstance.title = `Enable this channel?`;
      this.modalRef.componentInstance.body = `Do you want to enable: ${channelName}?`;
    } else {
      this.modalRef.componentInstance.title = `Disable this channel?`;
      this.modalRef.componentInstance.body = `Do you want to disable: ${channelName}?`;
    }
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {

        this.loading = true;

        let model = ChannelDetailsWrapper.channelDetailsWrapper;

        model.payload = {
          action: status,
          channelId: this.channel[0].id
        }

        this.httpService.mobileBankingPostUpdated('api/v1/kyc/portal/activate-deactivate',
          model).subscribe(
          (result: any) => {
            if (result.status === '00') {
              Swal.fire(`Channel ${status ? 'Activated': 'Deactivated'} Successfully`,
                `Channel has been ${status ? 'Activated': 'Deactivated'} Successfully.`,
                'success').then(r => console.log(r))
              this.getIndividualData(0);
            } else {
              Swal.fire('Error',
                'Product could not be activated/ deactivated.',
                'error').then(r => console.log(r))
            }
          },
          (error: any) => {
            Swal.fire('Record deletion error',
              `Record creation error`,
              'error')
          }
        );
      }
    });
  }
  private getChannelsToKnowStatus() {
    let model = ChannelDetailsWrapper.channelDetailsWrapper;

    model.payload = {
      page: 0,
      size: 10
    }

    this.httpService.mobileBankingPostUpdated('api/v1/kyc/portal/get-channels',
      model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          console.log("result.data");
          console.log(result.data);

          this.channels = result.data;

          this.channel = this.channels.filter((item: any) => item.channel === 'APP');
          this.channelEnabled = this.channel[0].active;

        } else {
          Swal.fire('Error',
            'Product could not be activated/ deactivated.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record deletion error',
          `Record creation error`,
          'error')
      }
    );
  }
}
