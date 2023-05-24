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

  public productDetails: any;
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

  public requirementsLoading = true;
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
    this.loadRequirements();
    this.loadBenefits();
  }

  private loadData(): any {
    this.loading = true;
    const model = {
      id: this.productId
    };

    this.httpService.mobileBankingPost('product/portal/fetch/single', model).subscribe(
      (res: any) => {

        if (res.status == 200) {
          this.productDetails = res['data'];
          this.loading = false;

          // this.requirements = this.productDetails.requirementList;
          // this.rows = this.productDetails.requirementList;
          this.loading = false;

        } else {
          Swal.fire('Failed', "Unable to fetch product details", 'error')
        }
      }, (error: any) => {
        Swal.fire("Error", error.message, "error");
      });
  }
  private loadRequirements():any {
    this.requirementsLoading = true;
     const model ={
      id: this.productId
     }
     this.httpService.mobileBankingPost('product/portal/fetch/requirement',model).subscribe(
      (result:any)=>{
        if (result.status===200){

          let response = result['data'].map((item: any, index: any) => {
            let res = {...item,
              frontendId: index + 1
            };
            return res;
          })
          this.requirements = response;

          this.requirementsLoading = false;
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

         let response = result['data'].map((item: any, index: any) => {
           let res = {...item,
             frontendId: index + 1
           };
           return res;
         })
         this.benefits = response;

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
  loading: boolean;

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
        this.loadRequirements();
      } else {
        console.log("Error occurred")
      }
    });

    // this.requirements = [this.form.value.requirement, ...this.requirements];
  }

  addBenefit() {
    this.modalRef = this.modalService.open(AddBenefitComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Benefit';
    this.modalRef.componentInstance.productDetails = this.productDetails;
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
    this.modalRef.componentInstance.formData = rowData;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {
        // this.loadData();
        this.loadRequirements();
      } else {
        console.log("Error occurred")
      }
    });

  }

  removeRequirement(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Remove Requirement';

    this.modalRef.componentInstance.body= "Do you want to remove this requirement?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        const model = {
          id: formData.id
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

  editBenefit(formData: any) {
    this.modalRef = this.modalService.open(AddBenefitComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Benefit';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {
        this.loadData();
        this.loadBenefits();
        // this.loadRequirements();
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
      this.editBenefit(eventData.row);
    }
    else if (eventData.action == 'Delete') {
      this.removeBenefit(eventData.row);
    }
  }
}
