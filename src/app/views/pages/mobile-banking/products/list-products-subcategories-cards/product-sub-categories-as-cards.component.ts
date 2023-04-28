import {Component, Input, OnInit, Pipe, PipeTransform, ViewChild,} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import {AddProductComponent} from "../add-product/add-product.component";
import {OwlOptions} from "ngx-owl-carousel-o";
import {AddProductSubItemComponent} from "../add-product-subitem/add-product-sub-item.component";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-product-sub-categories',
  templateUrl: './product-sub-categories-as-cards.component.html',
  styleUrls: ['./product-sub-categories-as-cards.component.scss'],
  providers: [DatePipe],
})


/**
 * Starter-component
 */
export class ProductSubCategoriesAsCardsComponent implements OnInit {
  // @Pipe({
  //   name: 'safeUrl'
  // })


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

  fetchedSubCategories: any = [];

  categoryId: any;

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService,
    public domSanitizer: DomSanitizer,

    public activatedRoute: ActivatedRoute,
  ) {
  }

  ngOnInit() {

    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        this.categoryId = params.id;
      }
    })

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
      id: this.categoryId
    };

    this.httpService
      .mobileBankingPost('product/portal/category/fetch/single', model)
      .subscribe((res: any) => {
        if (res.status === 200) {
          console.log(res.data);
          let response = res.data.children.map((item: any) => {

            const imageUrl = this.getBase64ImageFromUrl(item?.categoryUrl?.trim());

            let result = {
              ...item,
              parentCategoryName: item.parentCategory ? item.parentCategory.name : "_",
            };


            return result;
          })


          this.fetchedSubCategories = response;          
        } else {
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


  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
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

  viewSubProducts(children: any) {
    this.router.navigate(["/mobile-banking/products/list-categories-cards-subcategories"])
  }

  // Get base64 from Image URL
  async getBase64ImageFromUrl(imageUrl: string) {

    console.log(imageUrl);

    let url = this.domSanitizer.bypassSecurityTrustUrl(imageUrl);
    // domSanitizer.bypassSecurityTrustResourceUrl(category.categoryUrl)
    console.log("here is the url")
    console.log(url)

    // let res = await fetch("https://www.google.com");
    //
    // console.log(res);
    // let blob = await res.blob();
    //
    // console.log(blob);
    //
    // return new Promise((resolve, reject) => {
    //   let reader  = new FileReader();
    //   reader.addEventListener("load", function () {
    //     resolve(reader.result);
    //   }, false);
    //
    //   reader.onerror = () => {
    //     return reject(this);
    //   };
    //   reader.readAsDataURL(blob);
    // })
  }

}
