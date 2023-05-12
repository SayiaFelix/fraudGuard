import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';
import {AddBranchComponent} from "../add-branch/add-branch.component";
import { HttpResponseBase } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';


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
    { name: 'Branch Name', prop:'name' },
    { name: 'Branch Code', prop:'code' },
    { name: 'Status', prop:'isActive' },
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

  actions = ["Edit","Delete"];

  loading: boolean;

  totalRecords: number;
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
      code: [this.formData ? this.formData.branchCode : '', [Validators.required]],
      is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
    });
  }

  public addBranch() {
    this.modalRef = this.modalService.open(AddBranchComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.title = 'Add Branch';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      }
    }, (reason) => {
    });
  }

  public editBranch(formData: any) {
    this.modalRef = this.modalService.open(AddBranchComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.title = `Edit Branch (${formData.name})`;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      }
    }, (reason) => {
    });
  }

  deleteBranch(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = `Delete this Branch?`;
    this.modalRef.componentInstance.body = `Do you want to delete branch?`;
    // this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {
      const model = {
          id: formData.id
        }
        this.httpService.mobileBankingPost('config/branch/delete',model).subscribe(
          (result: any) => {
            if (result.status === 200) {
              Swal.fire('Branch Deleted',
                'Branch has been deleted successfully.',
                'success').then(r => console.log(r))
                this.getIndividualData(0);
            } else {
              Swal.fire('Record deletion error',
                'Branch could not be deleted.',
                'error').then(r => console.log(r))
            }
          },
          (error: any) => {
            Swal.fire('Record deletion error',
              `Record deletion error`,
              'error')
          }
        );
      }
    });
  }

  getIndividualData(event: number): void {

    this.loading = true;

    // this.rows = this.tempProductData;
    const model = {
      page:0,
      size:50
    };

    this.httpService.mobileBankingPost('config/branch/fetch/region/page', model).subscribe((res: any) => {
      if (res.status===200){
        this.loading = false;

        this.totalRecords = res.totalItems;
        // this.activeModal.close('success');
      //  Swal.fire('success','records fetched successfully','success')
      //  .then(r=>console.log(r))
        let response = res.data.map((item: any, index: any) => {
          const res = {...item, frontendId: index + 1};
          return res;
        });

        this.rows = response;
      }
      else{
        Swal.fire('failed','unable to fetch records','error')
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
    else if (eventData.action == 'Delete') {
      this.deleteBranch(eventData.row);
    }

  }
}
