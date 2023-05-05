import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import Swal from 'sweetalert2';
import { AddProductSubItemComponent } from '../add-product-subitem/add-product-sub-item.component';
import { DomSanitizer } from '@angular/platform-browser';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from 'src/app/shared/services/http.service';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-list-all-products-as-cards',
  templateUrl: './list-all-products-as-cards.component.html',
  styleUrls: ['./list-all-products-as-cards.component.scss']
})
export class ListAllProductsAsCardsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;



  actions = ["View", "Edit"];


  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    {name: 'ID', prop: 'id'},
    {name: 'Name', prop: 'name'},
    {name: 'ParentCategory', prop: 'parentCategoryName'},
    {name: 'Remarks', prop: 'description'},
    {name: 'Status', prop: 'status'},
    {name: 'CreatedOn', prop: 'createdOn'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;
  public productCategoryId:any;


  title: string = "Product";
  autoPlayExampleOptions: OwlOptions = {
    items:4,
    loop:false,
    margin:0,
    autoplay:false,
    autoplayTimeout:9000,
    autoplayHoverPause: false,
    navSpeed: 20,
    dotsSpeed: 20,
    dragEndSpeed: 20,
    slideTransition: "none",
    mouseDrag: false,
    pullDrag: false,
    dots: true,
    dotsData: true,
    responsive:{
      0:{
        items: 1
      },
      600:{
        items: 2
      },
      1000:{
        items: 3
      }
    }
  }

  allItems:any[] = [
    // {
    //   id:'1',
    //   src:'assets/images/category4.png',
    //   alt:'Image_1',
    //   title:'Personal Accounts',
    //   description: "Describing personal accounts.",
    //   productDescription: "Here is the product description"
    // },
    // {
    //   id:'2',
    //   src:'assets/images/category2.png',
    //   alt:'Image_2',
    //   title:'Business Accounts',
    //   description: "Describing Business Accounts.",
    //   productDescription: "Here is the product description"

    // },
    // {
    //   id:'3',
    //   src:'assets/images/category3.png',
    //   alt:'Image_3',
    //   title:'Islamic accounts',
    //   description: "Describing Islamic accounts",
    //   productDescription: "Here is the product description"
    // },
    // {
    //   id:'4',
    //   src:'assets/images/category2.png',
    //   alt:'Image_4',
    //   title:'Student Accounts',
    //   description: "Describing Student Accounts.",
    //   productDescription: "Here is the product description"
    // }
  ]

  itemsForPresentation: any[];
  perPage: number = 6;
  page: any = 1;

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    private activatedRoute:ActivatedRoute,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService,
    public domSanitizer:DomSanitizer,
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnInit() {
    //
    // this.activatedRoute.params.subscribe(params => {
    //   if (typeof params.id !== 'undefined') {
    //     this.productCategoryId = params.id;
    //   }
    // })

//     this.slidesStore.forEach((slide:any)=> {
//       slide.productUrl = this.domSanitizer.bypassSecurityTrustUrl(slide.productUrl);
//  });


    this.breadCrumbItems = [
      {
        label: 'Mobile banking',
        path: '/mobile-banking/products/all-products',
      },
      {label: 'Pages', path: '/'},
      {label: 'Products', active: true},
    ];
    this.getIndividualData(0);
  }


  getIndividualData(event: number): void {

    const model = {
      page:0,
      size:100
    };

    this.httpService
      .mobileBankingPost('product/portal/fetch/all/active', model)
      .subscribe(
        (res: any) => {
          if (res.status === 200) {
            // let response = res['data'];

            let response = res.data.map((item: any, index: any) => {
              const res = {...item, frontendId: index + 1};
              return res;
            });
            this.allItems = response;
            this.itemsForPresentation = this.allItems.slice(0, 6);

          } else {
            Swal.fire('Failed', "Unable to fetch products", 'error')
          }
        }, (error: any) => {
          Swal.fire("Error", error.message, "error");
        });
  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(AddProductSubItemComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Product';
    this.modalRef.componentInstance.productCategoryId = this.productCategoryId;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred");
      }
    });
  }

  openEditProductModal(formData: any) {
    this.modalRef = this.modalService.open(AddProductSubItemComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Product';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  navigateToViewProduct(data: any) {
    this.router.navigateByUrl(`/mobile-banking/products/list-products/${data.id}`);
  }

  toggleExpandRow(row: any) {
    console.log(row);
    console.log(this.table);

    this.table.rowDetail.toggleExpandRow(row);
  }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

  updateFilter(event: any, columnName: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const temp = this.temp.filter(function (d: any) {
      return d.productName.toLowerCase().indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  toggle(col: any) {
    const isChecked = this.isChecked(col);

    if (isChecked) {
      this.columns = this.columns.filter((c) => {
        return c.name !== col.name;
      });
    } else {
      this.columns = [...this.columns, col];
    }
  }

  isChecked(col: any) {
    return (
      this.columns.find((c) => {
        return c.name === col.name;
      }) !== undefined
    );
  }

  toggleDrop() {
    let checkList: HTMLElement = document.getElementById('list1')!;

    if (checkList.classList.contains('visible'))
      checkList.classList.remove('visible');
    else checkList.classList.add('visible');
  }

  exportCSV() {
    let cols: string[] = this.columns.map(item => {
      if (item['name'].toLowerCase() !== 'actions') {
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[] = []

    this.rows.forEach((row: any) => {
      let temp: Record<string, string> = {}
      cols.forEach(key => {
        temp = {...temp, [key]: row[key]}
      })
      arr.push(temp)
    })
    this.dataExploration.exportToCsv(arr, 'Products')
  }

  exportXLSX() {
    let cols: string[] = this.columns.map(item => {
      if (item['name'].toLowerCase() !== 'actions') {
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[] = []

    this.rows.forEach((row: any) => {
      let temp: Record<string, string> = {}
      cols.forEach(key => {
        temp = {...temp, [key]: row[key]}
      })
      arr.push(temp)
    })

    this.dataExploration.exportDataXlsx(arr, 'Products')
  }

  exportPDF() {
    console.log(this.rows);
    let cols: string[] = this.columns.map(item => {
      if (item['name'].toLowerCase() !== 'actions') {
        return item['name'].toUpperCase()
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let rowKeys: string[] = Object.keys(this.rows[0]);
    let arr: string[][] = []
    this.rows.forEach((row: any) => {
      let temp: string[] = []
      rowKeys.forEach(key => {
        temp.push(row[key])
      })
      arr.push(temp)
    })
    this.dataExploration.exportToPdf(cols, arr, 'Products')
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this.navigateToViewProduct(eventData.row);
    } else if (eventData.action == 'Edit') {
      this.openEditProductModal(eventData.row);
    }

  }

  openDeleteModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = `Delete this Product?`;
    this.modalRef.componentInstance.body = `Do you want to delete product: ${formData.name}?`;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {

        let model = {
          id: formData.id
        }

        this.httpService.mobileBankingPost('product/portal/delete',
          model).subscribe(
          (result: any) => {
            if (result.status === 200) {
              Swal.fire('Product Deleted',
                'Product has been deleted successfully.',
                'success').then(r => console.log(r))
              this.getIndividualData(0)
            } else {
              Swal.fire('Record deletion error',
                'Product could not be deleted.',
                'error').then(r => console.log(r))
            }
          },
          (error: any) => {
            Swal.fire('Record deletion error',
              `${error}`,
              'error')
          }
        );
      }
    });
  }

  editProduct(formData: any) {
    this.modalRef = this.modalService.open(AddProductSubItemComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Product';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  onChange() {
    this.getIndividualData(0);
  }

  retrieveItemsForPresentation(page: number){
    let startingItem = (page-1) * 6;
    this.itemsForPresentation = this.allItems.slice(startingItem, startingItem + 6);
  }

  pageChangeEvent(page: number) {
    this.page = page;
    this.retrieveItemsForPresentation(page);
  }
}
