import {Component, Input, OnInit, ViewChild,} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {FormBuilder, FormGroup} from '@angular/forms';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import {AddProductComponent} from "../add-product/add-product.component";
import {OwlOptions} from "ngx-owl-carousel-o";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {DomSanitizer} from '@angular/platform-browser';
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs";

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories-as-cards.component.html',
  styleUrls: ['./product-categories-as-cards.component.scss'],
  providers: [DatePipe],
})


/**
 * Starter-component
 */
export class ProductCategoriesAsCardsComponent implements OnInit {
  // @Pipe({
  //   name: 'safeUrl'
  // })

  @ViewChild('table') table: DatatableComponent;

  // transform(productUrl: string): SafeUrl {
  //   return this.sanitizer.bypassSecurityTrustUrl(productUrl);
  // }

  actions = ["View", "Edit"];


  @Input() subCategories: any

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

  title: string = "Category";
  autoPlayExampleOptions: OwlOptions = {
    items: 3,
    loop: false,
    margin: 0,
    autoplay: false,
    autoplayTimeout: 9000,
    autoplayHoverPause: true,
    responsive: {
      0: {
        items: 2
      },
      600: {
        items: 2
      },
      1000: {
        items: 2
      }
    }
  }

  fetchedCategories: any = [
    // {
    //   id:'1',
    //   src:'assets/images/category4.png',
    //   alt:'Image_1',
    //   name:'Bank Accounts',
    //   description: "Describing bank categories."
    // },
    // {
    //   id:'2',
    //   src:'assets/images/category2.png',
    //   alt:'Image_2',
    //   name:'Loan Products',
    //   description: "Describing loan categories."
    // },
    // {
    //   id:'3',
    //   src:'assets/images/category3.png',
    //   src:'data:image/png;base64,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',
    //   alt:'Image_3',
    //   name:'Investment category',
    //   description: "Describing investment categories."
    // },
    // {
    //   id:'4',
    //   src:'assets/images/category2.png',
    //   src:'data:image/png;base64,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',
    //   alt:'Image_4',
    //   name:'Card Products',
    //   description: "Describing card categories."
    // },
    // {
    //   id:'5',
    //   src:'assets/images/category3.png',
    //   src:'http://via.placeholder.com/265x167',
    //   alt:'Image_5',
    //   name:'Insurance Products',
    //   description: "Describing insurance categories."
    // },
  ]
  private base64Image: string;

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService,
    public domSanitizer: DomSanitizer,
    public http: HttpClient
  ) {
  }

  ngOnInit() {

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

  async getIndividualData(event: number) {

    const model = {
      page: 0,
      size: 50,
    };

    this.httpService
      .mobileBankingPost('product/portal/category/fetch/all', model)
      .subscribe((res: any) => {
        if (res.status === 200) {
          console.log(res.data);
          let response = res.data.map((item: any) => {
                res = {
                  ...item,
                  parentCategoryName: item.parentCategory ? item.parentCategory.name : "_",
                  categoryUrl: item.categoryUrl
                };

                return res;

              });


          this.fetchedCategories = response;

        }
      });
  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(AddProductComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Product Category';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred");
      }
    });
  }

  openEditProductModal(formData: any) {
    this.modalRef = this.modalService.open(AddProductComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Product Category';
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

  editProduct(formData: any) {
    this.modalRef = this.modalService.open(AddProductComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Product Category';
    this.modalRef.componentInstance.formData = formData;
    // this.modalRef.componentInstance.productCategoryId = this.productCategoryId;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openDeleteModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = `Delete this Category?`;
    this.modalRef.componentInstance.body = `Do you want to delete category: {${formData.name}}?`;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {

        let model = {
          id: formData.id
        }

        this.httpService.mobileBankingPost('product/portal/category/delete',
          model).subscribe(
          (result: any) => {
            if (result.status === 200) {
              Swal.fire('Product Deleted',
                'Product has been deleted successfully.',
                'success').then(r => console.log(r));
              this.getIndividualData(0);
            } else {
              Swal.fire('Record deletion error',
                'Product Category could not be deleted.',
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

  viewSubProducts(category: any) {
    this.router.navigate([`/mobile-banking/products/list-categories-cards-subcategories/${category.id}`])
  }

  // Get base64 from Image URL
  getImageAsBase64(url: string) {
    return this.http.get(url, {responseType: 'blob'})
      .pipe(
        map((res: Blob) => {
          const reader = new FileReader();
          reader.readAsDataURL(res);
          reader.onloadend = () => {
            // @ts-ignore
            return reader.result.toString();
            // .split(',')[1];
          }
        }));
  }

}
