import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { HttpService } from 'src/app/shared/services/http.service';
import { AddAccountComponent } from '../add-account/add-account.component';
import {ApproveAccountComponent} from "../approve-account/approve-account.component";

@Component({
  selector: 'app-list-registered-accounts',
  templateUrl: './list-registered-accounts.component.html',
  styleUrls: ['./list-registered-accounts.component.scss']
})
export class ListRegisteredAccountsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  actions = ["View", "Edit"];
  pendingActions = ["View", "Edit", "Approve/ Reject"];

  columns = [
    {name: 'ID', prop: 'frontendId'},
    {name: 'Name', prop: 'name'},
    {name: 'Phone No.', prop: 'phoneNumber'},
    // {name: 'Status', prop: 'status'},
    {name:'Account No.',prop:'accountNumber'},
    {name:'Account Name',prop:'accountName'},
    {name: 'Account Status', prop: 'accountStatus'},
    {name: 'Created On', prop: 'createdOn'},
    {name:'Created By',prop:'createdBy'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Account";

  public currentRowStatus: any;
  pageSizes: number[] = [2, 5, 10, 20, 50, 100, 1000];
  pageSize = 20;
  page = 1;

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
      {label: 'Pages', path: '/'},
      {label: 'Products', active: true},
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

    const model = {
      page: 0,
      size: 50,
    };

    this.httpService
      .mobileBankingPostUpdated('api/v1/mbs/on-board/accounts/all', model)
      .subscribe((res: any) => {
        if (res.status === '00') {
          this.loading = false;
          setTimeout(() => {
            this.rows = res.data;

            let response = this.rows.map((item: any, index: any) => {

              let res = {...item,
                createdBy: item.createdBy ? item.createdBy : "_",
                createdOn: new Date(item.createdOn).toLocaleDateString('en-US'),
                accountNumber: item.accountNumber ? item.accountNumber : "_",
                accountStatus: item.status,
                frontendId: index + 1
              };
              return res;
            })
            this.rows = response;


            let total = res.totalItems;
          }, 10);
        } else {
        }
      });
    this.loading = false;

  }

  openEditProductModal(formData: any) {
    this.modalRef = this.modalService.open(AddAccountComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Account';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openApproveRejectModal(formData: any) {
    this.modalRef = this.modalService.open(ApproveAccountComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Approve/ Reject Account';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(AddAccountComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Account';
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

  navigateToViewProduct(data: any) {

    console.log('here is the data');
    console.log(data);

    this.router.navigateByUrl(`/mobile-banking/accounts/account/${data.requestId}`);
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
      if (item['name'].toLowerCase() !== 'actions') {
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[] = []

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
      if (item['name'].toLowerCase() !== 'actions') {
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[] = []

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
      if (item['name'].toLowerCase() !== 'actions') {
        return item['name'].toUpperCase()
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let rowKeys: string[] = Object.keys(this.rows[0]);
    let arr: string[][] = []
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

  triggerEvent(data: any) {

    let eventData = data

    if (eventData.action == 'View') {
      this.navigateToViewProduct(eventData.row);
    } else if (eventData.action == 'Edit') {
      this.openEditProductModal(eventData.row);
    } else if (eventData.action == 'Approve/ Reject') {
      this.openApproveRejectModal(eventData.row);
    }

  }


  outputStatus(event: any) {
    this.currentRowStatus = event;
  }

  changePageSize(event: Event) {
    console.log('event when changing page.');
    console.log(event);
    this.pageSize = parseInt((event.target as HTMLSelectElement).value);
  }
}
