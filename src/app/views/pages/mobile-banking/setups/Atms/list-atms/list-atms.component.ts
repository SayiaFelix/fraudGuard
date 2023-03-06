import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';

@Component({
  selector: 'app-list-atms',
  templateUrl: './list-atms.component.html',
  styleUrls: ['./list-atms.component.scss']
})
export class ListAtmsComponent implements OnInit {
  
  @ViewChild('table') table: DatatableComponent;
  tempProductData = [
    {
      id: 1,
      ATMName: 'KCB ATM KU Building',
      ATMCode: '01079',
      createdOn: '12-02-2023',

    },
    {
      id: 2,
     ATMName: 'KCB ATM Oil Libya',
      ATMCode: '19006',
      createdOn: '12-02-2023',
    },
    {
      id: 3,
      ATMName: 'KCB ATM KICC',
      ATMCode: '45170',
      isActive: true,
      createdOn: '12-02-2023',
    },
    {
      id: 4,
      ATMName: 'KCB ATM HighWay Plaza',
      ATMCode: '29698',
      isActive: true,
      createdOn: '12-02-2023',
    },
    {
      id: 5,
      ATMName: 'KCB ATM Kipande House',
      ATMCode: '34856',
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
    { name: 'ATMName', prop:'ATMName' },
    { name: 'ATMCode', prop:'ATMCode' },
    { name: 'IsActive', prop:'isActive' },
    { name: 'Actions', prop: 'id' }
  ];

  public form: FormGroup;
  @Input() formData: { name: any; atmCode: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;


  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              public fb: FormBuilder,
              

              public router: Router,
              public globalService: GlobalService) {


  }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Mobile banking', path: '/mobile-banking/Atms/all-atms' },
      { label: 'Pages', path: '/' }, { label: 'Atms', active: true }];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      atmCode: [this.formData ? this.formData.atmCode : '', [Validators.required]],
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
  toggleExpandRow(row: any) {
    console.log(row);
    console.log(this.table);

    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

}
