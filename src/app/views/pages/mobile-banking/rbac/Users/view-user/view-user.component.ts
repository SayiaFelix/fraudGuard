import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';
import {ConfirmDialogComponent} from "../../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";

@Component({
  selector: 'app-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent implements OnInit {
  public myProductList = [
    {
      icon: '',
      name: 'Email:test@gmail.com',
      value: 8,
      text: 'danger',
    },
    {
      icon: '',
      name: 'Phone Number:0734567865',
      text: 'danger',
      value: 8,
    },
  ];
  breadCrumbItems: Array<{}>;
  rows: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'AuditMessage', prop: 'AuditMessage' },
    { name: 'CreatedOn', prop: 'CreatedOn' },
    // { name: 'IsActive', prop:'isActive' },
    // { name: 'Actions', prop: 'id' }
  ];

  // public productDetails = {
  //   columns = [
  //     { name: 'ID', prop: 'id' },
  //     { name: 'BranchName', prop:'branchName' },
  //     { name: 'BranchCode', prop:'branchCode' },
  //     { name: 'IsActive', prop:'isActive' },
  //     { name: 'Actions', prop: 'id' }
  //   ];
  // };
  public mainProduct: any;
  public subcategoryTitle: any;

  @Input() formData: any;
  public form: FormGroup;

  ColumnMode = ColumnMode;

  public imageFile: File;
  public modalRef: NgbModalRef;
  public userId: any;


  constructor(
    private httpService: HttpService,
    public globalService: GlobalService,
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    public fb: FormBuilder
  ) {

  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        this.userId = params.id;
      }
    });

    this.loadData();

    this.loadProfiles();

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [
        this.formData ? this.formData.description : '',
        [Validators.required],
      ],
      longDescription: [
        this.formData ? this.formData.longDescription : '',
        [Validators.required],
      ],
      feature: [this.formData ? this.formData.feature : ''],
      requirement: [this.formData ? this.formData.requirement : ''],
    });
  }

  private loadData(): any {
    const model = {
      page: 0,
      size: 100,
    };

    // this.httpService
    //   .mobileBankingPost('api/v1/corporate/admin/list-products/all', model)
    //   .subscribe((result: any) => {});
  }
  isAsideNavCollapsed: any;

  openAddProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService
      .open(content, { centered: true, size: 'md' })
      .result.then((result) => {
        console.log('Modal closed' + result);
      })
      .catch((res) => {});
  }

  openChangeProfileModal(content: TemplateRef<any>) {
    this.modalService
      .open(content, { centered: true, size: 'md' })
      .result.then((result) => {
        console.log('Modal closed' + result);
      })
      .catch((res) => {});
  }
  openResetPasswordModal(content: TemplateRef<any>) {
    this.modalService
      .open(content, { centered: true, size: 'md' })
      .result.then((result) => {
        console.log('Modal closed' + result);
      })
      .catch((res) => {});
  }
  openDisableUserModal() {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Block User';

    this.modalRef.componentInstance.body = "Do you want to block this user?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {

        let model = {
          "id": this.userId
        }

        this.httpService.mobileBankingPost('api/v1/admin/user/block',
          model).subscribe((res: any) => {

          if (res.status === 200) {
            setTimeout(() => {
              Swal.fire('Blocked Successfully', 'User has been blocked successfully.', 'success')
            }, 10);
          } else {
            Swal.fire('Block Failed', res.message, 'error')
          }
        }, (error: any) => {
          Swal.fire('Block Failed', 'User deletion failed.', 'error')
        });


      }
    })
  }
  openDeleteUserModal() {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Delete User';

    this.modalRef.componentInstance.body = "Do you want to delete this user?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {

        let model = {
          "id": this.userId
        }

        this.httpService.mobileBankingPost('api/v1/admin/user/delete',
          model).subscribe((res: any) => {

          if (res.status === 200) {
            setTimeout(() => {
              Swal.fire('Deleted Successfully', 'User has been deleted successfully.', 'success')
            }, 10);
          } else {
            Swal.fire('Deletion Failed', res.message, 'error')
          }
        }, (error: any) => {
          Swal.fire('Deletion Failed', 'User deletion failed.', 'error')
        });


      }
    })
  }

  openEditProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService
      .open(content, { centered: true, size: 'md' })
      .result.then((result) => {
        console.log('Modal closed' + result);
      })
      .catch((res) => {});
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  private createRecord(): any {
    const model = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      middleName: this.form.value.middleName,
      phoneNumber: this.form.value.phoneNumber,
      email: this.form.value.email,
      // position: this.form.value.position,
      profileId: this.form.value.profile,
    };

    // this.httpService
    //   .mobileBankingPost('api/v1/corporate/admin/create', model)
    //   .subscribe((result: any) => {
    //     if (result.status === 200) {
    //     } else {
    //     }
    //   });
  }

  private loadProfiles() {
    const model = {
      page: 0,
      size: 100,
    };

    this.httpService
      .mobileBankingPost('api/v1/admin/profile/get/all', model)
      .subscribe((result: any) => {});
  }
}
