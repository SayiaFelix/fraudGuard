import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ColumnMode, DatatableComponent} from '@swimlane/ngx-datatable';
import {ConfirmDialogComponent} from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-list-failed-approval',
  templateUrl: './list-failed-approval.component.html',
  styleUrls: ['./list-failed-approval.component.scss']
})
export class ListFailedApprovalComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  actions = ["View"];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loadingIndicator = true;
  reorderable = true;


  columns = [
    {name: 'ID', prop: 'frontendId'},
    {name: 'Name', prop: 'name'},
    {name: 'Phone No.', prop: 'phoneNumber'},
    {name: 'Account No.', prop: 'accountNumber'},
    {name: 'Account Name', prop: 'accountName'},
    {name: 'Account Status', prop: 'accountStatus'},
    {name: 'Created On', prop: 'createdOn'},
    {name: 'Created By', prop: 'createdBy'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Pending Acc.";

  isLoading = true;

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
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
    });
  }

  getIndividualData(event: number): void {

    this.isLoading = true;

    const model = {
      page: 0,
      size: 50,
      fieldName: "status",
      fieldValue: "FAILED"
    };

    this.httpService
      .mobileBankingPostUpdated('api/v1/mbs/on-board/accounts/all/filter', model)
      .subscribe((res: any) => {
        if (res.status === '00') {
          this.isLoading = false;
          setTimeout(() => {
            this.rows = res.data;

            let response = this.rows.map((item: any, index: any) => {
              let res = {
                ...item,
                createdBy: item.createdBy ? item.createdBy : "_",
                createdOn: new Date(item.createdOn).toLocaleDateString('en-US'),
                accountNumber: item.accountNumber ? item.accountNumber : "_",
                accountStatus: item.status,
                frontendId: index + 1
              };
              return res;
            })
            this.rows = response;


            let total = res.totalItems;
          }, 10);
        } else {
        }
      });
    this.isLoading = false;

  }

  openRejectModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Reject Account';
    this.modalRef.componentInstance.body = "Do you want to reject this account?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Rejected Successfully', 'Account has been rejected  successfully.', 'success')
          .then
          (r => this.getIndividualData(0))
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openApproveModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Approve Account';
    this.modalRef.componentInstance.body = "Do you want to approve this account?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Approval Successfully', 'Account has been approved successfully.', 'success')
          .then
          (r => this.getIndividualData(0))
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  // openAddProductModal() {

  //   this.modalRef = this.modalService.open(AddAccountComponent, {centered: true});
  //   this.modalRef.componentInstance.title = 'Add Account';
  //   this.modalRef.result.then((result) => {
  //     if (result === 'success') {
  //       this.getIndividualData(0);
  //     } else {
  //       console.log("Error occurred")
  //     }
  //   });
  // }


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
      this.navigateToViewFailDetails(eventData.row);
    } else if (eventData.action == 'Reject') {
      this.openRejectModal(eventData.row);
    }

  }

  navigateToViewFailDetails(data: any) {
    this.router.navigateByUrl(`mobile-banking/customers/reason/${data.id}`);
  }


}
