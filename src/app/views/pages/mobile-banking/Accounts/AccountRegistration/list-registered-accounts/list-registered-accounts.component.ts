import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { HttpService } from 'src/app/shared/services/http.service';
import { AddAccountComponent } from '../add-account/add-account.component';

@Component({
  selector: 'app-list-registered-accounts',
  templateUrl: './list-registered-accounts.component.html',
  styleUrls: ['./list-registered-accounts.component.scss']
})
export class ListRegisteredAccountsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;

  tempProductData = [
    {
      id: 1,
      Name: 'Andrew Kamau',
      RegistrationNumber: '45321876',
      AccountNumber:'01167972316587',
      // status: true,
      CustomerID:'87142367',
      Email:'michaelmbugua123@gmail.com',
      createdOn: '12-02-2023',
      CreatedBy:'Mary Njoki'
    },
    {
      id: 2,
      Name: 'Jane Mwangi',
      RegistrationNumber: '21658975',
      AccountNumber:'01176431096534',
      // status: true,
      Email:'liliankamau001@gmail.com',
      CustomerID:'23569980',
      createdOn: '12-02-2023',
      CreatedBy:'Wendy Akinyi'
    },

  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  actions = ["View", "Edit"];

  columns = [
    {name: 'ID', prop: 'id'},
    {name: 'Name', prop: 'Name'},
    {name: 'Registration No.', prop: 'RegistrationNumber'},
    // {name: 'Status', prop: 'status'},
    {name:'Account Number',prop:'AccountNumber'},
    {name:'Email',prop:'Email'},
    {name: 'Created On', prop: 'createdOn'},
    {name:'Created By',prop:'CreatedBy'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Account";


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
          this.loading = false;
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

  openEditProductModal(formData: any) {
    this.modalRef = this.modalService.open(AddAccountComponent, {centered: true});
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
    }else if (eventData.action == 'Edit') {
      this.openEditProductModal(eventData.row);
    }

  }



}
