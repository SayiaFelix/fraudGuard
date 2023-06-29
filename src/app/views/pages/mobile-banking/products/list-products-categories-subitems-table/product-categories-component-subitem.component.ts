import {Component, Input, OnInit, ViewChild,} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import {AddProductComponent} from "../add-product/add-product.component";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";

@Component({
  selector: 'app-product-categories-subitem',
  templateUrl: './product-categories-component-subitem.component.html',
  styleUrls: ['./product-categories-component-subitem.component.scss'],
  providers: [DatePipe],
})

/**
 * Starter-component
 */
export class ProductCategoriesComponentSubItem implements OnInit {

  @Input() subItems : any;
  @ViewChild('table') table: DatatableComponent;

  actions = ["View", "Edit", "Delete"];
  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  columns = [
    {name: '#', prop: 'frontendId'},
    {name: 'Name', prop: 'name'},
    {name: 'ParentCategory', prop: 'parentCategoryName'},
    // {name: 'Remarks', prop: 'description'},
    {name: 'Status', prop: 'active'},
    {name: 'CreatedOn', prop: 'createdAt'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Category";
  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService
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
    this.getSubCategories();
  }

  getSubCategories(): void {
    this.loading = true;
    this.rows = this.subItems;

    let response = this.rows.map((item: any, index: any) => {
      this.loading = false;

      let res = {...item,
        parentCategoryName: item.parentCategoryName ? item.parentCategoryName : "_",
        frontendId: index + 1
      };
      return res;
    })
    this.rows = response;
  }
  openAddProductModal() {
    this.modalRef = this.modalService.open(AddProductComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Product Category';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getSubCategories();
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
        this.getSubCategories();
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
    console.log(data);

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
    } else if (eventData.action == 'Delete') {
      this.openDeleteModal(eventData.row);
    }

  }

  openDeleteModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = `Delete this Category?`;
    this.modalRef.componentInstance.body = `Do you want to delete category: ${formData.name}?`;
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
                'success').then(r => console.log(r))
              this.getSubCategories();
            } else {
              Swal.fire('Record deletion error',
                'Product Category could not be deleted.',
                'error').then(r => console.log(r))
            }
          },
          (error: any) => {
            console.log("this triggered")
            Swal.fire('Product Category could not be deleted.',
              `Record deletion error`,
              'error')
          }
        );
      }
    });
  }

  sendEvent(row: any, action: any) {
    let result = {
      row: row,
      action: action,
    };

    if (result.action == 'View') {
      this.navigateToViewProduct(result.row);
    } else if (result.action == 'Edit') {
      this.openEditProductModal(result.row);
    } else if (result.action == 'Delete') {
      this.openDeleteModal(result.row);
    }
  }

}
