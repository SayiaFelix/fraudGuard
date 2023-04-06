import {Component, Input, OnInit, TemplateRef} from '@angular/core';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ActivatedRoute, Params} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import Swal from "sweetalert2";
import {AddProductCategoryComponent} from "../add-product-subitem/add-product-category.component";
import {AddRequirementComponent} from "../add-requirement/add-requirement.component";

@Component({
  selector: 'app-view-customer',
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
  public productDetails: any;
  //   {
  //   productName: 'Personal Accident',
  //   shortDescription: 'Get Salary Advance Loans',
  //   longDescription: 'Enjoy quick salary advances when you are in need of a quick loan to sort out your regular bills.',
  //   requirements: ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'],
  //   // features: ['Get access up to 70% of your monthly salary']
  // };

  public mainProduct: any;
  public subcategoryTitle: any;

  @Input() formData: any;
  public form: FormGroup;

  public imageFile: File;

  public features = ['Get access up to 70% of your monthly salary'];
  public requirements = ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'];

  public productId: number;
  public modalRef: NgbModalRef;



  constructor(private httpService: HttpService,
              public globalService: GlobalService,
              public activatedRoute: ActivatedRoute,
              private modalService: NgbModal,
              public fb: FormBuilder,

  ) {

  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        this.productId = params.id;
      }
    });

    this.loadData();
  }

  private loadData(): any {

    const model = {
      id: this.productId
    };

    this.httpService.mobileBankingPost('product/portal/fetch/single', model).subscribe(
      (res: any) => {
        if (res.status == 200) {
          this.productDetails = res['data'];

        } else {
          Swal.fire('Failed', "Unable to fetch product details", 'error')
        }
      }, (error: any) => {
        Swal.fire("Error", error.message, "error");
      });
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
    this.modalRef = this.modalService.open(AddRequirementComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Requirement';
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {
        this.loadData();
      } else {
        console.log("Error occurred")
      }
    });

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

}
