import {Component, Input, OnInit, TemplateRef} from '@angular/core';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ActivatedRoute, Params} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-view-product',
  templateUrl: './view-product.component.html',
  styleUrls: ['./view-product.component.scss']
})
export class ViewProductComponent implements OnInit {
  public myProductList = [
    {
      icon: '',
      name: '1. Personal Accident',
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
  public productDetails = {
    productName: 'Salary Advance',
    shortDescription: 'Get Salary Advance Loans',
    longDescription: 'Enjoy quick salary advances when you are in need of a quick loan to sort out your regular bills.',
    requirements: ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'],
    features: ['Get access up to 70% of your monthly salary']
  };
  public mainProduct: any;
  public subcategoryTitle: any;

  @Input() formData: any;
  public form: FormGroup;

  public imageFile: File;

  public features = ['Get access up to 70% of your monthly salary'];
  public requirements = ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'];




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


  // public openModal(parentData: any) {
  //   this.modalRef = this.modalService.open(CreateProductComponent, {size: 'lg'});
  //   this.modalRef.componentInstance.title = 'Add Product';
  //   this.modalRef.componentInstance.parentData = '';
  //   this.modalRef.result.then((result) => {
  //     if (result === 'success') {
  //       this.getIndividualData(this.page);
  //     }
  //   }, (reason) => {
  //   });
  // }

  // getIndividualData(event: number): void {
  //   this.isLoaded = false;
  //   this.page = event;
  //
  //   const model = {
  //     page: this.page,
  //     size: this.perPage
  //   };
  //
  //   this.httpService.post('api/v1/corporate/admin/all', model).subscribe((res: any) => {
  //
  //     if (res.status === 200) {
  //       setTimeout(() => {
  //         this.data = res.data.content;
  //         this.source.load(this.data);
  //         this.isLoaded = true;
  //
  //         this.total = res.totalItems;
  //
  //       }, 10);
  //     } else {
  //       this.toastrService.error(res.message, 'Error');
  //     }
  //   });
  // }
  isAsideNavCollapsed: any;

  getDetails({}) {

    this.productDetails = {
      productName: 'Salary Advance',
      shortDescription: 'Get Salary Advance Loans',
      longDescription: 'Enjoy quick salary advances when you are in need of a quick loan to sort out your regular bills.',
      requirements: ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'],
      features: ['Get access up to 70% of your monthly salary']
    };

    this.subcategoryTitle = this.productDetails.productName;
  }



  openAddProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true, size: "lg"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }

  openEditProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true, size: "lg"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  addFeature() {
    this.features = [this.form.value.feature, ...this.features];
  }

  addRequirement() {
    this.requirements = [this.form.value.requirement, ...this.requirements];
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
}
