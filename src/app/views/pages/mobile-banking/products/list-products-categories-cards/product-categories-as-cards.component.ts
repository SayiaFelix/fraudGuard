import { Component, Input, OnInit, ViewChild, } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { CustomValidators } from 'ngx-custom-validators';

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
      'request_type': "ACCREDITATION",
      'ref_number': 'REQ0000',
      'createdOn': "2023-02-12",
      'status': "Pending",
    }
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  errorMessage: string;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;
  perPage = 100;
  page = 1
  pageSizes = [5, 10, 25, 50, 100, 200];
  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'REQ NO:', prop: 'ref_number' },
    { name: 'Request Type', prop: 'request_type' },
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
  accreditations: any;
  requests: any[] = [];

  dashboards: { id: string; src: string }[] = [
    {
      id: 'dashboard1',
      src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet7',
    },
    {
      id: 'dashboard2',
      src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet8',
    },
    {
      id: 'dashboard3',
      src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet9',
    },
  ];
  
  paginatedDashboards: { id: string; src: string }[] = [];
  currentPage = 0;
  itemsPerPage = 4;

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    private datePipe: DatePipe,
    private sanitizer: DomSanitizer,
    public router: Router,
    private dataExploration: DataExportationService
  ) {
    this.form = fb.group({
      name: ["", Validators.compose([Validators.required])],
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['', Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      phone_number: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
    });
  }

  ngOnInit() {
    this.updatePagination()
    this.breadCrumbItems = [
      {
        label: 'Mobile banking',
        path: '/mobile-banking/products/all-customers',
      },
      { label: 'Pages', path: '/' },
      { label: 'Customers', active: true },
    ];
    this.getIndividualData(0);
  }

  updatePagination() {
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDashboards = this.dashboards.slice(startIndex, endIndex);
  }
  
  nextPage() {
    if ((this.currentPage + 1) * this.itemsPerPage < this.dashboards.length) {
      this.currentPage++;
      this.updatePagination();
    }
  }
  
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
    }}
  phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneNumber = control.value;
    const phonePattern = /^(254\d{9}|0\d{9})$/;
    return phonePattern.test(phoneNumber) ? null : { invalidPhoneNumber: true };
  }
  
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }
  showLeaveCommentForm: boolean = false;
  toggleLeaveCommentForm() {
    if (this.showLeaveCommentForm) {
      this.hideLeaveCommentForm();
    } else {
      this.showLeaveCommentForm = true;
    }
  }
  hideLeaveCommentForm() {
    this.showLeaveCommentForm = false;
    this.form.reset()
  }


  viewRequest(id: number) {
    this.router.navigate(['tra-client/requests', id]);
  }
  formatDate(date: string): string {
    const formattedDate = this.datePipe.transform(date, 'dd MMM yyyy');
    return formattedDate ? formattedDate.toUpperCase() : '';
  }

  getSanitizedStatusImage(status: string): any {
    switch (status) {
      case 'APPROVED':
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/approve.png');
      case 'PENDING':
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/time.png');
      default:
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/fail.png');
    }
  }

  getIndividualData(event: any): void {
    this.loading = true;
    let userId = JSON.parse(localStorage.getItem('data')!)['user']['id'];
   let licenceNumber = JSON.parse(localStorage.getItem('data')!)['licenceNumber']
    let model = {
      licenceNumber,
      page: this.page - 1,
      size: this.perPage
    };
    this.httpService
      .customerPortalPosts('admin/customer/portal/get-request-by-licence-number', model)
      .subscribe((res: any) => {
        if (res.status === 200) {
          this.requests = res.data
          this.loading = false;
          // console.log(res.data);


          // Sort the requests array by 'createdOn' date in descending order (latest request first)
          this.requests.sort((a: any, b: any) => {
            const dateA = new Date(a.createdOn).getTime();
            const dateB = new Date(b.createdOn).getTime();
            return dateB - dateA;
          });

          //  const accreditations = res.data.filter((request:any) => request.request_category === "ACCREDITATION");
          // console.log(accreditations)
          // this.requests = accreditations
        } else {
          this.loading = false;
        }
      });
    this.loading = false;
  }

  onleaveComment() {
    this.isLoading = true;
    const model = {
      name: this.form.value.name,
      phone_number: this.form.value.phone_number,
      subject: this.form.value.subject,
      message: this.form.value.message,
      email: this.form.value.email,
    };
    // console.log(model)
    this.httpService.customerPortalPost(`api/v1/auth/customerEnquirer`, model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.hideLeaveCommentForm();
          // this.loadData()
          Swal.fire('Customer Enquire Successfully',
            'success').then(r => console.log(r))
        } else {
          this.hideLeaveCommentForm();
          Swal.fire('Customer Enquire  Failed, Try Again',
            'error').then(r => console.log(r))
            this.isLoading = false;
        }
      },
      (error: any) => {
        this.hideLeaveCommentForm();
        Swal.fire('Customer Enquire error',
          'error')
          this.isLoading = false;
      }
    );
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
    this.router.navigateByUrl(`tra-client/requests/view/${data.id}`);
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
