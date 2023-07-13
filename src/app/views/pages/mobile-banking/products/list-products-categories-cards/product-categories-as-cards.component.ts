import { Component, Input, OnInit, ViewChild, } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { HttpService } from 'src/app/shared/services/http.service';
import { AddProductComponent } from "../add-product/add-product.component";
import { OwlOptions } from "ngx-owl-carousel-o";
import { ConfirmDialogComponent } from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import { DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs";
import { log10 } from "chart.js/helpers";

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories-as-cards.component.html',
  styleUrls: ['./product-categories-as-cards.component.scss'],
  providers: [DatePipe],
})


/**
 * Starter-component
 */
export class ProductCategoriesAsCardsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  actions = ['View'];
  tempProductData = [
    {
      'Id': "1",
      'request_category': "STO_START",
      'refNumber': 'REF0000',
      'createdOn': "2023-02-12",
      'status': "Pending",
    }
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;
  perPage = 10;
  page = 1
  pageSizes = [5, 10, 25, 50, 100,200];
  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'Request Type', prop: 'requestType' },
    { name: 'REQ NO:', prop: 'ref_number' },
    { name: 'Status', prop: 'status' },
    { name: 'Created On', prop: 'createdOn' },
    { name: 'Actions', prop: 'actions' },
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Make Request";
  ClassData: any;
  SubClassData: any;


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


  getIndividualData(event: any): void {
    this.loading = true;
    this.rows = this.tempProductData;
    this.temp = [...this.tempProductData];
    const model = {
      page: 0,
      size: 10,
    };
    this.httpService
      .customerPortalPostData('api/v1/portal/getRequests',model)
      .subscribe((res: any) => {
        if (res.status === '00') {
          this.loading = false;
          const accreditations = res.data.filter((request:any) => request.request_category === "ACCREDITATION");
          console.log(accreditations)
          
          setTimeout(() => {
            let response = res.data;
            this.rows = response.map((item: any, index: any) => {
              const myDate = item['createdOn'].replace(' ', 'T');
              const dateObj = new Date(myDate).toString().split('GMT')[0];
              const res = {
                ...item,
                frontendId: index + 1,
                createdOn: dateObj,
              };
              return res 
            });
            // let data = this.tempProductData;
            console.log(this.rows)
            // let total = res.totalItems;
          }, 10);
        } else {
          this.loading = false;
        }
      });
    this.loading = false;
  }

  openAddRequestModal() {
    this.modalRef = this.modalService.open(AddProductComponent, { centered: true, size: "md" });
    this.modalRef.componentInstance.title = 'Make Request';
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
    this.router.navigateByUrl(`tra-client/accreditations/view/${data.id}`);
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
        temp = { ...temp, [key]: row[key] }
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
        temp = { ...temp, [key]: row[key] }
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
      this.navigateToViewUssdCustomer(eventData.row);
    } else if (eventData.action == 'Edit') {

    }
  }

}
