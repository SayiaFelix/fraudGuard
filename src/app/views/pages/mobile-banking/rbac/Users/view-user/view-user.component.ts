import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';

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

  constructor(
    private httpService: HttpService,
    public globalService: GlobalService,
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    public fb: FormBuilder
  ) {
    activatedRoute.queryParams.subscribe((params) => {
      this.mainProduct = params;
      console.log('queryParams', params);
    });
  }

  ngOnInit(): void {
    this.loadData();

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
  openDisableUserModal(content: TemplateRef<any>) {
    this.modalService
      .open(content, { centered: true, size: 'md' })
      .result.then((result) => {
        console.log('Modal closed' + result);
      })
      .catch((res) => {});
  }
  openDeleteUserModal(content: TemplateRef<any>) {
    this.modalService
      .open(content, { centered: true, size: 'md' })
      .result.then((result) => {
        console.log('Modal closed' + result);
      })
      .catch((res) => {});
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
}
