import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { GlobalService } from '../../../../../shared/services/global.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  isAppealButtonVisible = true;
  isViewTrackButtonVisible = false;

  @ViewChild('table') table: DatatableComponent;
  actions = ["View", "Edit"]
  // URL of the brochure file you want to download
  private brochureUrl = 'assets/images/certificate.png';
  // Store the sanitized URL
  public downloadLink: SafeUrl;
  previewImageUrl: string = '';
  isAppealMade: boolean = false;
  isAppealSubmitted: boolean = false;
  appealDate: Date
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
  showAppealForm: boolean = false;

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
  public forms: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  showLeaveCommentForm: boolean = false;
  title: string = "New Customer";
  total: any;
  results: any = [];
  appealId: number;


  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private datePipe: DatePipe,
    private sanitizer: DomSanitizer,
    public activeModal: NgbActiveModal,
    private dataExploration: DataExportationService
  ) {
    // this.downloadLink = this.sanitizer.bypassSecurityTrustUrl(this.brochureUrl);
    this.downloadLink = '';
    // this.forms = fb.group({
    //   reason: ["", Validators.compose([Validators.required])]
    // });

    this.form = fb.group({
      reason: ['', Validators.required],
      // reason: ["", Validators.compose([Validators.required])],
    });
  }

  ngOnInit() {
    this.getIndividualData(0);
    this.loadData();
    this.loadAppealsData()

    this.appealDate = new Date();
    // this.isAppealButtonVisible = this.calculateAppealButtonVisibility();
  }
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }
  // get fs(): { [p: string]: AbstractControl } {
  //   return this.forms.controls;
  // }
  onleaveComment() { }
  openModal(modalContent: any) {
    this.modalRef = this.modalService.open(modalContent, { centered: true, size: "md" });
  }


  calculateAppealButtonVisibility(result: any): boolean {
    const timeLimitInDays = 14;
    const currentTime = new Date();
    const daysElapsed = Math.floor((currentTime.getTime() - new Date(result.created_on).getTime()) / (1000 * 60 * 60 * 24));
  
    if (result.hasAppeal) {
      return false; // If there is an appeal for this result, hide the "Appeal" button for this result
    }
  
    return daysElapsed <= timeLimitInDays; // Show the "Appeal" button only if no appeal for this result within the time limit
  }
  

  // calculateAppealButtonVisibility(result: any): boolean {
  //   const timeLimitInDays = 14;
  //   const currentTime = new Date();
  //   const daysElapsed = Math.floor((currentTime.getTime() - new Date(result.created_on).getTime()) / (1000 * 60 * 60 * 24));
  
  //   if (result.hasAppeal) {
  //     return false; // If there is an appeal for this result, hide the "Appeal" button for this result
  //   }
  
  //   return daysElapsed <= timeLimitInDays; // Show the "Appeal" button only if no appeal for this result within the time limit
  // }
  

  // calculateAppealButtonVisibility(): boolean {
  //   const timeLimitInDays = 14;
  //   const currentTime = new Date();

  //   // Check if any result has an appeal and if the appeal is within the time limit
  //   for (const result of this.results) {
  //     if (result.hasAppeal) {
  //       return false; // If there is an appeal for this result, hide the "Appeal" button for this result
  //     }
  //     const daysElapsed = Math.floor((currentTime.getTime() - new Date(result.created_on).getTime()) / (1000 * 60 * 60 * 24));
  //     if (daysElapsed <= timeLimitInDays) {
  //       return true; // If no appeal for this result is found within the time limit, show the "Appeal" button for this result
  //     }
  //   }

  //   return false; // If no appeal for any result is found and time limit is exceeded, hide the "Appeal" button for all results
  // }


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

  toggleAppealForm(id: number) {
    if (this.showAppealForm) {
      this.hideLeaveCommentForm();
    } else {
      this.showAppealForm = true;
      this.appealId = id;
    }
  }

  hideLeaveCommentForm() {
    this.showLeaveCommentForm = false;
    this.showAppealForm = false;
  }

  private loadData(): any {
    this.loading = true;
    this.httpService.customerPortalPost(`api/v1/portal/getResults`, {}).subscribe(
      (res: any) => {
        if (res.status == '00') {
          // this.results = res['data'];
          // console.log(this.results);
          const result = res.data.filter((request: any) => request.status === "PUBLISHED");
          console.log(result)
          this.results = result
          this.loading = false;
        } else {
          Swal.fire('Failed', "Unable to fetch results", 'error')
        }
      }, (error: any) => {
        Swal.fire("Error", error.message, "error");
      });
  }

  private loadAppealsData(): void {
    let model = {
      licence_number: "L989077"
    }
    this.httpService.customerPortalPost(`api/v1/portal/getAppeals`, model).subscribe(
      (res: any) => {
        if (res.status === '00') {
          const appealData = res.data;
          console.log(appealData)

          // Check if the user has made an appeal
          // this.isAppealMade = appealData.length > 0;

          // // Check if the appeal has been successfully submitted (you may use a specific field from the backend response)
          // this.isAppealSubmitted = appealData.some((request: any) => request.appealStatus === "PENDING");

          // // Check if 14 days have passed since the user's appeal (assuming appealDate is the field representing the appeal date)
          // const today = new Date();
          // const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000); // Subtract 14 days in milliseconds
          // const isWithin14Days = appealData.some((request: any) => new Date(request.appealDate) >= fourteenDaysAgo);

          // // Update the state of the "Make Appeal" button
          // this.isAppealButtonVisible = !this.isAppealMade || this.isAppealSubmitted || isWithin14Days;

          // Handle the loading of appeals data as required
          // ...

        } else {
          Swal.fire('Failed', "Unable to fetch appeals data", 'error');
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
      case 'PUBLISHED':
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/approve.png');
      case 'PENDING':
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/time.png');
      // Add more cases for other status if needed
      default:
        return this.sanitizer.bypassSecurityTrustResourceUrl('assets/images/star.jpg');
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
  getAppealButtonText(status: string, task_type: string): string {
    if (task_type === 'CLASSIFICATION') {
      return 'Appeal';
    } else {
      if (status === 'APPROVED') {
        return 'Appeal Accepted';
      } else if (status === 'PENDING') {
        return 'Create Appeal';
      } else if (status === 'PUBLISHED') {
        return 'Appeal'
      } else if (status === 'APPEALED') {
        return 'Already Appealed';
      } else {
        return 'Unknown Status';
      }
    }
  }
  hideAppealForm() {
    this.showAppealForm = false;
    this.form.reset();
  }
  viewAppeal() { }
  raiseAppeal(id: number): void {
    if (this.form.invalid) {
      return;
    }
    const model = {
      id,
      reason: this.form.value.reason,
    }
    console.log(model)
    this.httpService.customerPortalPost(`api/v1/portal/appeals`, model).subscribe((result: any) => {
      if (result.status === '00') {
        this.isLoading = false;

        Swal.fire('Appeal Raised Successfully',
          'success').then(r => console.log(r))
        this.loadData()
        this.hideAppealForm();

        console.log(this.results)
        const resultToUpdate = this.results.find((result: any) => result.id === id);
        if (resultToUpdate) {
          // Update the hasAppeal property for the specific result to true
          resultToUpdate.hasAppeal = true;
        }


        this.appealDate = new Date();
        this.isAppealButtonVisible = false;
        this.isViewTrackButtonVisible = true;
      } else {
        this.activeModal.close('error');
        Swal.fire('Raised Apeal Failed, Try Again',
          'error').then(r => console.log(r))
        this.hideAppealForm();
      }
    },
      (error: any) => {
        Swal.fire('Raised Appeal error',
          'error')
        this.hideAppealForm();
      });
  }

  downloadCertificate(): void {
    if (this.previewImageUrl) {
      const certificateUrl = this.previewImageUrl;
      const certificateFileName = 'certificate.png';

      // Extract the relative path from the certificate URL
      const relativePathRegex = /\/\/[^/]+(\/.+)/;
      const matches = certificateUrl.match(relativePathRegex);
      if (!matches || matches.length < 2) {
        console.error('Invalid certificate URL:', certificateUrl);
        return;
      }
      const relativePath = matches[1];

      // Create a Blob from the fetched certificate data and initiate the download
      fetch(relativePath)
        .then((response) => response.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = certificateFileName;
          link.click();
        })
        .catch((error) => {
          console.error('Error fetching the certificate data:', error);
        });
    } else {
      console.error('Certificate data is not available.');
    }
  }

  isButtonDisabled(status: string, task_type: string): boolean {
    if (task_type === 'CLASSIFICATION') {
      return false;
    } else {
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
