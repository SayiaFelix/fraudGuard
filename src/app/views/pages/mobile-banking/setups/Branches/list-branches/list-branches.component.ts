import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';
import {AddBranchComponent} from "../add-branch/add-branch.component";


@Component({
  selector: 'app-list-branches',
  templateUrl: './list-branches.component.html',
  styleUrls: ['./list-branches.component.scss']
})
export class ListBranchesComponent implements OnInit {
  tempProductData = [
    {
      id: 1,
     branchName: 'KCB Kipande House',
      branchCode: '00679',
      createdOn: '12-02-2023',

    },
    {
      id: 2,
     branchName: 'KCB Biashara Street',
      branchCode: '17806',
      createdOn: '12-02-2023',
    },
    {
      id: 3,
      branchName: 'KCB Tom Mboya',
      branchCode: '45670',
      isActive: true,
      createdOn: '12-02-2023',
    },
    {
      id: 4,
      branchName: 'KCB River Road',
      branchCode: '45698',
      isActive: true,
      createdOn: '12-02-2023',
    },
    {
      id: 5,
      branchName: 'KCB Milimani',
      branchCode: '34876',
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
    { name: 'BranchName', prop:'branchName' },
    { name: 'BranchCode', prop:'branchCode' },
    { name: 'IsActive', prop:'isActive' },
    { name: 'Actions', prop: 'id' }
  ];

  allColumns = [...this.columns]

  public form: FormGroup;
  @Input() formData: { name: any; branchCode: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;
  @ViewChild('table') table: DatatableComponent;

  public modalRef: NgbModalRef;

  title: string = "Branches";

  actions = ["Edit"];


  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              public fb: FormBuilder,


              public router: Router,
              public globalService: GlobalService) {


  }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Mobile banking', path: '/mobile-banking/branches/all-branches' },
      { label: 'Pages', path: '/' }, { label: 'Branches', active: true }];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [this.formData ? this.formData.branchCode : '', [Validators.required]],
      is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
    });
  }

  public addBranch() {
    this.modalRef = this.modalService.open(AddBranchComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.title = 'Add Branch';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        // this.getIndividualData(this.page);
      }
    }, (reason) => {
    });
  }

  public editBranch(formData: any) {
    this.modalRef = this.modalService.open(AddBranchComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.title = 'Edit Branch';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        // this.getIndividualData(this.page);
      }
    }, (reason) => {
    });
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

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  toggleExpandRow(row:any){
    this.table.rowDetail.toggleExpandRow(row);
  }

  onDetailToggle(event:any){
    console.log('Detail Toggled', event);
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
    }else if (eventData.action == 'Edit') {
      this.editBranch(eventData.row);
    }

  }
}
