// import { Component, OnInit } from '@angular/core';
// import {HttpService} from '../../../../../shared/services/http.service';
// import {GlobalService} from '../../../../../shared/services/global.service';
// import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
// import {ToastrService} from 'ngx-toastr';
// import {LocalDataSource} from 'ng2-smart-table';
// import {CreateProductComponent} from '../create-product-subitem/create-product.component';
// import {ActivatedRoute, Params} from '@angular/router';
//
// @Component({
//   selector: 'app-view-product',
//   templateUrl: './view-product.component.html',
//   styleUrls: ['./view-product.component.scss']
// })
// export class ViewProductComponent implements OnInit {
//   private dataSet: any;
//
//   public isLoaded = false;
//
//   // New Params
//   data: any[];
//   total: any;
//   perPage = 10;
//   pageSizes: number[] = [2, 5, 10, 20, 50, 100, 200];
//
//   page = 1;
//   source: LocalDataSource = new LocalDataSource();
//
//   // New Params
//   public breadCrumbItems: any;
//   currentUser: any;
//
//   public modalRef: NgbModalRef;
//   public myProductList = [
//     {
//       icon: '',
//       name: '1. Personal Accident',
//       // value: 8,
//       text: 'danger'
//     },
//     {
//       icon: '',
//       name: '2. Mutual Funds',
//       text: 'danger'
//     }
//   ];
//   public productDetails = {
//     productName: 'Salary Advance',
//     shortDescription: 'Get Salary Advance Loans',
//     longDescription: 'Enjoy quick salary advances when you are in need of a quick loan to sort out your regular bills.',
//     requirements: ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'],
//     features: ['Get access up to 70% of your monthly salary']
//   };
//   public mainProduct: any;
//   public subcategoryTitle: any;
//
//
//   constructor(private httpService: HttpService,
//               public globalService: GlobalService,
//               public activatedRoute: ActivatedRoute,
//               private modalService: NgbModal,
//               public toastrService: ToastrService,
//   ) {
//     activatedRoute.queryParams.subscribe(
//       params => {
//
//         this.mainProduct = params;
//         console.log('queryParams', params);
//       });
//   }
//
//   ngOnInit(): void {
//     this.breadCrumbItems = [{ label: 'Mobile banking', path: '/mobile-banking/all-list-products' },
//       { label: 'Pages', path: '/' }, { label: 'RBAC', active: true }];
//     this.loadData();
//
//
//   }
//
//   private loadData(): any {
//
//     const model = {
//       page: 0,
//       size: 100
//     };
//
//     this.httpService.advancysPost('api/v1/corporate/admin/list-products/all', model).subscribe(
//       (result: any) => {
//         this.dataSet = [];
//
//         // result.data.content;
//       }
//     );
//   }
//
//
//   public openModal(parentData: any) {
//     this.modalRef = this.modalService.open(CreateProductComponent, {size: 'lg'});
//     this.modalRef.componentInstance.title = 'Add Product';
//     this.modalRef.componentInstance.parentData = '';
//     this.modalRef.result.then((result) => {
//       if (result === 'success') {
//         this.getIndividualData(this.page);
//       }
//     }, (reason) => {
//     });
//   }
//
//   getIndividualData(event: number): void {
//     this.isLoaded = false;
//     this.page = event;
//
//     const model = {
//       page: this.page,
//       size: this.perPage
//     };
//
//     this.httpService.post('api/v1/corporate/admin/all', model).subscribe((res: any) => {
//
//       if (res.status === 200) {
//         setTimeout(() => {
//           this.data = res.data.content;
//           this.source.load(this.data);
//           this.isLoaded = true;
//
//           this.total = res.totalItems;
//
//         }, 10);
//       } else {
//         this.toastrService.error(res.message, 'Error');
//       }
//     });
//   }
//
//   getDetails({}) {
//
//     this.productDetails = {
//       productName: 'Salary Advance',
//       shortDescription: 'Get Salary Advance Loans',
//       longDescription: 'Enjoy quick salary advances when you are in need of a quick loan to sort out your regular bills.',
//       requirements: ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'],
//       features: ['Get access up to 70% of your monthly salary']
//     };
//
//     this.subcategoryTitle = this.productDetails.productName;
//   }
// }
