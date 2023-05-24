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
import {AddChannelComponent} from "../add-channel/add-channel.component";

@Component({
  selector: 'app-list-channels',
  templateUrl: './list-channels.component.html',
  styleUrls: ['./list-channels.component.scss'],
  providers: [DatePipe],
})

/**
 * Starter-component
 */
export class ListChannelsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
 actions = ["Edit", "Delete"];
  tempProductData = [
    {"frontendId": "1", "channel": "new_channel",        "code":	"t799",       "consumer_key":	"5af501456f79", "consumer_secret":	"a72ce719-6d91-49f0-80c8-83e1cd1496a1"},
    {"frontendId": "2", "channel": "test_channel",       "code":	"ts005",      "consumer_key":	"8e05faeba34b", "consumer_secret":	"953471a7-5461-46c9-93fb-125a2c7548da"},
    {"frontendId": "3", "channel": "Agency Banking",     "code": "CAGB001",    "consumer_key":	"21e10a1ef385", "consumer_secret":	"d983129b-76a6-43f5-86e4-fef95c5c311f"},
    {"frontendId": "4", "channel": "ATM",                "code":	"CATM001",    "consumer_key":	"21b4a9ad00e5", "consumer_secret":	"81795ec7-0acf-42a6-9c3a-939761d19ed1"},
    {"frontendId": "5", "channel": "Internet Banking",   "code": "Banking",    "consumer_key":	"CIB0001",      "consumer_secret":	"fc3a69ebba67	398bf2a1-a613-4a9e-a097-f3421ac9d50e"},
    {"frontendId": "6", "channel": "USSD",               "code":	"ussd00020",  "consumer_key":	"164687364db7", "consumer_secret":	"f75aafeb-e0b0-4abe-849b-59d77b263c22"},
    {"frontendId": "7", "channel": "MOBILE_APP",         "code":	"093ZEKT",    "consumer_key":	"86b58c6540d0", "consumer_secret":	"0f1483d3-183d-429c-a42b-96f0d7579f53"}
  ]

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  columns = [
    {name: 'ID', prop: 'frontendId'},
    { name: 'Channel', prop: 'channel' },
    { name: 'Consumer Key',prop:'client_id'},
    { name: 'Consumer Secret',prop:'channel_key'},
    { name: 'Active',prop:'active'},
    { name: 'Actions', prop: 'id' },
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Channel";
  channelEnabled = true;
  channels: any;
  channel: any;
  total: any;


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

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
    });
  }

  getIndividualData(event: number): void {

    this.loading = true;

    let model = ChannelDetailsWrapper.channelDetailsWrapper;

    model.payload = {
      "page": 0,
      "size": 100
    }

    this.httpService
      .mobileBankingPostUpdated('api/v1/kyc/portal/get-channels', model)
      .subscribe((res: any) => {
        if (res.status === '00') {
          setTimeout(() => {

            let response = res['data'].map((item: any, index: any) => {
              let res = {...item,
                frontendId: index + 1
              };
              return res;
            })
            this.rows = response;

            this.total = res.metadata.numofrecords;
          }, 10);
        } else {
        }
      });

    this.loading = false;

  }

  openAddModal() {

    this.modalRef = this.modalService.open(AddChannelComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Channel';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openEditModal(formData: any) {
    this.modalRef = this.modalService.open(AddChannelComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Channel';
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
      this.openEditModal(eventData.row);
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
