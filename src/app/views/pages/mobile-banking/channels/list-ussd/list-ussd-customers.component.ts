import {
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ColumnMode } from '@swimlane/ngx-datatable';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { HttpService } from 'src/app/shared/services/http.service';
import {AddCustomerComponent} from "../add-customer/add-customer.component";
import {AddMobileAppCustomerComponent} from "../add-mobile-app-customer/add-mobile-app-customer.component";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {ChannelDetailsWrapper} from "../../../../../shared/services/channelDetailsWrapper";

@Component({
  selector: 'app-list-requests',
  templateUrl: './list-ussd-customers.component.html',
  styleUrls: ['./list-ussd-customers.component.scss'],
  providers: [DatePipe],
})

/**
 * Starter-component
 */
export class ListUssdCustomersComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
 actions = ["View"];
  tempProductData = [
    {
      frontendId: 1,
      customerName: 'Andrew Kamau',
      phoneNumber:'0708453901',
      idNumber: '31397137',
      primaryIMSINumber:'234035678765',
      email:'michaelmbugua004@gmail.com',
      createdOn: '12-02-2023',
    },
    {
      frontendId: 2,
      customerName: 'Jane Mwangi',
      phoneNumber:'0728357775',
      idNumber: '37059671',
      primaryIMSINumber:'262062345678',
      IMSINumber:'265011234567',
      email:'lilian002@gmail.com',
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
    // { name: 'IMSINumber', prop: 'IMSINumber' },
    // {name: 'CBSCustomerNumber',prop:'cbsCustomerNumber'},
    {name: 'Primary IMSI No.',prop:'primaryIMSINumber'},
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

  title: string = "USSD Customer";
  channelEnabled = true;
  channels: any;
  channel: any;


  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService
  ) {}

  ngOnInit() {
    this.breadCrumbItems = [
      {
        label: 'Mobile banking',
        path: '/mobile-banking/products/all-customers',
      },
      { label: 'Pages', path: '/' },
      { label: 'Customers', active: true },
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

    this.loading = false;
    this.rows = this.tempProductData;

    this.temp = [...this.tempProductData];

  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(AddMobileAppCustomerComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add USSD Customer';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openEditProductModal(formData: any) {
    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Product';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  navigateToViewUssdCustomer(data: any) {
    this.router.navigateByUrl(`/mobile-banking/channels/ussdcustomer/${data.id}`);
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

  exportCSV() {
    let cols: string[] = this.columns.map(item => {
      if(item['name'].toLowerCase() !== 'actions'){
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[]= []

    this.rows.forEach((row: any) => {
      let temp: Record<string, string> = {}
      cols.forEach(key => {
        temp = {...temp, [key]: row[key]}
      })
      arr.push(temp)
    })
    this.dataExploration.exportToCsv(arr, 'Products')
  }

  exportXLSX() {
    let cols: string[] = this.columns.map(item => {
      if(item['name'].toLowerCase() !== 'actions'){
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[]= []

    this.rows.forEach((row: any) => {
      let temp: Record<string, string> = {}
      cols.forEach(key => {
        temp = {...temp, [key]: row[key]}
      })
      arr.push(temp)
    })

    this.dataExploration.exportDataXlsx(arr, 'Products')
  }

  exportPDF() {
    console.log(this.rows);
    let cols: string[] = this.columns.map(item => {
      if(item['name'].toLowerCase() !== 'actions'){
        return item['name'].toUpperCase()
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let rowKeys: string[] = Object.keys(this.rows[0]);
    let arr: string[][]= []
    this.rows.forEach((row: any) => {
      let temp: string[] = []
      rowKeys.forEach(key => {
        temp.push(row[key])
      })
      arr.push(temp)
    })
    this.dataExploration.exportToPdf(cols, arr, 'Products')
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }
  triggerEvent(data:string){
    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this.navigateToViewUssdCustomer(eventData.row);
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

        this.channelEnabled = !this.channelEnabled;

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

          this.channel = this.channels.filter((item: any) => item.channel === 'USSD');

          console.log("found channel: this.channel");
          console.log(this.channel);
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
