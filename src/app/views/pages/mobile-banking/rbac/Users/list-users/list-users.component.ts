import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { active } from 'sortablejs';
import { HttpService } from 'src/app/shared/services/http.service';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.scss']
})
export class ListUsersComponent implements OnInit {
onDetailToggle($event: any) {
throw new Error('Method not implemented.');
}

  @ViewChild('table') table: DatatableComponent;

  tempProductData = [
    {
      id: 1,
      FullNames: 'Test Test',
      Email:'test123@gmail.com',
      TelephoneNo: '0743097643',
      status: false,
      createdOn: '12-02-2023',

    },
    {
      id: 2,
      FullNames: 'Lilian Kamau',
      Email:'liliankamau001@gmail.com',
      TelephoneNo: '0798075432',
      status: true,
      createdOn: '12-02-2023',
    },
    {
      id: 3,
      FullNames: 'Winnie Mwikali',
      Email:'winniemwikali07@gmail.com',
      TelephoneNo: '0742138965',
      status: true,
      createdOn: '12-02-2023',
    },
    {
      id: 4,
      FullNames: 'Michael Mbugua',
      Email:'michaelmbugua@gmail.com',
      TelephoneNo: '0743286541',
      status: true,
      createdOn: '12-02-2023',
    },
    {
      id: 5,
      FullNames: 'Kari Kamau',
      Email:'karikamau001@gmail.com',
      TelephoneNo: '0734658976',
      status: false,
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
    { name: 'FullNames', prop:'FullNames' },
    { name:'Email',prop:'Email'},
    { name: 'TelephoneNo', prop:'TelephoneNo' },
    { name: 'Status', prop:'status'},
    { name: 'CreatedOn', prop:'createdOn' },
    { name: 'Actions', prop: 'id' }
  ];

  public form: FormGroup;
  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;


  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              public fb: FormBuilder,

              public router: Router,
  ) {


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
    this.router.navigateByUrl(`/mobile-banking/Users/users/${data.id}`);
  }

  toggleExpandRow(row: any) {
    this.table.rowDetail.toggleExpandRow(row);
  }


}
