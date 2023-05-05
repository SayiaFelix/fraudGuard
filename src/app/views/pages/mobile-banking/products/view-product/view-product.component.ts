import {Component, Input, OnInit, TemplateRef} from '@angular/core';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ActivatedRoute, Params} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import Swal from "sweetalert2";
import {AddProductSubItemComponent} from "../add-product-subitem/add-product-sub-item.component";
import {AddRequirementComponent} from "../add-requirement/add-requirement.component";
import { DomSanitizer } from '@angular/platform-browser';
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import { AddBenefitComponent } from '../add-benefit/add-benefit.component';

@Component({
  selector: 'app-view-customer',
  templateUrl: './view-product.component.html',
  styleUrls: ['./view-product.component.scss']
})
export class ViewProductComponent implements OnInit {
  public myProductList:any = [
    // {
    //   icon: '',
    //   name: '1. Personal Accident',
    //   value: 8,
    //   text: 'danger'
    // },
    // {
    //   icon: '',
    //   name: '2. Mutual Funds',
    //   text: 'danger',
    //   value: 8,

    // }
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
  public requirements:any;
  public benefits:any;

  public productId: number;
  public categoryId: number;
  public modalRef: NgbModalRef;
  constructor(private httpService: HttpService,
              public globalService: GlobalService,
              public activatedRoute: ActivatedRoute,
              private modalService: NgbModal,
              public fb: FormBuilder,
              public domSanitizer:DomSanitizer,

  ) {

  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {

        console.log('query-params');
        console.log(params);

        this.productId = params.id;
        this.categoryId = params.categoryId;
      }
    });

    this.loadData();
    // this.loadRequirements();
    this.loadBenefits();
  }

  private loadData(): any {
    this.isLoading = true;
    const model = {
      id: this.productId
    };

    this.httpService.mobileBankingPost('product/portal/fetch/single', model).subscribe(
      (res: any) => {

        if (res.status == 200) {
          this.productDetails = res['data'];

          this.requirements = this.productDetails.requirementList;
          this.rows = this.productDetails.requirementList;
          this.isLoading = false;

        } else {
          Swal.fire('Failed', "Unable to fetch product details", 'error')
        }
      }, (error: any) => {
        Swal.fire("Error", error.message, "error");
      });
  }
  private loadRequirements():any {
     const model ={
      id:this.productId
     }
     this.httpService.mobileBankingPost('product/portal/fetch/requirement',model).subscribe(
      (result:any)=>{
        if (result.status===200){
           this.requirements =result['data'];
        }
        else{
          Swal.fire('Failed','unable to fetch requirements','error')
        }

      },
      (error:any)=>{
        Swal.fire("Error",error.message,"error")
      }
     );
  }
  private loadBenefits():any {
    const model ={
     id:this.productId
    }
    this.httpService.mobileBankingPost('product/portal/fetch/benefits',model).subscribe(
     (result:any)=>{
       if (result.status===200){
          this.benefits =result['data'];
       }
       else{
         Swal.fire('Failed','unable to fetch requirements','error')
       }

     },
     (error:any)=>{
       Swal.fire("Error",error.message,"error")
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
  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'Requirement Name', prop:'requirement' },
    { name: 'Requirement Code', prop:'requirementCode' },
    { name: 'Actions', prop: 'id' }
  ];
  benefitsColumn =[
    { name: 'ID', prop: 'id' },
    {name:"Benefit",prop:'benefit'},
    {name:"Description",prop:'description'},
    { name: 'Benefit Code', prop:'benefitCode' },
    { name: 'Actions', prop: 'id' }
  ]
  rows: any = [];
  actions = ["Edit", "Delete"];
  isLoading: boolean;

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
    this.modalRef.componentInstance.formData = this.productDetails;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {
        this.loadData();
        // this.loadRequirements();
      } else {
        console.log("Error occurred")
      }
    });

    // this.requirements = [this.form.value.requirement, ...this.requirements];
  }
  
  addBenefit() {
    this.modalRef = this.modalService.open(AddBenefitComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Benefit';
    this.modalRef.componentInstance.formData = this.productDetails;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {
        this.loadBenefits();
        // this.loadRequirements();
      } else {
        console.log("Error occurred")
      }
    });

    // this.requirements = [this.form.value.requirement, ...this.requirements];
  }


  editRequirement(rowData: any) {
    this.modalRef = this.modalService.open(AddRequirementComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Requirement';
    this.modalRef.componentInstance.formData = this.productDetails;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {
        this.loadData();
        // this.loadRequirements();
      } else {
        console.log("Error occurred")
      }
    });

  }

  removeRequirement(id: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Remove Requirement';

    this.modalRef.componentInstance.body= "Do you want to remove this requirement?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        const model = {
          id: id
        };

        this.httpService.mobileBankingPost('product/portal/requirement/remove', model).subscribe(
          (result: any) => {
            if (result.status === 200) {
              this.loadData();
              this.loadRequirements();
            } else {

            }
          }
        );


        Swal.fire('Remove Requirement',  'Requirement removed successfully.',  'success')
          .then
          (r => this.loadData())
      } else {
        console.log("Error occurred")
      }
    });
  }
  
  removeBenefit(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Remove Benefit';
    this.modalRef.componentInstance.body= "Do you want to remove this benefit?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.loadBenefits();
        const model = {
          id: formData.id
        };
        this.httpService.mobileBankingPost('product/portal/benefits/remove', model).subscribe(
          (result: any) => {
            if (result.status === 200){
            Swal.fire('Remove Benefit','Benefit removed successfully.','success')
            .then
            (r=>console.log(r))
            // (r => this.loadBenefits())
        } else {
          console.log("Error occurred")
        }
          }
      );
    }
  });
  }

  triggerEventRequirement(data: string) {
    let eventData = JSON.parse(data)

    if (eventData.action == 'Edit') {
      this.editRequirement(eventData.row);
    }else if (eventData.action == 'Delete') {
      this.removeRequirement(eventData.row);
    }
    else if (eventData.action == 'Delete') {
      this.removeBenefit(eventData.row);
    }
  }
  triggerEventBenefit(data: string) {
    let eventData = JSON.parse(data)

    if (eventData.action == 'Edit') {
      this.editRequirement(eventData.row);
    }
    else if (eventData.action == 'Delete') {
      this.removeBenefit(eventData.row);
    }
  }
}
