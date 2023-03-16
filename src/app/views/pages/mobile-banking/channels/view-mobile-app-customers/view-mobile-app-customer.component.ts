import {Component, Input, OnInit, TemplateRef} from '@angular/core';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ColumnMode} from '@swimlane/ngx-datatable';
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";

@Component({
  selector: 'app-view-customer',
  templateUrl: './view-mobile-app-customer.component.html',
  styleUrls: ['./view-mobile-app-customer.component.scss']
})
export class ViewMobileAppCustomerComponent implements OnInit {
  public myProductList = [
    {
      icon: '',
      TransID: '123',
      value: 8,
      text: 'danger'
    },
    {
      icon: '',
      name: '2. Mutual Funds',
      text: 'danger',
      value: 8,

    }
  ];
  breadCrumbItems: Array<{}>;
  rows: any = [];
  loadingIndicator = true;
  reorderable = true;


  columns = [
    {name: 'ID', prop: 'id'},
    {name: 'IMEI', prop: 'imei'},
    {name: 'LastLogin', prop: 'ServiceName'},
    {name: 'Status', prop: 'isActive'},
    {name: 'CreatedOn', prop: 'CreatedOn'},
    {name: 'Actions', prop: 'id'}
  ];


  public mainProduct: any;
  public subcategoryTitle: any;

  @Input() formData: any;
  public form: FormGroup;

  public imageFile: File;

  ColumnMode = ColumnMode;
  isAsideNavCollapsed: any;
  actions = ["Reset"];
  public modalRef: NgbModalRef;

  constructor(private httpService: HttpService,
              public globalService: GlobalService,
              public activatedRoute: ActivatedRoute,
              private modalService: NgbModal,
              public fb: FormBuilder,
  ) {
    activatedRoute.queryParams.subscribe(
      params => {

        this.mainProduct = params;
        console.log('queryParams', params);
      });
  }

  ngOnInit(): void {
    this.loadData();

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '',
        [Validators.required]],
      description: [this.formData ? this.formData.description : '',
        [Validators.required]],
      longDescription: [this.formData ? this.formData.longDescription : '',
        [Validators.required]],
      feature: [this.formData ? this.formData.feature : ''],
      requirement: [this.formData ? this.formData.requirement : '']
    });

  }

  openAddProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true, size: "lg"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {
    });
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  openResetPinModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true, size: "md"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {
    });
  }

  openDisableCustomerModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true, size: "md"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {
    });
  }

  triggerEvent(data: string) {
    let eventData = JSON.parse(data)
    if (eventData.action == 'Reset') {
      this.openResetPinModal(eventData.row);
    }
  }

  private loadData(): any {

    const model = {
      page: 0,
      size: 100
    };

    this.httpService.mobileBankingPost('api/v1/corporate/admin/list-products/all', model).subscribe(
      (result: any) => {
      }
    );
  }

  private createRecord(): any {

    const model = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      middleName: this.form.value.middleName,
      phoneNumber: this.form.value.phoneNumber,
      email: this.form.value.email,
      position: this.form.value.position,
      profileId: this.form.value.profile
    };

    this.httpService.mobileBankingPost('api/v1/corporate/admin/create', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
        } else {

        }
      }
    );
  }

  private loadProducts() {
    const model = {
      page: 0,
      size: 100
    };

    this.httpService.mobileBankingPost('api/v1/corporate/admin/profiles/all', model).subscribe(
      (result: any) => {

        // console.log(result.status);

        if (result.status === 200) {


        } else {
        }
      }
    );
  }

  openDisableLoginModeModal(loginMode: string) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = `Disable ${loginMode}`;
    this.modalRef.componentInstance.body = `Do you want to disable ${loginMode} for this customer?`;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {
        Swal.fire(`Disable ${loginMode}`,
          `${loginMode} has been disabled successfully`,
          'success').then(r => {
          console.log("successful")
        })
      } else {
        console.log("Error occurred")
      }
    });
  }
}
