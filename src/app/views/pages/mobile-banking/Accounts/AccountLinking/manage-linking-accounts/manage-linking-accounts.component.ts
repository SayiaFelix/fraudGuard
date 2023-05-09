import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-manage-linking-accounts',
  templateUrl: './manage-linking-accounts.component.html',
  styleUrls: ['./manage-linking-accounts.component.scss']
})
export class ManageLinkingAccountsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  tempProductData = [
    {
      id: 1,
      PhoneNumber: '0728357776',
      LinkedAccount: '22564313879065',
      NationalID: '37059671',
      Channel:'MobileApp',
      T24AccountName:'Test',
      Currency:'USD',
      DailyTxnLimit:'150000',
      LinkedBy:'Damaris',
      AuthorisedOn: '12-02-2023',
    },
    {
      id: 2,
      PhoneNumber: '0721875689',
      LinkedAccount: '23366003321675',
      NationalID: '31365897',
      Channel:'USSD',
      T24AccountName:'Test',
      Currency:'EUR',
      DailyTxnLimit:'150000',
      LinkedBy:'Mary',
      AuthorisedOn: '12-02-2023',
    },

  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loadingIndicator = true;
  reorderable = true;

  actions = ["View", "Block","Close"];

  columns = [
    {name: 'ID', prop: 'id'},
    {name: 'Phone Number', prop: 'PhoneNumber'},
    {name: 'Linked Account', prop: 'LinkedAccount'},
    {name:'National ID', prop:'NationalID'},
    {name:'Channel',prop:'Channel'},
    {name:'T24 Account Name',prop:'T24AccountName'},
    {name:'Currency',prop:'Currency'},
    {name:'Daily Txn Limit',prop:'DailyTxnLimit'},
    // {name: 'Status', prop: 'status'},
    {name:'Linked By',prop:'LinkedBy'},
    {name: 'Authorised On', prop: 'AuthorisedOn'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Products";


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
  }

  openBlockModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Block Account';
    this.modalRef.componentInstance.body = "Do you want to block this Account?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Blocked successfully',  'Account has been blocked successfully.',  'success')
        .then
        (r => this.getIndividualData(0))
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openCloseModal(formData: any) {

    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Close Account';
    this.modalRef.componentInstance.body = 'Do you want to close this account?'
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Account closed successfully','Account has been closed successfully','success')
        .then(r =>  this.getIndividualData(0));

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
    this.router.navigateByUrl(`/mobile-banking/products/product/${data.id}`);
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

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this.navigateToViewProduct(eventData.row);
    }
    else if (eventData.action == 'Block') {
      this.openBlockModal(eventData.row);
    }
    else if (eventData.action == 'Close') {
      this.openCloseModal(eventData.row);
    }

    }

  }
