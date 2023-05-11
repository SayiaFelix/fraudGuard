import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';
import {AddAtmComponent} from "../add-atm/add-atm.component";

@Component({
  selector: 'app-list-atms',
  templateUrl: './list-atms.component.html',
  styleUrls: ['./list-atms.component.scss']
})
export class ListAtmsComponent implements OnInit {

  @ViewChild('table') table: DatatableComponent;


  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  loading = true;
  reorderable = true;

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'ATM Name', prop:'name' },
    { name: 'ATM Code', prop:'atmCode' },
    { name: 'Active', prop:'isActive' },
    { name: 'Actions', prop: 'id' }
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  @Input() formData: { name: any; atmCode: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;

  public modalRef: NgbModalRef;
  title: string = "ATMs";
  actions = ["Edit"];

  totalRecords: number;


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

  public addAtm() {
    this.modalRef = this.modalService.open(AddAtmComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.title = 'Add ATM';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        // this.getIndividualData(this.page);
      }
    }, (reason) => {
    });
  }

  public editAtm(formData: any) {
    this.modalRef = this.modalService.open(AddAtmComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.title = 'Edit ATM';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        // this.getIndividualData(this.page);
      }
    }, (reason) => {
    });
  }
  getIndividualData(event: number): void {

    this.loading = true;
    const model = {
      "page":0,
      "size":50
    }

    this.httpService.mobileBankingPost('config/branch/fetch/atms/page', model).subscribe((res: any) => {
      if (res.status === 200) {

        this.loading = false;

        this.totalRecords = res.totalItems;
        // setTimeout(() => {
        //    this.rows=res.data;
        //   let total = res.totalItems;

        // }, 10);

        let response = res.data.map((item: any, index: any) => {
          const res = {...item, frontendId: index + 1};
          return res;
        });

        this.rows = response;
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

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      // this.navigateToViewProduct(eventData.row);
    }else if (eventData.action == 'Edit') {
      this.editAtm(eventData.row);
    }

  }
}
