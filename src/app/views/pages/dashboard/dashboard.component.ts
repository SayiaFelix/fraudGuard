import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component,ViewChild,  ElementRef,OnInit,ChangeDetectorRef, Pipe } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NgbDateStruct, NgbCalendar, NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CustomValidators } from 'ngx-custom-validators';
import { Observable, map, of } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { DatePipe, formatDate } from '@angular/common';
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component';
declare var bootstrap: any
import { forkJoin } from 'rxjs';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { AddCustomerComponent } from '../mobile-banking/customers/add-customer/add-customer.component';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { FilesizePipe } from '../mobile-banking/customers/list-customers/list-customers.component';

// interface Message {
//   text: string;
//   sender: "user" | "bot";
//   isAttention?: boolean;  
// }
// interface to match the API response

interface ConversationMessage {
  sender: 'user' | 'bot';
  text: string;
  type?: 'text' | 'file';
  time: string;
  fileUrl?: string; 
  isFileResponse?: boolean;
  isWelcomeMessage?: boolean;
  isGeneratingReport?: boolean;
  status?: 'sending' | 'delivered' | 'error' | 'received' | 'pending' | 'approved' | 'rejected' | 'loading';
  isLoading?: boolean;
  isError?: boolean;
  formattedText?: string;
  datasetId?: string;
  fileData?: {
    filename: string;
    size: number;
    format?: string;
    downloadUrl?: string;
    mimeType?: string;
    content?: string;
    profile?: {
      overview: any;
      column_types: any;
      missing_data: {
        total_missing: number;
        pct_missing: number;
        columns_with_missing: number;
        missing_value_distribution: {
          columns: { [key: string]: number };
          top_5_columns_with_most_missing: { [key: string]: number };
        };
      };
      sample_data: any[];
    };
    analysis?: string;
    message?: string;
  };
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  preserveWhitespaces: true,
  providers: [FilesizePipe, DatePipe],
})
export class DashboardComponent implements OnInit {
  @ViewChild('chatArea') private chatArea!: ElementRef;
  @ViewChild('chatContainer') private chatContainer!: ElementRef;



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
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet16',
    },
    {
      id: 'dashboard2',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet17',
    },
  ];



  paginatedDashboards: { id: string; src: string }[] = [];
  currentPage = 0;
  itemsPerPage = 4;
  chatStarted = false; 

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
  isTyping: boolean = false;
  conversation: ConversationMessage[] = [
    {
      sender: 'bot',
      text: "Welcome to ECL AICX. How can I assist you today?",
      isWelcomeMessage: true,
      time: this.getCurrentTime()
    }
  ];
currentDate: string = formatDate(new Date(), 'MMM d, y', 'en-US');


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
  currentFileData: any;
  currentDatasetId: any;
  isDragover = false;
  isErrorState = false;
  currentColumnStart = 0;
  columnsPerPage = 6;

  shouldGenerateReport = false;
  reportFormat: 'pdf' | 'excel' = 'pdf';
  reportDownloadUrl: string | null = null;
  username: string | null;



  constructor(
    private cdRef: ChangeDetectorRef,
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
      phone_number: ["", Validators.compose([Validators.required])],
    });

    this.formR = fb.group({
      reason: ['', Validators.required],
    });
  }

  ngOnInit() {

  const firstName = localStorage.getItem('first_name');
  this.username = firstName || 'User';
  this.appealDate = new Date();
}

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  getCapitalizedName(): string {
  if (!this.username) return 'User';
  return this.username.charAt(0).toUpperCase() + this.username.slice(1).toLowerCase();
}

startChat(message: string) {
  this.chatStarted = true;
  this.sendMessage(message);
}

private getCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

sendMessage(query?: string) {
    this.isLoading = true;
    const userId = localStorage.getItem('user_id'); 
    this.isTyping = true;

  if (query) {
    this.userQuery = query;
  }

  if (this.userQuery.trim() === '') {
    this.isLoading = false;
    return;
  }

  if (!this.chatStarted) {
      this.chatStarted = true;
    }

  this.conversation.push({
    sender: 'user',
    text: this.userQuery,
    time: this.getCurrentTime(),
  });

  const payload = {
    user_id: userId, 
    message: this.userQuery
  };

  console.log('Payload:', payload);

  this.httpService.mobileBankingPost('assistant/knowledge', payload)
    .subscribe({
      next: (response : any) => {
        this.isLoading = false;
         this.isTyping = false;

        const botMessage = response?.response || response?.data || 'No response from server';

        this.conversation.push({
          sender: 'bot',
          text: botMessage,
          formattedText: this.formatResponse(botMessage),
          time: this.getCurrentTime(),
        });

        this.cdRef.detectChanges();
        this.scrollToBottom();
      },
      error: (error : any) => {
        this.isLoading = false;
         this.isTyping = false;
        this.conversation.push({
          sender: 'bot',
          text: 'Sorry, I encountered an error processing your request.',
          time: this.getCurrentTime(),
        });
        this.cdRef.detectChanges();
        this.scrollToBottom();
        console.error('Chat error:', error);
      }
    });

  this.userQuery = '';
}

  getMimeType(filename: string): string {
    if (filename.endsWith('.pdf')) {
      return 'application/pdf';
    } else if (filename.endsWith('.xlsx')) {
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (filename.endsWith('.xls')) {
      return 'application/vnd.ms-excel';
    }
    return 'application/octet-stream';
  }

  downloadReport(content: string, filename: string) {
    const blob = this.base64ToBlob(content, this.getMimeType(filename));
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  viewReport(content: string, filename: string) {
    const blob = this.base64ToBlob(content, this.getMimeType(filename));
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  }


  formatResponse(text: string): string {
    if (!text) return '';

    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    let formatted = escaped.replace(/^(\d+)\.\s+(.*)$/gm, '<li class="numbered">$2</li>');
    formatted = formatted.replace(/^[-*]\s+(.*)$/gm, '<li class="bulleted">$1</li>');
    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(
      /(<li class="numbered">.*?<\/li>(?:\s*<li class="numbered">.*?<\/li>)+)/gs,
      match => `<ol>${match}</ol>`
    );

    formatted = formatted.replace(
      /(<li class="bulleted">.*?<\/li>(?:\s*<li class="bulleted">.*?<\/li>)+)/gs,
      match => `<ul>${match}</ul>`
    );

    return formatted
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/<p><\/p>/g, '');
  }

  scrollToBottom() {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }


  formatAnalysisContent(content: string): string {
    return content ? content.replace(/\n/g, '<br>') : '';
  }



  parseAnalysis(analysis?: string): any[] {
    if (!analysis) return [];

    const sections = analysis.split('\n\n');
    return sections.map(section => {
      const titleMatch = section.match(/^\d+\.\s+(.*?)\n/);
      return {
        title: titleMatch ? titleMatch[1] : 'Analysis',
        content: titleMatch ? section.replace(titleMatch[0], '') : section
      };
    });
  }

onFileSelected(event: any) {
  const file: File = event.target.files[0];
  if (file) {
    const fileUrl = URL.createObjectURL(file);

    this.conversation.push({
      sender: 'user',
      type: 'file',
      text: file.name,
      fileUrl: fileUrl,
      time: this.getCurrentTime(),
    });

    // TODO: if you want to send the file to backend, handle upload here
    console.log('Selected file:', file);

    this.scrollToBottom();
  }
}


  onFileSelectedss(event: Event) {
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
    // this.isLoading = true;
    if (!this.selectedFile) {
      this.uploadMessage = 'Please select a file first';
      this.isErrorState = true;
      return;
    }


    this.isUploading = true;
    this.isErrorState = false;
    this.uploadMessage = `Uploading ${this.selectedFile.name} (${this.formatFileSize(this.selectedFile.size)})...`;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post('http://130.61.111.65:5015/api/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          this.uploadProgress = progress;
        } else if (event.type === HttpEventType.Response) {
          try {
            // Process successful upload
            const response = event.body as any;

            // this.isLoading = false;
            this.currentFileData = response.data;
            this.currentDatasetId = response.data.dataset_id;
            this.uploadProgress = 100;
            this.uploadMessage = response.message;
            this.isUploading = false;
            this.showUpload = false;

            // Update conversation
            this.conversation.push({
              sender: 'bot',
              text: `I've analyzed your file: ${response.data.filename}`,
              time: this.getCurrentTime(),
              isFileResponse: true,
              datasetId: this.currentDatasetId,
              fileData: {
                filename: response.data.filename,
                size: response.data.size,
                profile: response.data.profile,
                analysis: response.data.analysis_summary,
                message: 'Data analysis complete !!!'
              }
            });

            this.shouldScroll = true;
            this.selectedFile = null;
            this.uploadProgress = 0;

            // Clear file input
            const fileInput = document.getElementById('fileInput') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

          } catch (e) {
            console.error('Processing error:', e);
            this.handleUploadError({
              error: e,
              message: 'Failed to process server response',
              status: 200,
              statusText: 'OK'
            });
          }
        }
      },
      error: (error) => {
        this.handleUploadError(error);
      }
    });
  }


  handleUploadSuccess(response: any) {
    this.isLoading = false;
    this.currentFileData = response;
    this.uploadProgress = 100;
    this.uploadMessage = response.message || 'File uploaded successfully';
    this.isUploading = false;
    this.showUpload = false;

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
  }

  handleUploadError(error: any) {
    this.isLoading = false;
    this.isUploading = false;
    this.isErrorState = true;

    let errorMessage = 'Upload failed';

    if (error.status === 200) {
      errorMessage = 'Server returned invalid data format';
      console.error('Parsing error details:', error.error);
    } else if (error.status === 413) {
      errorMessage = 'File too large (max 1GB)';
    } else if (error.message) {
      errorMessage = error.message;
    }

    this.uploadMessage = errorMessage;
    this.uploadProgress = 0;
  }

  // UI helpers
  toggleUpload() {
    this.showUpload = !this.showUpload;
    this.uploadMessage = '';
  }

  clearConversation() {
    this.conversation = [{
      sender: 'bot',
      text: 'Welcome to Quantra, the AI-powered solution for Financial insights. Upload your data for insights ...',
      time: this.getCurrentTime()
    }];
    this.uploadMessage = '';
    this.currentDatasetId = null;
    this.shouldScroll = true;
  }

  // private getCurrentTime(): string {
  //   return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // }


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

  getSummaryStats(value: any): { key: string, value: any }[] {
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

  getMissingValueColumns(missingData: any): { key: string, value: number }[] {
    if (!missingData) return [];
    return Object.entries(missingData).map(([key, value]) => ({
      key: key,
      value: Number(value)
    }));
  }

  // Helper to extract missing columns
  getMissingColumns(missingData: any): { key: string, value: number }[] {
    return Object.keys(missingData).map(key => ({
      key: key,
      value: missingData[key]
    }));
  }

  getSampleDataColumns(): string[] {
    if (!this.currentFileData?.profile?.sample_data ||
      !this.currentFileData?.profile?.missing_data) return [];

    const sampleData = this.currentFileData.profile.sample_data;
    const missingValues = this.currentFileData.profile.missing_data.missing_value_distribution.columns;
    const totalRows = this.currentFileData.profile.overview.num_rows;
    const threshold = 0.8 * totalRows;

    return Object.keys(sampleData[0]).filter(column => {
      const missingCount = missingValues[column] || 0;
      return missingCount <= threshold;
    });
  }


  isLastMessage(messageItem: any): boolean {
    return this.conversation[this.conversation.length - 1] === messageItem;
  }

  formatColumnHeader(header: string): string {
    return header.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
  }

  getCellClasses(column: string, value: any): any {
    return {
      'numeric': typeof value === 'number',
      'null-value': value === null,
      'status': column.toLowerCase().includes('status'),
      'status-active': column.toLowerCase().includes('status') && value?.toString().toLowerCase() === 'active',
      'status-closed': column.toLowerCase().includes('status') && value?.toString().toLowerCase() === 'closed',
      'status-performing': column.toLowerCase().includes('status') && value?.toString().toLowerCase() === 'performing'
    };
  }


  formatCellValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value.toString();
  }


  getHiddenColumnsCount(): number {
    if (!this.currentFileData?.profile?.sample_data ||
      !this.currentFileData?.profile?.missing_data) return 0;

    const sampleData = this.currentFileData.profile.sample_data;
    const missingValues = this.currentFileData.profile.missing_data.missing_value_distribution.columns;
    const totalRows = this.currentFileData.profile.overview.num_rows;
    const threshold = 0.8 * totalRows;

    return Object.keys(sampleData[0]).filter(column => {
      const missingCount = missingValues[column] || 0;
      return missingCount > threshold;
    }).length;
  }

  getHiddenColumns(): string[] {
    if (!this.currentFileData?.profile?.sample_data ||
      !this.currentFileData?.profile?.missing_data) return [];

    const sampleData = this.currentFileData.profile.sample_data;
    const missingValues = this.currentFileData.profile.missing_data.missing_value_distribution.columns;
    const totalRows = this.currentFileData.profile.overview.num_rows;
    const threshold = 0.8 * totalRows;

    return Object.keys(sampleData[0]).filter(column => {
      const missingCount = missingValues[column] || 0;
      return missingCount > threshold;
    });
  }



  handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = true;
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;

    if (event.dataTransfer?.files) {
      const input = document.getElementById('fileInput') as HTMLInputElement;
      input.files = event.dataTransfer.files;
      this.onFileSelected({ target: input } as unknown as Event);
    }
  }

  get visibleColumns(): string[] {
    return this.getSampleDataColumns().slice(this.currentColumnStart, this.currentColumnStart + this.columnsPerPage);
  }

  get totalColumns(): number {
    return this.getSampleDataColumns().length;
  }

  showNextColumns(): void {
    if (this.currentColumnStart + this.columnsPerPage < this.totalColumns) {
      this.currentColumnStart += this.columnsPerPage;
    }
  }

  showPreviousColumns(): void {
    this.currentColumnStart = Math.max(0, this.currentColumnStart - this.columnsPerPage);
  }

  hasNextColumns(): boolean {
    return this.currentColumnStart + this.columnsPerPage < this.totalColumns;
  }

  hasPreviousColumns(): boolean {
    return this.currentColumnStart > 0;
  }
  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

};
