import {Component, ElementRef, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ActivatedRoute, Params} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { ColumnMode } from '@swimlane/ngx-datatable';
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {ChannelDetailsWrapper} from "../../../../../shared/services/channelDetailsWrapper";

// --- NEW INTERFACE ---
export interface TrainingItem {
  chatbot_id: number;
  url: string;
  file_name: string | null;
  last_updated: string | null;
  status: string;
  name: string; // Derived property for display
}


@Component({
  selector: 'app-view-customer',
  templateUrl: './view-customer.component.html',
  styleUrls: ['./view-customer.component.scss']
})
export class ViewCustomerComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef;
  breadCrumbItems: Array<{}>;
  rows: any = [];
  channelRows: any = [];
  loadingIndicator = true;
  reorderable = true;
  uploadedFile: File | null = null;
  trainingForm: FormGroup;  
  chatbotId: string;
  showUrlInput = false;
  showCodeInput = false;

  // --- NEW PROPERTIES ---
  existingTraining: TrainingItem[] = [];
  isTrainingLoading = true;

  Transactioncolumns = [
    { name: 'Trans. ID', prop:'TransID' },
    { name: 'Created On', prop:'CreatedOn' },
    {name:'Service Name',prop:'ServiceName'},
    {name:'Account No.',prop:'AccountNo.'},
    {name:'Amount',prop:'Amount'},
    {name:'Charge Amt.',prop:'ChargeAmt'},
    {name:'Res. Code',prop:'Respons'},
  ];

Accountscolumns = [
  { name:'Manufacturer', prop:'manufacturer'},
  { name:'Device Name', prop:'deviceName'},
  { name:'Android Version', prop:'androidVersion'},
  { name:'Acc. Balance', prop:'AccBalance'},
  { name:'Status', prop:'Status'},

];

  channelsColumns = [
    { name: 'Channel', prop: 'channel'},
    { name: 'Created At', prop: 'createdOn'},
    { name: 'Status', prop:'active'},
  ];

  public mainProduct: any;
  public subcategoryTitle: any;

  @Input() formData: any;
  public form: FormGroup;

  public imageFile: File;
  ColumnMode = ColumnMode;
  modalRef: NgbModalRef;

  loading: boolean;
  customerId: any;
  customerDetails: any;
  channelsLoading: boolean = true;
  customerLoading: boolean = true;

  constructor(private httpService: HttpService,
              public globalService: GlobalService,
              public activatedRoute: ActivatedRoute,
              private modalService: NgbModal,
              public fb: FormBuilder,

  ) {
    activatedRoute.queryParams.subscribe(
      params => {
        this.mainProduct = params;
        console.log('queryParams', params);
      });
  }

  ngOnInit(): void {
    this.globalService.chatbotId$.subscribe((chatbotId) => {
    if (chatbotId) {
      this.loadTrainingData();
      console.log("Chatbot ID changed, reloading training data for ID:", chatbotId);
    } else {
      this.existingTraining= [];
    }
  });
    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        this.customerId = params.id;
      }
    });
    
    this.trainingForm = this.fb.group({
      prompt: ['', [Validators.required]],
      url: [''],
      // codeSnippet: ['']
    });

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [this.formData ? this.formData.description : '', [Validators.required]],
      longDescription: [this.formData ? this.formData.longDescription : '', [Validators.required]],
      feature: [this.formData ? this.formData.feature : ''],
      requirement: [this.formData ? this.formData.requirement : '']
    });

  
    
  }

  // --- NEW METHOD TO FETCH TRAINING DATA ---
  loadTrainingData(): void {
    const chatbotId = this.globalService.getChatbotId();
    if (!chatbotId) {
      console.warn('No chatbot ID found, cannot load training data.');
      this.isTrainingLoading = false;
      return;
    }

    this.isTrainingLoading = true;
    // Assuming your http service can handle query params, if not, construct the URL manually.
    this.httpService.mobileBankingGet(`llm/personalise/list?chatbot_id=${chatbotId}`, {})
      .subscribe({
        next: (res: any) => {
          if (res && res.status === '00' && Array.isArray(res.data)) {
            this.existingTraining = res.data.map((item: any) => {
              let name = 'Untitled Training';
              if (item.file_name) {
                name = item.file_name;
              } else if (item.url) {
                try {
                  const url = new URL(item.url);
                  name = url.hostname + (url.pathname.length > 1 ? url.pathname.substring(0, 20) + '...' : '');
                } catch {
                  name = item.url.substring(0, 30) + '...';
                }
              }
              return { ...item, name: name };
            });
            console.log("Successfully loaded training data:", this.existingTraining);
          } else {
            this.existingTraining = [];
            // Swal.fire('Warning', 'Could not retrieve existing training data.', 'warning');
          }
          this.isTrainingLoading = false;
        },
        error: (err: any) => {
          console.error('Error fetching training data:', err);
          this.existingTraining = [];
          this.isTrainingLoading = false;
          Swal.fire('Error', 'An error occurred while fetching training data.', 'error');
        }
      });
  }

 toggleUrlInput() {
  this.showUrlInput = true;
  this.showCodeInput = false;
}

cancelUrlInput() {
  this.showUrlInput = false;
  this.trainingForm.get('url')?.setValue(''); 
}

toggleCodeInput() {
  this.showCodeInput = true;
  this.showUrlInput = false; 
}

cancelCodeInput() {
  this.showCodeInput = false;
  // Assuming you add a 'codeSnippet' control if you implement this
  // this.trainingForm.get('codeSnippet')?.setValue(''); 
}

get isFormValid(): boolean {
  return !!(
    this.uploadedFile || 
    this.trainingForm.value.url
  );
}

submitTraining(): void {
  const id = this.globalService.getChatbotId();
  this.chatbotId = id ? id.toString() : '';
  console.log('For chatbot ID:', this.chatbotId);

  if (!this.chatbotId) {
    Swal.fire('Error', 'No chatbot ID found, create Chatbot first', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('prompt', this.trainingForm.value.prompt);
  formData.append('url', this.trainingForm.value.url || '');
  formData.append('chatbot_id', this.chatbotId); 

  if (this.uploadedFile) {
    formData.append('file', this.uploadedFile);
  }

  this.httpService
    .mobileBankingPostFormData('llm/personalise', formData)
    .subscribe({
      next: (res: any) => {
        if (res.status === "00") {
          Swal.fire('Success', res.message || 'Knowledge base updated.', 'success');
          this.resetInputs();
          this.loadTrainingData(); // Refresh the list after successful submission
        } else {
          Swal.fire('Error', res.message || 'Failed to update knowledge base', 'error');
        }
      },
      error: (err: any) => {
        console.error('Error submitting training:', err);
        Swal.fire('Error', 'Failed to update knowledge base', 'error');
      }
    });
}

resetInputs(): void {
  this.uploadedFile = null;
  if (this.fileInput && this.fileInput.nativeElement) {
    this.fileInput.nativeElement.value = '';
  }
  this.showUrlInput = false;
  this.trainingForm.get('url')?.setValue('');
  this.showCodeInput = false;
}

onFileChange(event: any) {
  const files = event.target.files;
  if (files && files.length) {
    this.uploadedFile = files[0];
  }
}

removeFile() {
  this.uploadedFile = null;
  this.fileInput.nativeElement.value = '';
}
}