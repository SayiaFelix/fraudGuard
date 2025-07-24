import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-intent',
    templateUrl: './intent.component.html',
    styleUrls: ['./intent.component.scss']
})
export class IntentComponent implements OnInit {

    @Input() title: any;
    @Input() formData: any;
    public loading = false;
    public hasErrors = false;
    public errorMessages: any;
    public form: FormGroup;
    public imageFile: File;

    // In your component.ts
    availableLanguages: string[] = ['English', 'Swahili', 'French', 'Arabic', 'Spanish', 'German'];
    language: string[] = ['English'];
    defaultLanguage: string = 'English';
    data: any;
    chatbotdata: any;
    result: any;
    agentList: any[] = [];

    chatbotId!: number | null;
    intentId!: number | null;

    constructor(
        public activeModal: NgbActiveModal,
        private globalService: GlobalService, 
        public fb: FormBuilder,
        private _toastService: ToastrService,
        private route: ActivatedRoute,
        private _httpService: HttpService) {
    }

    ngOnInit() {

        this.intentId = +this.route.snapshot.paramMap.get('id')!;
        this.chatbotId = this.globalService.getChatbotId();

        console.log('Editing intent ID:', this.intentId);
        console.log('For chatbot ID:', this.chatbotId);
      
      this.fetchAgentList();


    this.form = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        language: [''], 
        // defaultLanguage: ['', Validators.required]
    });

    }

    onFileSelected(){ }
    public submitData(): void {
        if (this.formData) {
            this.saveChanges();
        } else {
            // this.createRecord();
        }
        this.loading = true;
    }

  addLanguage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedLang = select.value;

    if (selectedLang && !this.language.includes(selectedLang)) {
        // Clear 'English' if it's the only one
        if (this.language.length === 1 && this.language[0] === 'English') {
        this.language = [];
        }

        this.language.push(selectedLang);
        this.defaultLanguage = selectedLang; // Automatically set selected as default
        select.value = ''; // Reset dropdown
    }
}

removeLanguage(lang: string): void {
  this.language = this.language.filter(l => l !== lang);

  // Update default language if needed
  if (this.defaultLanguage === lang) {
    this.defaultLanguage = this.language.length > 0 ? this.language[0] : 'English';
  }
}

fetchAgentList(): void {
 const userId = localStorage.getItem('user_id');

  if (!userId) {
    console.warn('User ID not found in local storage.');
    this.agentList = [];
    return;
  }

  const usersId = parseInt(userId, 10);
  const body = { user_id: usersId };

  this._httpService.mobileBankingPost('builder/chatbots/list', body).subscribe({
    next: (res: any) => {
      if (res.status === '00' && Array.isArray(res.data)) {
        this.agentList = res.data;
      } else {
        this.agentList = [];
        console.warn('Unexpected data format', res);
      }
    },
    error: (err: any) => {
      console.error('Error fetching agent list:', err);
      this.agentList = [];
    }
  });
}

sendBot(): void {
  const selectedLang = this.language.length > 0 ? this.language[0] : 'English';

  const model = {
    name: this.form.value.name,
    description: this.form.value.description,
    language: selectedLang, // Send as string
  };

  console.log('Bot payload:', model);

  this._httpService
    .mobileBankingPost('builder/chatbots', model)
    .subscribe({
      next: (result: any) => {
        if (result.status === '00') {
          setTimeout(() => {
            this.result = result.data; // ✅ fix here
            console.log(this.result);

            this.globalService.setChatbotId(result.data.id);
            this.globalService.setChatbotData(result.data);
            this.fetchAgentList()


            // ✅ Success toast
            Swal.fire('ChatBot', 'Bot created successfully!', 'success');

            this.form.reset();
            this.language = [];
            this.defaultLanguage = 'English';
          }, 10);
        } else {
          // ⚠️ Non-success status
          this._toastService.warning(
            result.message || 'Bot creation did not complete successfully.',
            'Warning'
          );
        }
      },
      error: (err: any) => {
        console.error('Bot creation failed:', err);

        // ❌ Error toast
        this._toastService.error(
          err?.error?.message || 'An error occurred while creating the bot.',
          'Error'
        );
      }
    });
}

 

uploadImageClick(){}
removeImage(){}
    public closeModal(): void {
        this.activeModal.dismiss('Cross click');
    }

    private saveChanges(): any {
    }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }
}
