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
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { GlobalService } from '../../../../../shared/services/global.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxDatatableComponent } from '../../../tables/ngx-datatable/ngx-datatable.component';
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { HttpService } from 'src/app/shared/services/http.service';
import { AddCustomerComponent } from "../add-customer/add-customer.component";
import { CustomValidators } from 'ngx-custom-validators';
import Swal from 'sweetalert2';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
// import {ChannelDetailsWrapper} from "../../../../../shared/services/channelDetailsWrapper";
// import {AddAccountComponent} from "../../Accounts/AccountRegistration/add-account/add-account.component";

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
  actions = ["View", "Edit"]
  // URL of the brochure file you want to download
  private brochureUrl = 'assets/images/certificate.png';
  // Store the sanitized URL
  public downloadLink: SafeUrl;

  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  errorMessage: string;
  modalRef: NgbModalRef;
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
    { name: 'Phone Number', prop: 'phone_number' },
    { name: 'Email', prop: 'email' },
    { name: 'Identification', prop: 'identification' },
    { name: 'Wallet Account', prop: 'wallet_account' },
    { name: 'Status', prop: 'active' },
    { name: 'Actions', prop: 'id' },
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  showLeaveCommentForm: boolean = false;

  title: string = "New Customer";
  total: any;
  results: any = [];


  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private datePipe: DatePipe,
    private sanitizer: DomSanitizer,
    private dataExploration: DataExportationService
  ) {
    // Sanitize the brochure URL to make it safe for use in the anchor element
    // this.downloadLink = this.sanitizer.bypassSecurityTrustUrl(this.brochureUrl);
    this.downloadLink = '';
    this.form = fb.group({
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['', Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      name: ["", Validators.compose([Validators.required])],
      phoneNumber: ["", Validators.compose([Validators.required])],
    });
  }

  ngOnInit() {

    this.getIndividualData(0);
    this.loadData();

    this.form = this.fb.group({
      email: ['',Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['',Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      name: ["", Validators.compose([Validators.required])],
      phoneNumber: ["", Validators.compose([Validators.required])],
    });
  }
  onleaveComment() { }
  openModal(modalContent: any) {
    this.modalRef = this.modalService.open(modalContent, { centered: true, size: "md" });
  }
  getIndividualData(event: number): void {

    this.loading = true;


    let payload = {
      page: 0,
      size: 1000
    }

    this.httpService
      .mobileBankingPostNest('customers/getAllCustomers?walletAccountAvailable=true', payload)
      .subscribe((res: any) => {
        if (res.status === 201) {
          setTimeout(() => {

            let response = res['data'].filter((i: any) => i.walletAccount !== "").map((item: any, index: any) => {
              let res = {
                ...item,
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


  toggleLeaveCommentForm() {
    if (this.showLeaveCommentForm) {
      this.hideLeaveCommentForm();
    } else {
      this.showLeaveCommentForm = true;
    }
  }
  hideLeaveCommentForm() {
    this.showLeaveCommentForm = false;
  }

  private loadData(): any {
    this.loading = true;
    this.httpService.customerPortalPost(`api/v1/portal/getResults`, {}).subscribe(
      (res: any) => {

        if (res.status == '00') {
          this.results = res['data'];
          console.log(this.results)
          this.loading = false;
        } else {
          Swal.fire('Failed', "Unable to fetch results", 'error')
        }
      }, (error: any) => {
        Swal.fire("Error", error.message, "error");
      });
  }

  formatDate(date: string): string {
    const formattedDate = this.datePipe.transform(date, 'dd MMM yyyy');
    return formattedDate ? formattedDate.toUpperCase() : '';
  }

  getSanitizedStatusImage(status: string): any {
    switch (status) {
      case 'Passed':
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/approve.png');
      case 'Failed':
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/fail.png');
      case 'Appealed':
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/time.png');
      // Add more cases for other status if needed
      default:
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/Vector.png');
    }
  }

  handleDownload(result: any) {
    if (result.id === 1) {
      this.downloadLink = this.sanitizer.bypassSecurityTrustUrl('assets/images/ns.jpg');
    } else if (result.id === 2) {
      this.downloadLink = this.sanitizer.bypassSecurityTrustUrl('assets/images/serena.jpeg');
    } else {
      this.downloadLink = this.sanitizer.bypassSecurityTrustUrl('assets/images/certificate.png');
    }

    // Rest of your raiseAppeal() function code...
  }

  // Define a helper function to get the appropriate text for the raiseAppeal button
  getAppealButtonText(status: string, requestType: string): string {
    if (requestType === 'CLASSIFICATION') {
      return 'Create Appeal';
    } else {
      if (status === 'Passed') {
        return 'Appeal Accepted';
      } else if (status === 'Failed') {
        return 'Create Appeal';
      } else if (status === 'Appealed') {
        return 'Already Appealed';
      } else {
        return 'Unknown Status'; // Handle other statuses if needed
      }
    }
  }
  raiseAppeal(id: number, status: string, requestType: string): void {
    console.log(id)
    console.log(status)
    console.log(requestType)
    this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true });
    this.modalRef.componentInstance.title = 'RAISE AN APPEAL';
    this.modalRef.componentInstance.body = 'Do you want to APPEAL for this Request?';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.httpService
          .customerPortalPost(`api/v1/portal/appeal/${id}`, {
            id: id,
            status: status,
            requestType: requestType,
          })
          .subscribe((result: any) => {
            if (result.status === '00') {
              Swal.fire('Appealed', 'Request Appeal Raised Successfully.', 'success');
              this.loadData();
            } else {
              // Handle the error if needed
            }
          });
      } else {
        console.log('Error occurred');
      }
    });
  }

  isButtonDisabled(status: string, requestType: string): boolean {
    if (requestType === 'CLASSIFICATION') {
      // For CLASSIFICATION request type, the button is always enabled
      return false;
    } else {
      // For other request types, check the status
      return status === 'Passed' || status === 'Appealed';
    }
  }
  openAddProductModal() {
    this.modalRef = this.modalService.open(AddCustomerComponent, { centered: true, size: "lg" });
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
  openEditProductModal(data: any) {
    this.modalRef = this.modalService.open(AddCustomerComponent, { centered: true });
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
  triggerEvent(data: any) {
    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this.navigateToViewProduct(eventData.row);
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
