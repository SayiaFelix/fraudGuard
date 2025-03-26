import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,ElementRef, AfterViewChecked,Pipe, PipeTransform
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
import { HttpClient } from '@angular/common/http';
// import {ChannelDetailsWrapper} from "../../../../../shared/services/channelDetailsWrapper";
// import {AddAccountComponent} from "../../Accounts/AccountRegistration/add-account/add-account.component";


// Update the interface to match the API response
interface ConversationMessage {
  sender: string;
  text: string;
  time: string;
  isFileResponse?: boolean;
  fileData?: {
    filename: string;
    size: number;
    profile?: {
      overview: any;
      column_types: any;
      missing_data: {
        total_missing: number;
        pct_missing: number;
        columns_with_missing: number;
        missing_value_distribution: {
          columns: {[key: string]: number};
          top_5_columns_with_most_missing: {[key: string]: number};
        }
      };
      sample_data: any[];
    };
    message?: string;
  };
}

@Pipe({
  name: 'filesize'
})

export class FilesizePipe implements PipeTransform {
  transform(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
}


@Component({
  selector: 'app-list-requests',
  templateUrl: './list-customers.component.html',
  styleUrls: ['./list-customers.component.scss'],
  providers: [FilesizePipe,DatePipe],
})

/**
 * Starter-component
 */
export class ListCustomersComponent implements OnInit {
  @ViewChild('chatArea') private chatArea!: ElementRef;
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
  showAppeals: boolean = false;

  dashboards: { id: string; src: string }[] = [
    {
      id: 'dashboard1',
      src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet16',
    },
    {
      id: 'dashboard2',
      src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet17',
    },
  ];
  


  paginatedDashboards: { id: string; src: string }[] = [];
  currentPage = 0;
  itemsPerPage = 4;

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
  public formR: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  showLeaveCommentForm: boolean = false;
  title: string = "New Customer";
  total: any;
  results: any[] = [];
  appealId: number;
  appealData: any;
  resultRef: string | null = null;

  // Then update your component property:
conversation: ConversationMessage[] = [
  {
    sender: 'bot',
    text: 'Hello! I\'m your AI-powered financial assistant. I can help analyze your financial data, answer questions about loans, investments, and more. You can also upload documents for me to analyze.',
    time: this.getCurrentTime()
  }
];

  userQuery: string = '';
  private shouldScroll = true;
  botResponse: string = '';

  // File upload properties
  showUpload: boolean = false;
  uploadMessage: string = '';
  selectedFile: File | null = null;
  readonly allowedFileTypes = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  readonly maxFileSize = 1024 * 1024 * 1024; // 1GB
  uploadProgress: number = 0;
  isUploading: boolean = false;


  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    private http: HttpClient,
    public router: Router,
    private datePipe: DatePipe,
    private sanitizer: DomSanitizer,
    public activeModal: NgbActiveModal,
    private dataExploration: DataExportationService,
    private filesizePipe: FilesizePipe,
  ) {
    // this.downloadLink = this.sanitizer.bypassSecurityTrustUrl(this.brochureUrl);
    this.downloadLink = '';
    this.form = fb.group({
      name: ["", Validators.compose([Validators.required])],
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['', Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      phone_number: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
    });

    this.formR = fb.group({
      reason: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.updatePagination()
    this.loadData();
    this.loadAppealsData()

    this.appealDate = new Date();
    // this.isAppealButtonVisible = this.calculateAppealButtonVisibility();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendMessage() {
    if (this.userQuery.trim() === '') return;

    // Add user message
    this.conversation.push({
      sender: 'user',
      text: this.userQuery,
      time: this.getCurrentTime()
    });
    this.shouldScroll = true;

    // Call your HTTP service
    this.http.post<any>('http://localhost:5015/api/chat', { query: this.userQuery }).subscribe({
      next: (response) => {
        this.conversation.push({
          sender: 'bot',
          text: response.response,
          time: this.getCurrentTime()
        });
        this.shouldScroll = true;
      },
      error: (error) => {
        this.conversation.push({
          sender: 'bot',
          text: 'Sorry, I encountered an error processing your request.',
          time: this.getCurrentTime()
        });
        this.shouldScroll = true;
        console.error('Chat error:', error);
      }
    });

    this.userQuery = '';
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.chatArea.nativeElement.scrollTop = this.chatArea.nativeElement.scrollHeight;
      }, 100);
    } catch(err) {
      console.error('Scroll error:', err);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.uploadMessage = 'No file selected';
      this.selectedFile = null;
      return;
    }

    const file = input.files[0];
    
    // Validate file type
    if (!this.allowedFileTypes.includes(file.type)) {
      this.uploadMessage = 'Invalid file type. Please upload PDF, CSV, or Excel files.';
      this.selectedFile = null;
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.uploadMessage = `File too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}.`;
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    this.uploadMessage = `Selected: ${file.name} (${this.formatFileSize(file.size)})`;
    this.uploadProgress = 0;
  }

  uploadFile() {
    if (!this.selectedFile) {
      this.uploadMessage = 'Please select a file first';
      return;
    }

    this.isUploading = true;
    this.uploadMessage = `Uploading ${this.selectedFile.name} (${this.formatFileSize(this.selectedFile.size)})...`;
    
    // Simulate progress for demonstration
    const progressInterval = setInterval(() => {
      this.uploadProgress = Math.min(this.uploadProgress + 5, 95);
    }, 300);

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post<any>('http://localhost:5015/api/upload', formData).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.uploadMessage = response.message;
        this.isUploading = false;
        this.showUpload = false;
        
        // // Add file response to conversation
        // this.conversation.push({
        //   sender: 'bot',
        //   text: `I've processed your file: ${response.filename}`,
        //   time: this.getCurrentTime(),
        //   isFileResponse: true,
        //   fileData: response
        // });

        this.conversation.push({
          sender: 'bot',
          text: `I've analyzed your file: ${response.filename}`,
          time: this.getCurrentTime(),
          isFileResponse: true,
          fileData: {
            filename: response.filename,
            size: response.size,
            profile: response.profile,
            message: 'Data analysis complete'
          }
        });
        
        this.shouldScroll = true;
        this.selectedFile = null;
        this.uploadProgress = 0;
        
        // Clear file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.uploadMessage = 'Upload failed. Please try again.';
        this.isUploading = false;
        this.uploadProgress = 0;
        console.error('Upload error:', error);
      }
    });
  }

  // UI helpers
  toggleUpload() {
    this.showUpload = !this.showUpload;
    this.uploadMessage = '';
  }

  clearConversation() {
    this.conversation = [{
      sender: 'bot',
      text: 'Hello! I\'m your AI-powered financial assistant. How can I help you today?',
      time: this.getCurrentTime()
    }];
    this.uploadMessage = '';
    this.shouldScroll = true;
  }

  private getCurrentTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }


  // Add these methods to your ListCustomersComponent class
getSummaryColumns(summary: string): any[] {
  try {
    const data = JSON.parse(summary);
    return Object.keys(data).map(key => ({
      key: key,
      value: data[key]
    }));
  } catch (e) {
    console.error('Error parsing summary:', e);
    return [];
  }
}

getSummaryStats(value: any): {key: string, value: any}[] {
  if (!value) return [];
  return Object.entries(value).map(([key, val]) => ({
    key: key,
    value: val
  }));
}

formatNumber(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return String(value);
}

formatFileSize(bytes: number): string {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


// Add these new methods to your component
getMissingValueColumns(missingData: any): {key: string, value: number}[] {
  if (!missingData) return [];
  return Object.entries(missingData).map(([key, value]) => ({
    key: key,
    value: Number(value)
  }));
}

// Helper to extract missing columns
getMissingColumns(missingData: any): {key: string, value: number}[] {
  return Object.keys(missingData).map(key => ({
    key: key,
    value: missingData[key]
  }));
}

// Helper to get column names from sample data
getSampleDataColumns(sampleData: any[]): string[] {
  if (!sampleData || sampleData.length === 0) return [];
  return Object.keys(sampleData[0]);
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


















  updatePagination() {
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDashboards = this.dashboards.slice(startIndex, endIndex);
  }
  
  nextPage() {
    if ((this.currentPage + 1) * this.itemsPerPage < this.dashboards.length) {
      this.currentPage++;
      this.updatePagination();
    }
  }
  
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
    }}
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }
  get fs(): { [p: string]: AbstractControl } {
    return this.formR.controls;
  }
  phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneNumber = control.value;
    const phonePattern = /^(254\d{9}|0\d{9})$/;
    return phonePattern.test(phoneNumber) ? null : { invalidPhoneNumber: true };
  }
  
  onleaveComment() {
    this.isLoading = true;
    const model = {
      name: this.form.value.name,
      phone_number: this.form.value.phone_number,
      subject: this.form.value.subject,
      message: this.form.value.message,
      email: this.form.value.email,
    };
    // console.log(model)
    this.httpService.customerPortalPost(`api/v1/auth/customerEnquirer`, model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.hideLeaveCommentForm();
          this.loadData()
          Swal.fire('Customer Enquire Successfully',
            'success').then(r => console.log(r))
        } else {
          this.hideLeaveCommentForm();
          Swal.fire('Customer Enquire  Failed, Try Again',
            'error').then(r => console.log(r))
            this.isLoading = false;
        }
      },
      (error: any) => {
        this.hideLeaveCommentForm();
        Swal.fire('Customer Enquire error',
          'error')
          this.isLoading = false;
      }
    );
  }
  openModal(modalContent: any) {
    this.modalRef = this.modalService.open(modalContent, { centered: true, size: "md" });
  }

  calculateAppealButtonVisibility(result: any): boolean {
    const timeLimitInDays = 14;
    const currentTime = new Date();
    const daysElapsed = Math.floor((currentTime.getTime() - new Date(result.created_on).getTime()) / (1000 * 60 * 60 * 24));

    if (result.hasAppeal || result.appealStatus === 'PENDING' || result.appealStatus === 'APPROVED' || result.appealStatus === 'REJECTED') {
      result.isButtonDeactivated = true; // Deactivate the button if there is an appeal or if the appeal status is 'PENDING'
    } else {
      result.isButtonDeactivated = daysElapsed > timeLimitInDays; // Deactivate the button only if no appeal for this result within the time limit
    }

    return true; // Always return true to make the button visible
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
    this.form.reset()
  }

  private loadAppealsData(): void {
    let licence_number = JSON.parse(localStorage.getItem('data')!)['licenceNumber'];
    let model = {
      licence_number
    }
    this.httpService.customerPortalPost(`api/v1/portal/getAppeals`, model).subscribe(
      (res: any) => {
        if (res.status === '00') {
          this.appealData = res.data;
          // console.log(this.appealData)

          this.loadData();

        } else {
          console.log('Failed', "Unable to fetch appeals data", 'error');
        }
      }, (error: any) => {
        console.log("Error", error.message, "error");
      });
  }
  private loadData(): any {
    this.loading = true;
    let licenceNumber = JSON.parse(localStorage.getItem('data')!)['licenceNumber'];
    let model = {
      licenceNumber
    };
  
    this.httpService.customerPortalPost(`api/v1/portal/getResultsByLicence`, model).subscribe(
      (res: any) => {
        if (res.status == '00') {
          const result = res.data.filter((request: any) => request.status === "PUBLISHED" || request.status === "APPEALED");
  
          // Collect result_ref values into an array
          const resultRefs = result.map((request: any) => request.result_ref);
  
          this.resultRef = resultRefs.join(', '); // Join the array into a string with commas
          const appealData = this.appealData || [];
  
          result.forEach((request: any) => {
            const appealStatus = appealData.find((appeal: any) => appeal.result_ref === request.result_ref)?.status;
            request.appealStatus = appealStatus || null;
            // console.log('Appeal Status',appealStatus)
            // console.log('Results Ref', request.result_ref)
          });
  
          this.results = result;
          this.loading = false;
  
          // Split the resultRef string into an array
          const resultRefArray = this.resultRef?.split(', ');
          resultRefArray?.forEach((resultRef: string) => {
            console.log(resultRef);
          });
        } else {
          console.log('Failed', "Unable to fetch results", 'error');
        }
      },
      (error: any) => {
        console.log("Error", error.message, "error");
      }
    );
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
    if (result && result.download_url) {
      const downloadUrl = result.download_url;
      const absoluteDownloadUrl = downloadUrl.startsWith('http') ? downloadUrl : `http://${downloadUrl}`;

      // Trigger the file download using HttpClient
      this.http.get(absoluteDownloadUrl, { responseType: 'blob' }).subscribe(
        (blob: Blob) => {
          // Create a new anchor element
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);

          // Set the 'download' attribute to force the download instead of navigation
          link.setAttribute('download', 'downloaded_file');

          // Append the link to the DOM and trigger a click event to initiate the download
          document.body.appendChild(link);
          link.click();

          // Remove the link from the DOM after the download is complete
          document.body.removeChild(link);
        },
        (error) => {
          console.error('Error downloading the file:', error);
        }
      );
    } else {
      console.error('Download URL is not available in the result object.');
    }
  }


  downloadCertificate(fileUrl: string) {
    const normalizedFileUrl = fileUrl.replace("10.20.2.19:7600", "https://test-api.ekenya.co.ke/tra-backend");
    // console.log(normalizedFileUrl);
    const link = document.createElement('a');
    link.href = normalizedFileUrl;
    link.target = '_blank';
    link.click();
  }

  getAppealButtonText(status: string, appealStatus: string | null): string {
    if (appealStatus === 'PENDING') {
      return 'Appealled'; // If appealStatus is 'PENDING', show 'Appealed'
    } else if (appealStatus === 'APPROVED') {
      return 'Accepted';
    } else if (appealStatus === 'REJECTED') {
      return 'Failed';
    } else if (status === 'PUBLISHED') {
      return 'Appeal';
    } else if (status === 'APPEALED') {
      return 'Already Appealed';
    } else {
      return 'Unknown Status';
    }
  }

  hideAppealForm() {
    this.showAppealForm = false;
    this.formR.reset();
  }
  hideAppeals() {
    this.showAppeals = false;
  }

  viewAppeal() {
    if (this.showAppeals) {
      this.hideAppeals();
    } else {
      this.showAppeals = true;
      // this.appealId = id;
    }
  }

  raiseAppeal(id:number): void {
 
    if (this.formR.invalid) {
      return;
    }
  const licenceNumber = JSON.parse(localStorage.getItem('data')!)['licenceNumber']
  const resultRef = this.results.find((result: any) => result.id === id)?.result_ref;
  if (!resultRef) {
    console.log('Unable to find result_ref for the specified id');
    return;
  }
  const model = {
    licenceNumber,
    resultRef,
    reason: this.formR.value.reason,
  };
  this.isLoading = true;
    // console.log(model)
    this.httpService.customerPortalPosts(`/admin/customer/portal/create-appeal`, model).subscribe((result: any) => {
      if (result.status === 200) {
        this.isLoading = false;

        Swal.fire('Appeal Raised Successfully',
          'success').then(r => console.log(r))
        this.loadData()
        this.loadAppealsData()
        this.hideAppealForm();

        // this.appealDate = new Date();
        // this.isAppealButtonVisible = false;
        // this.isViewTrackButtonVisible = true;
      } else {
        this.activeModal.close('error');
        Swal.fire('Raised Apeal Failed, Try Again',
          'error').then(r => console.log(r))
        this.hideAppealForm();
        this.isLoading = true;
      }
    },
      (error: any) => {
        Swal.fire('Raised Appeal error',
          'error')
        this.hideAppealForm();
        this.isLoading = true;
      });
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
        // this.getIndividualData(0);
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
        // this.getIndividualData(0);
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
