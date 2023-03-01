import {Component, Input, OnInit, TemplateRef} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import { ColumnMode } from '@swimlane/ngx-datatable';
import {HttpService} from "../../../../../shared/services/http.service";
import {GlobalService} from "../../../../../shared/services/global.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-starter',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  providers: [DatePipe]
})

/**
 * Starter-component
 */
export class ProductsComponent implements OnInit {

  tempProductData = [
    {
      id: 1,
      productName: 'Bank Accounts',
      remarks: 'Bank Accounts Description',
      createdOn: '12-02-2023',

    },
    {
      id: 2,
      productName: 'Card Accounts',
      remarks: 'Card Accounts Description',
      createdOn: '12-02-2023',
    },
    {
      id: 3,
      productName: 'Loan Accounts',
      remarks: 'Loan Accounts Description',
      isActive: true,
      createdOn: '12-02-2023',
    },
    {
      id: 4,
      productName: 'Investment Accounts',
      remarks: 'Investment Accounts Description',
      isActive: true,
      createdOn: '12-02-2023',
    },
    {
      id: 5,
      productName: 'Insurance Accounts',
      remarks: 'Insurance Accounts Description',
      isActive: true,
      createdOn: '12-02-2023',
    },
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'ProductName', prop:'productName' },
    { name: 'Remarks', prop:'remarks' },
    { name: 'IsActive', prop:'isActive' },
    { name: 'Actions', prop: 'id' }
  ];

  public form: FormGroup;
  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;


  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              public fb: FormBuilder,
              public datePipe: DatePipe,

              public router: Router,
              public globalService: GlobalService) {


  }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Mobile banking', path: '/mobile-banking/products/all-products' },
      { label: 'Pages', path: '/' }, { label: 'Products', active: true }];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [this.formData ? this.formData.description : '', [Validators.required]],
      is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
    });
  }

  // public openModal(parentData: any) {
  //   this.modalRef = this.modalService.open(AddProductComponent);
  //   this.modalRef.componentInstance.title = 'Add Product';
  //   this.modalRef.componentInstance.parentData = '';
  //   this.modalRef.result.then((result) => {
  //     if (result === 'success') {
  //       this.getIndividualData(this.page);
  //     }
  //   }, (reason) => {
  //   });
  // }

  // public editProduct(formData: any) {
  //   this.modalRef = this.modalService.open(AddProductComponent);
  //   this.modalRef.componentInstance.formData = formData;
  //   this.modalRef.componentInstance.title = 'Edit Product: ';
  //   this.modalRef.result.then((result) => {
  //     if (result === 'success') {
  //       this.getIndividualData(this.page);
  //     }
  //   }, (reason) => {
  //   });
  // }

  onCustomAction(event: { action: any; data: any; }) {
    switch (event.action) {
      case 'viewrecord':
        // this.viewProduct(event.data);
        break;
      case 'editrecord':
        // this.editProduct(event.data);
    }
  }

  private viewProduct(data: any): void {
    console.log('here is the product data');
    console.log(data);
    this.router.navigate(['products', 'product', data.id], {queryParams: data});
  }

  getIndividualData(event: number): void {

    this.rows = this.tempProductData;

    const model = {
      page: 0,
      size: 5
    };

    this.httpService.mobileBankingPost('api/v1/corporate/admin/list-products/all', model).subscribe((res: any) => {

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

  openAddProductModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }

  openEditProductModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  navigateToViewProduct(data: any) {
    this.router.navigateByUrl(`/mobile-banking/products/product/${data.id}`);
  }
}
