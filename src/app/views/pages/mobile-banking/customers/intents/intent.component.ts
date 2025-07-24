import {Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
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
    intents: any[] = [];
    isLoading = true;
    triggerForm: FormGroup;

    chatbotId!: number | null;
    intentId!: number | null;

    showAiActionPanel: boolean = false;
    selectedTrigger: any = null;
    hovering: boolean = false;
  agentList: never[];
  actions: any;
  description: any;


    constructor(
        public activeModal: NgbActiveModal,
        private globalService: GlobalService, 
        public fb: FormBuilder,
        private _toastService: ToastrService,
        private route: ActivatedRoute,
        private _httpService: HttpService) {
        this.initializeForm();
    }

    ngOnInit() {

        const intentId = +this.route.snapshot.paramMap.get('id')!;

        this.chatbotId = this.globalService.getChatbotId();

        console.log('Editing intent ID:', intentId);
        console.log('For chatbot ID:', this.chatbotId);

        if (this.intentId) {
            this.fetchIntent(intentId);
          } else {
            console.warn('No chatbot selected.');
          }
      
      this.fetchIntent(intentId);


    this.form = this.fb.group({
        name: ['', Validators.required],
        description: [''],
        language: [''], 
        // defaultLanguage: ['', Validators.required]
    });

//     triggerForm = this.fb.group({
//   training_phrases: this.fb.array([]),
//   excluded_phrases: this.fb.array([]),
// });
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

triggerList = [
  { id: 24, name: 'Trigger Name', is_active: true },
  { id: 44, name: 'Trigger Name', is_active: false },
  { id: 54, name: 'Trigger Name', is_active: true },
  { id: 100, name: 'Trigger Name', is_active: true },
];

openAiActionPanel(trigger: any): void {
  // Logic to open right-side drawer/form
  // You can pass `trigger` data if needed
  this.selectedTrigger = trigger;
  this.showAiActionPanel = true;
}


fetchIntent(intentId: number): void {
  this.isLoading = true;
  const body = { intent_id: 225 };

  this._httpService.mobileBankingPost('builder/nodes/action/list', body).subscribe({
    next: (res: any) => {
      if (res.status === '00') {
        this.intents = res.data
         this.description = res.description; // Oracle intent description

        console.log("Intent Data", res.data);
        // console.log("Description", this.description);
      } else {
        this.intents = [];
      }
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Error fetching agent list:', err);
      this.intents = [];
      this.isLoading = false;
    }
  });
}

initializeForm() {
    this.triggerForm = this.fb.group({
      name: ['', [Validators.required, Validators.required]],
      description: [''],
      training_phrases: this.fb.array([
        this.fb.control('', Validators.required)
      ]),
        // excluded_phrases: this.fb.array([]),
    });
  }

   get trainingPhrases() {
    return this.triggerForm?.get('training_phrases') as FormArray;
  }

  addTrainingPhrase() {
    this.trainingPhrases.push(this.fb.control('', Validators.required));
  }

  removeTrainingPhrase(index: number) {
    if (this.trainingPhrases.length > 1) {
      this.trainingPhrases.removeAt(index);
    }
  }

get excludedPhrases(): FormArray {
  return this.triggerForm.get('excluded_phrases') as FormArray;
}

addExcludedPhrase(): void {
  this.excludedPhrases.push(this.fb.control('', Validators.required));
}

removeExcludedPhrase(index: number): void {
  if (this.excludedPhrases.length > 1) {
    this.excludedPhrases.removeAt(index);
  }
}


private markFormGroupTouched(formGroup: FormGroup) {
  Object.values(formGroup.controls).forEach(control => {
    control.markAsTouched();

    if (control instanceof FormGroup) {
      this.markFormGroupTouched(control);
    }
  });
}

fetchIntentList(chatbotId: number): void {
  this.isLoading = true;
  const body = { chatbot_id: chatbotId };

  this._httpService.mobileBankingPost('builder/chatbots/root-intents', body).subscribe({
    next: (res: any) => {
      if (res.status === '00' && Array.isArray(res.data)) {
        this.agentList = res.data.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else {
        this.agentList = [];
   
      }
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Error fetching agent list:', err);
      this.agentList = [];
 
      this.isLoading = false;
    }
  });
}


onTriggerSubmit(): void {
  if (this.triggerForm.valid) {
    // Get chatbot ID from global service
    const chatbotId = this.globalService.getChatbotId();
    
    if (!chatbotId) {
      console.warn('No chatbot ID found');
      Swal.fire('Error', 'No chatbot ID found,create Chatbot first', 'error');
      return;
    }

    const model = {
      ...this.triggerForm.value,
      chatbot_id: chatbotId, 
      is_root: true, 
      order: 1,
      responses: ["Welcome! How can I assist you today?"]       
    };

    console.log('Form data to submit:', model);

    this._httpService
      .mobileBankingPost('builder/nodes/intent', model)
      .subscribe({
        next: (result: any) => {
          if (result.status === '00') {
            setTimeout(() => {
              this.result = result.data;
              console.log(this.result);
             
  
              this.globalService.setIntentId(result.data.id);
              this.fetchIntentList(chatbotId)

              Swal.fire('ChatBot', 'Intent created successfully!', 'success');
              this.triggerForm.reset();
              this.closeModal(); // Close modal after successful submission
            }, 10);
          } else {
            console.log(result.message);
            Swal.fire('Error', result.message || 'Failed to create intent', 'error');
          }
        },
        error: (err: any) => {
          console.error('Bot creation failed:', err);
          Swal.fire('Error', 'Failed to create intent', 'error');
        }
      });
  } else {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.triggerForm);
  }
}

sendBot(): void {
  const selectedLang = this.language.length > 0 ? this.language[0] : 'English';

  const model = {
    name: this.form.value.name,
    description: this.form.value.description,
    intentId: this.intentId, // Send as string
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
            // this.fetchIntent(this.intentId)


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
