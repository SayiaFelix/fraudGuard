import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ColumnMode, DatatableComponent} from '@swimlane/ngx-datatable';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import {AddProductSubItemComponent} from "../add-product-subitem/add-product-sub-item.component";
import Swal from "sweetalert2";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";


@Component({
  selector: 'app-list-products',
  templateUrl: './list-products.component.html',
  styleUrls: ['./list-products.component.scss']
})
export class ListProductsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;

  tempProductData = [
    {
      id: 1,
      name: 'Personal Accident',
      shortDescription: 'Summary',
      productDescription: 'Summary',
      status: true,
      createdOn: '12-02-2023',
    },
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  actions = ["View", "Edit", "Delete"];

  public productCategoryId: any;

  columns = [
    {name: 'ID', prop: 'id'},
    {name: 'ProductName', prop: 'name'},
    {name: 'CategoryName', prop: 'categoryName'},
    {name: 'Description', prop: 'shortDescription'},
    {name: 'Active', prop: 'active'},
    {name: 'CreatedOn', prop: 'createdAt'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Products";


  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService,
    private activatedRoute: ActivatedRoute,
  ) {
  }

  ngOnInit() {

    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        this.productCategoryId = params.id;
      }
    });

    this.breadCrumbItems = [
      {
        label: 'Mobile banking',
        path: '/mobile-banking/products/all-products',
      },
      {label: 'Pages', path: '/'},
      {label: 'Products', active: true},
    ];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
    });
  }

  getIndividualData(event: number): void {
    this.loading = true;

    const model = {
        "page":0,
        "size":100
    };

    this.httpService
      .mobileBankingPost('product/portal/fetch/all/active', model)
      .subscribe(
        (res: any) => {
          if (res.status === 200) {
            this.loading = false;

            let response = res['data'];

            this.rows = response.map((item: any, index: any) => {
              const res = {
                ...item,
                frontendId: index + 1,
                categoryName: item.productCategory.name,
                createdAt: item.createdAt.replace('T', ' ')
              };
              return res;
            });
          } else {
            Swal.fire('Failed', "Unable to fetch products", 'error')
          }
        }, (error: any) => {
          Swal.fire("Error", error.message, "error");
        });
  }

  openEditProductModal(formData: any) {
    this.modalRef = this.modalService.open(AddProductSubItemComponent, {centered: true,size:"md"});
    this.modalRef.componentInstance.title = 'Edit Product';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.productCategoryId = this.productCategoryId;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(AddProductSubItemComponent,
      {centered: true,size:"md"});
    this.modalRef.componentInstance.title = 'Add Product';
    this.modalRef.componentInstance.productCategoryId = this.productCategoryId;
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
    this.router.navigateByUrl(`/mobile-banking/products/product/${data.id}`);
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
    } else if (eventData.action == 'Delete') {
      this.openDeleteModal(eventData.row);
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
                this.getIndividualData(0);
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


}
