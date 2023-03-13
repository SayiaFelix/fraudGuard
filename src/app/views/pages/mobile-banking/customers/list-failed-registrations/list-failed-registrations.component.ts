import {Component, OnInit, ViewChild,} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import {AddCustomerComponent} from "../add-customer/add-customer.component";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import {SwalComponent} from "@sweetalert2/ngx-sweetalert2";
import Swal from "sweetalert2";

@Component({
  selector: 'app-list-failed-registrations',
  templateUrl: './list-failed-registrations.component.html',
  styleUrls: ['./list-failed-registrations.component.scss'],
  providers: [DatePipe],
})

/**
 * Starter-component
 */
export class ListFailedRegistrationsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;

  tempProductData = [
    {
      id: 1,
      mobileNumber: '254708223443',
      account: '1238**3747',
      dob: '12-10-1996',
      attemptedOn: '12-02-2023',
      response: "Failed record Mismatch",
    },
    {
      id: 2,
      mobileNumber: '254708223443',
      account: '1238**3747',
      dob: '12-10-1996',
      attemptedOn: '12-02-2023',
      response: "Failed record Mismatch",
    },
    {
      id: 3,
      mobileNumber: '254708223443',
      account: '1238**3747',
      dob: '12-10-1996',
      attemptedOn: '12-02-2023',
      response: "Failed record Mismatch",
    }
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    {name: 'ID', prop: 'id'},
    {name: 'Mobile Number', prop: 'mobileNumber'},
    {name: 'Account', prop: 'account'},
    {name: 'DOB', prop: 'dob'},
    {name: 'Attempted On', prop: 'attemptedOn'},
    {name: 'Response', prop: 'response'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Failed Registration";

  @ViewChild('mySwal')
  public readonly mySwal!: SwalComponent;
  actions = ["View", "Edit"];

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
      { label: 'Pages', path: '/' },
      { label: 'Products', active: true },
    ];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
    });
  }

  getIndividualData(event: number): void {
    this.rows = this.tempProductData;

    this.temp = [...this.tempProductData];

    const model = {
      page: 0,
      size: 5,
    };

    this.httpService
      .mobileBankingPost('api/v1/corporate/admin/list-products/all', model)
      .subscribe((res: any) => {
        if (res.status === 200) {
          setTimeout(() => {
            // this.data = res.data;
            this.rows = this.tempProductData;
            // let data = this.tempProductData;

            let total = res.totalItems;
          }, 10);
        } else {
        }
      });
  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Categories';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openResetModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Reset Customer';
    this.modalRef.componentInstance.body = 'Do you want to reset this customer?';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Reset Successful',
          'Customer has been reset successfully!',
          'success').then(r => this.getIndividualData(0))
      } else {
        console.log("Error occurred")
      }
    });
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

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {

    }

  }
}
