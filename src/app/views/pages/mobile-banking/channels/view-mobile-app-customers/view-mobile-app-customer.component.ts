import {Component, Input, OnInit, TemplateRef} from '@angular/core';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ActivatedRoute, Params} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { ColumnMode } from '@swimlane/ngx-datatable';

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


  Transactioncolumns = [
    // { name: 'ID', prop: 'id' },
    { name: 'TransID', prop:'TransID' },
    { name: 'CreatedOn', prop:'CreatedOn' },
    {name:'ServiceName',prop:'ServiceName'},
    {name:'AccountNo.',prop:'AccountNo.'},
    {name:'Amount',prop:'Amount'},
    {name:'ChargeAmt',prop:'ChargeAmt'},
    {name:'ResCode',prop:'Respons'},
    // { name: 'IsActive', prop:'isActive' },
    // { name: 'Actions', prop: 'id' }
  ];
  public myproductList =[
      {
        customerID:'1256',
        accNo:'01198564321908',
      }
  ];
Accountscolumns = [
  { name:'CustomerID', prop:'customerID'},
  { name:'AccNo', prop:'accNo'},
  { name:'AccName', prop:'AccName'},
  { name:'AccBalance', prop:'AccBalance'},
  { name:'Status', prop:'Status'},

];

  public mainProduct: any;
  public subcategoryTitle: any;

  @Input() formData: any;
  public form: FormGroup;

  public imageFile: File;

  ColumnMode = ColumnMode;
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

  isAsideNavCollapsed: any;





  openAddProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true, size: "lg"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
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
  openResetPinModal(content: TemplateRef<any>){
    this.modalService.open(content, {centered: true, size: "md"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }
  openDisableCustomerModal(content: TemplateRef<any>){
    this.modalService.open(content, {centered: true, size: "md"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }
}
