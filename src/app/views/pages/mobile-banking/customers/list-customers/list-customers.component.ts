import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ColumnMode } from '@swimlane/ngx-datatable';

import { GlobalService } from '../../../../../shared/services/global.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxDatatableComponent } from '../../../tables/ngx-datatable/ngx-datatable.component';
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { HttpService } from 'src/app/shared/services/http.service';
import {AddCustomerComponent} from "../add-customer/add-customer.component";
import {ChannelDetailsWrapper} from "../../../../../shared/services/channelDetailsWrapper";
import {AddAccountComponent} from "../../Accounts/AccountRegistration/add-account/add-account.component";

@Component({
  selector: 'app-list-requests',
  templateUrl: './list-customers.component.html',
  styleUrls: ['./list-customers.component.scss'],
  providers: [DatePipe],
})

/**
 * Starter-component
 */
export class ListCustomersComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  actions=["View", "Edit"]

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  filteredRows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  columns = [
    { name: '#', prop: 'id' },
    { name: 'Customer Name', prop: 'name' },
    {name:'Phone Number',prop:'phoneNumber'},
    { name: 'Wallet Account', prop: 'walletAccount' },
    {name: 'Id Type.',prop:'identificationType'},
    {name: 'Identification',prop:'identification'},
    {name: 'Email',prop:'email'},
    { name: 'Actions', prop: 'id' },
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "New Customer";
  total: any;


  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService
  ) {}

  ngOnInit() {
    this.breadCrumbItems = [
      {
        label: 'Mobile banking',
        path: '/mobile-banking/products/all-customers',
      },
      { label: 'Pages', path: '/' },
      { label: 'Customers', active: true },
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

    let model = ChannelDetailsWrapper.channelDetailsWrapper;

    model.payload = {
      page: 0,
      size: 1000
    }

    this.httpService
      .mobileBankingPostUpdated('api/v1/kyc/portal/get-customers', model)
      .subscribe((res: any) => {
        if (res.status === '00') {
          setTimeout(() => {

            let response = res['data'].filter((i: any) => i.walletAccount !== "").map((item: any, index: any) => {
              let res = {...item,
                frontendId: index + 1
              };
              return res;
            })
            this.rows = response;

            this.total = res.metadata.numofrecords;
          }, 10);
        } else {
        }
      });

    this.loading = false;

  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true,size:"lg"});
    this.modalRef.componentInstance.title = 'Add New Customer';
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
    this.router.navigateByUrl(`/mobile-banking/customers/customer/${data.id}`);
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
  openEditProductModal(data:any){
    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Customer';
    this.modalRef.componentInstance.formData = "";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }
  triggerEvent(data:any){
    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this. navigateToViewProduct(eventData.row);
    }
    else if (eventData.action == 'Edit') {
      this.openEditProductModal(eventData.row);
    }
  }

  updateFilteredRowsEvent(data: string) {
    console.log(data);

    this.filteredRows = data
  }
}
