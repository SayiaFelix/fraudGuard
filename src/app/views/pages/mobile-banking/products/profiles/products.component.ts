import {Component, OnInit, TemplateRef} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
// import {AddProductComponent} from './add-product/add-product.component';
import {HttpService} from "../../../../../shared/services/http.service";
import {GlobalService} from "../../../../../shared/services/global.service";

@Component({
  selector: 'app-starter',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  providers: [DatePipe]
})

/**
 * Starter-component
 */
export class ProductsComponent implements OnInit {

  tempProductData = [
    {
      id: 1,
      productName: 'Bank Accounts',
      remarks: 'Bank Accounts Description',
      createdOn: '12-02-2023',

    },
    {
      id: 2,
      productName: 'Card Accounts',
      remarks: 'Card Accounts Description',
      createdOn: '12-02-2023',
    },
    {
      id: 3,
      productName: 'Loan Accounts',
      remarks: 'Loan Accounts Description',
      createdOn: '12-02-2023',
    },
    {
      id: 4,
      productName: 'Investment Accounts',
      remarks: 'Investment Accounts Description',
      createdOn: '12-02-2023',
    },
    {
      id: 5,
      productName: 'Insurance Accounts',
      remarks: 'Insurance Accounts Description',
      createdOn: '12-02-2023',
    },
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  public isLoaded = false;
  public formData: any;
  public modalRef: NgbModalRef;

  dataSet: any;

  public pendingCreateDataSet: any;
  public pendingUpdateDataSet: any;

  // New Params
  data: any[];
  total: any;
  perPage = 10;
  pageSizes: number[] = [2, 5, 10, 20, 50];

  page = 1;
  dataLoaded = false;

  // New Params

  public selectedTab = 0;

  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              public datePipe: DatePipe,

              public router: Router,
              public globalService: GlobalService) {


  }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Mobile banking', path: '/mobile-banking/products/alll-products' },
      { label: 'Pages', path: '/' }, { label: 'Products', active: true }];
    this.getIndividualData(this.page);
  }

  // public openModal(parentData: any) {
  //   this.modalRef = this.modalService.open(AddProductComponent);
  //   this.modalRef.componentInstance.title = 'Add Product';
  //   this.modalRef.componentInstance.parentData = '';
  //   this.modalRef.result.then((result) => {
  //     if (result === 'success') {
  //       this.getIndividualData(this.page);
  //     }
  //   }, (reason) => {
  //   });
  // }

  // public editProduct(formData: any) {
  //   this.modalRef = this.modalService.open(AddProductComponent);
  //   this.modalRef.componentInstance.formData = formData;
  //   this.modalRef.componentInstance.title = 'Edit Product: ';
  //   this.modalRef.result.then((result) => {
  //     if (result === 'success') {
  //       this.getIndividualData(this.page);
  //     }
  //   }, (reason) => {
  //   });
  // }

  onCustomAction(event: { action: any; data: any; }) {
    switch (event.action) {
      case 'viewrecord':
        // this.viewProduct(event.data);
        break;
      case 'editrecord':
        // this.editProduct(event.data);
    }
  }

  private viewProduct(data: any): void {
    console.log('here is the product data');
    console.log(data);
    this.router.navigate(['products', 'product', data.id], {queryParams: data});
  }


  getPendingEditProducts() {
    this.selectedTab = 3;
    this.isLoaded = false;
    const model = '';

    this.httpService.mobileBankingPaginationPost('api/v1/corporate/staged/profile/update', model).subscribe((result: any) => {
        if (result.status === 200) {

          this.pendingUpdateDataSet = result.data.filter((item: { data: any; stageId: any; canApprove: any; }) => {

            item.data.stageId = item.stageId;
            item.data.canApprove = item.canApprove;
            return item.data.canApprove === true;

          });

          console.log('this.pendingUpdateDataSet');
          console.log(this.pendingUpdateDataSet);

          this.isLoaded = true;

        } else {
        }
      }, );

  }



  public getActiveProducts() {
    this.selectedTab = 0;
    this.getIndividualData(this.page);
  }

  onCustomApproveAction(event: any) {
    switch (event.action) {
      case 'approveRecord':
        this.approveRecord(event.data);
        break;
    }
  }

  approveRecord(data: any): any {
    this.isLoaded = false;
    console.log('Approving record one');
    console.log(data);

    const model = {
      stagedActionId: data.stageId,
      approved: true
    };

    this.httpService.mobileBankingPost('api/v1/corporate/workflow/approve/workflow', model).subscribe(
        (result: any) => {
        if (result.status === 200) {
          this.getIndividualData(this.page);
        } else {
        }
      }
    );
  }

  showApproveButton() {
    return {name: 'approveRecord', title: 'Approve'};
  }

  onChange() {
    this.getIndividualData(this.page);
  }

  getIndividualData(event: number): void {
    this.isLoaded = false;
    this.page = event;

    const model = {
      page: this.page,
      size: this.perPage
    };

    this.httpService.mobileBankingPost('api/v1/corporate/admin/profiles/all', model).subscribe((res: any) => {

      if (res.status === 200) {
        setTimeout(() => {
          // this.data = res.data;
          this.data = this.tempProductData;
          this.isLoaded = true;

          this.total = res.totalItems;

        }, 10);
      } else {
      }
    });
  }

  openAddProductModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }
}
