import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import Swal from "sweetalert2";
import {HttpService} from "../../../../../../shared/services/http.service";
import {AddCustomerComponent} from "../../../channels/add-customer/add-customer.component";
import {ConfirmDialogComponent} from "../../../../../../shared/components/confirm-dialog/confirm-dialog.component";

@Component({
  selector: 'app-view-account',
  templateUrl: './view-account.component.html',
  styleUrls: ['./view-account.component.scss']
})
export class ViewAccountComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
    actions = ["View","Edit"]
    ussdActions = ["Disable"]
  tempProductData = [
    {
      id: 1,
      IMSINumber: '234035678765',
      serviceProvider:'Safaricom',
      description: 'Summary',
      status: true,
      createdOn: '12-02-2023',
      lastUsed:'31-03-2023'
    },
    {
      id: 2,
      IMSINumber: '262062345678',
      serviceProvider:'Airtel',
      description: 'Summary',
      status: true,
      createdOn: '12-02-2023',
      lastUsed:'31-03-2023'
    },

  ];
  registeredColumns = [
    { name: 'ID', prop: 'id' },
    { name: 'IMSI Number', prop: 'IMSINumber' },
    { name: 'Primary IMSI No.', prop: 'primaryIMSINumber' },
    { name: 'Service Provider', prop: 'serviceProvider' },
    { name: 'Status', prop: 'status' },
    { name: 'Created On', prop: 'createdOn' },
    {name:'Last Used',prop:'lastUsed'},
    { name: 'Actions', prop: 'id' },
  ];
 transactionsColumns = [
  { name: 'Trans ID', prop:'TransID' },
  { name: 'Created On', prop:'CreatedOn' },
  {name:'Service Name',prop:'ServiceName'},
  {name:'Account No.',prop:'AccountNo.'},
  {name:'Amount',prop:'Amount'},
  {name:'Charge Amt',prop:'ChargeAmt'},
  {name:'Res Code',prop:'Respons'},

  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'IMSI Number', prop: 'IMSINumber' },
    { name: 'Status', prop: 'status' },
    { name: 'Created On', prop: 'createdOn' },
    { name: 'Actions', prop: 'id' },
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "USSD";
  isAsideNavCollapsed :any;
  public subcategoryTitle: any;

  public accountData: any;
  private customerId: any;

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private dataExploration: DataExportationService
  ) {}

  ngOnInit() {
    this.breadCrumbItems = [
      {
        label: 'Mobile banking',
        path: '/mobile-banking/products/all-products',
      },
      { label: 'Pages', path: '/' },
      { label: 'Products', active: true },
    ];


    this.activatedRoute.params.subscribe((params: any) => {
      if (typeof params.id !== 'undefined') {
        this.customerId = params.id;
      }
    })

    this.getIndividualData(0);

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
    });
  }

  getIndividualData(event: number): void {

    const model = {
      id: this.customerId
    };

    this.httpService
      .mobileBankingPostNest('accounts/getAccountById', model)
      .subscribe((res: any) => {
        if (res.status === 201) {
          setTimeout(() => {
            this.accountData = res.data;

            let total = res.totalItems;
          }, 10);
        } else {
        }
      });
  }

  openEditProductModal(formData: any) {
    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true});
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

  openAddProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true, size: "lg"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Product';
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
      if(item['name'].toLowerCase() !== 'actions'){
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[]= []

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
      if(item['name'].toLowerCase() !== 'actions'){
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[]= []

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
      if(item['name'].toLowerCase() !== 'actions'){
        return item['name'].toUpperCase()
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let rowKeys: string[] = Object.keys(this.rows[0]);
    let arr: string[][]= []
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
  openResetPinModal(content: TemplateRef<any>){
    this.modalService.open(content, {centered: true, size: "md"}).result.then((result) => {
      Swal.fire('Pin Reset Successful',
        'Customer pin has been reset successfully.',
        'success').then(r => this.getIndividualData(0))
    }).catch((res) => {});
  }
  openDisableCustomerModal(){
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Delete Customer';
    this.modalRef.componentInstance.body = 'Do you want to permanently delete this customer?';
    this.modalRef.result.then((result) => {
      if (result === 'success') {

        const model = {
          id: this.customerId
        };

        this.httpService
          .mobileBankingPostNest('accounts/disableAccountById', model)
          .subscribe((res: any) => {
            if (res.status === 201) {
              setTimeout(() => {
                this.accountData = res.data;
                this.router.navigate(['/mobile-banking/accounts/list-accounts']);

                let total = res.totalItems;
              }, 10);
            } else {
            }
          });

        Swal.fire('Delete Successful',
          'Customer has been deleted successfully!',
          'success').then(r => {});
      } else {
        console.log("Error occurred")
      }
    });
  }
  triggerEvent(data:string){
    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this. navigateToViewProduct(eventData.row);
    } else if (eventData.action == 'Edit') {
      this.openEditProductModal(eventData.row);
    } else if (eventData.action == 'Disable') {
      this.openDisableModal(eventData.row);
    }
  }

  openDisableModal(row: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Disable USSD';
    this.modalRef.componentInstance.body = `Do you want to disable USSD for ${row.IMSINumber}?`;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Disabled Successfully',
          'IMSI has been disabled successfully.',
          'success').then(r => this.getIndividualData(0))
      } else {
        console.log("Error occurred")
      }
    });
  }
}
