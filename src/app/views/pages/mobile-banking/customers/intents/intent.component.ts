import {Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { ActivatedRoute } from '@angular/router';

interface Node {
  id: number;
  type: 'action' | 'trigger';
  name: string;
  children: Node[]; // nested actions/triggers
}

@Component({
    selector: 'app-intent',
    templateUrl: './intent.component.html',
    styleUrls: ['./intent.component.scss']
})
export class IntentComponent implements OnInit {

    @Input() title: any;
    @Input() formData: any;
    @Input() nodes: Node[] = [];
    @Input() depth: number = 0;

 
    public loading = false;
    public hasErrors = false;
    public errorMessages: any;
    public form: FormGroup;
    public actionForm: FormGroup;

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
    intentId!: number;

    showAiActionPanel: boolean = false;
    selectedTrigger: any = null;
    parentAction: any = null;
    hovering: boolean = false;
    agentList: never[];
    actions: any;
    description: any;
    showActionForm = false;
    showActionType = false;
    intentname: any;
    editingName = false;
    actionTypes: any;
    selectedAction: any = null;
    hoveredAction: string | null = null;
    selectedActionType: string | null = null;
    headers: FormArray;
    indentLevel: number = 0; // Track nesting level
    currentParent: any = null;

 

  actionIcons: { [key: string]: string } = {
  send_message: 'icon-message-square',
  send_file: 'icon-file-text',
  http_request: 'icon-link',
  loop: 'icon-refresh-cw',
  carousel: 'icon-layers',
  Jump_to_Trigger: 'icon-corner-down-right',
  webhook: 'icon-zap',
  set_variable: 'icon-sliders',
  survey: 'icon-edit-3',
  create_ticket: 'icon-clipboard',
  human_handoff: 'icon-user',
};


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

      this.intentId = +this.route.snapshot.paramMap.get('id')!;
      this.chatbotId = this.globalService.getChatbotId();

      console.log('Editing intent ID:', this.intentId);
      console.log('For chatbot ID:', this.chatbotId);

      if (this.intentId) {
        this.fetchIntent(this.intentId);
      } else {
        console.warn('No intent selected.');
      }
      
      this.fetchIntent(this.intentId);
      this.fetchIntentList(this.intentId);    
      this.fetchActionType()

      this.actionForm = this.fb.group({
        name: ['', Validators.required],
        action_type: ['send_message'],
        message: ['', Validators.required],
      });

  //     this.actionForm = this.fb.group({
  //       http_method: ['GET'],
  //       url: [''],
  //       headers: this.fb.array([]),
  // });

  // this.headers = this.actionForm.get('headers') as FormArray;
  // this.addHeader();


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
    
 addChild(parent: Node, type: 'action' | 'trigger') {
    const newId = Date.now(); // or use a better ID generator
    const newNode: Node = {
      id: newId,
      name: type === 'action' ? 'Send Message' : 'Message Received',
      type: type,
      children: []
    };
    parent.children.push(newNode);
  }

  getIcon(type: string) {
    return type === 'action' ? 'mdi mdi-message' : 'mdi mdi-message-reply-text';
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


initializeForm() {
  this.triggerForm = this.fb.group({
    name: ['Message Received', Validators.required],
    description: [''],
    training_phrases: this.fb.array([
      this.fb.control('', Validators.required)
    ])
  });
}

focusInput(input: HTMLInputElement) {
  this.editingName = true;
  setTimeout(() => input.focus(), 0);
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


addHeader() {
  this.headers.push(
    this.fb.group({
      key: [''],
      value: ['']
    })
  );
}

removeHeader(index: number) {
  this.headers.removeAt(index);
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

fetchIntent(intentId: number): void {
  this.isLoading = true;
  const body = { intent_id: intentId};

  this._httpService.mobileBankingPost('builder/nodes/action/list', body).subscribe({
    next: (res: any) => {
      if (res.status === '00') {
        this.intents = res.data
         this.description = res.description; 
         this.intentname = res.intent_name

        console.log("Intent Data", res.data);
        // console.log("Name", this.intentname);

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


fetchNestedIntents(intentId: number): void {
  this.isLoading = true;
  const chatbotId = this.globalService.getChatbotId();
  const body = { chatbot_id: chatbotId,
                parent_id: intentId};

  this._httpService.mobileBankingPost('builder/chatbots/nested-intents/children', body).subscribe({
    next: (res: any) => {
      if (res.status === '00') {
        this.intents = res.data
        //  this.description = res.description; 
        //  this.intentname = res.intent_name

        console.log("Children Intent Data", res.data);
        // console.log("Name", this.intentname);

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

fetchActionType(): void {
  this.isLoading = true;

  this._httpService.mobileBankingPost('builder/nodes/action-types', {}).subscribe({
    next: (res: any) => {
      if (res?.status === '00') {
        this.actionTypes = res.data || [];
        console.log("Action Types:", this.actionTypes);
      } else {
        console.warn('Unexpected status code:', res.status);
        this.actionTypes = [];
      }
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Error fetching action types:', err);
      this.actionTypes = [];
      this.isLoading = false;
    }
  });
}


onActionTypeSelect(action: any): void {
  this.selectedActionType = action.type;
}

getIndentLevel(order: number): number {
    return order - 1; 
  }

openActionForm(action: any): void {
  this.selectedAction = action;
  this.selectedActionType = action.type;
  this.showActionForm = true;

  this.showActionType = false;
  this.showAiActionPanel = false; 

  // Optional: Initialize or reset your actionForm based on type
  if (action.type === 'send_message') {
    this.actionForm = this.fb.group({
      name: [action.name || '', Validators.required],
      action_type: ['send_message', Validators.required],
      message: ['', Validators.required]
    });
    
  } else if (action.type === 'send_file') {
    this.actionForm = this.fb.group({
      name: [action.name || '', Validators.required],
      action_type: ['send_file', Validators.required],
      file_url: ['', Validators.required]
    });
  } else if (action.type === 'http_request'){ this.actionForm = this.fb.group({
      name: [action.name || '', Validators.required],
      action_type: ['http_request', Validators.required],
      url: ['', Validators.required]
    });}

  // Add more conditionals for other action types...
}

openActionType(parentIntent: any) {
    this.currentParent = parentIntent;
    this.showActionType = true;
    this.fetchActionType();
    this.showActionForm = false;
    this.showAiActionPanel = false;
  }

openAiActionPanel(parentIntent: any) {
    this.currentParent = parentIntent; 
    this.selectedTrigger = parentIntent;
    this.showAiActionPanel = true;
    this.showActionForm = false;
    this.showActionType = false;
  }

  onActionSubmit(): void {
    if (this.actionForm.valid) {
      const chatbotId = this.globalService.getChatbotId()!;

      // Calculate order based on parent
      const order = this.currentParent ? this.currentParent.order + 1 : 1;

      const model = {
        name: this.actionForm.value.name,
        action_type: 'send_message',
        config: {
          message: this.actionForm.value.message,
        },
        intent_id: this.intentId,
        parent_action_id: this.currentParent?.action_id || null,
        branch_path: this.buildBranchPath(),
        order: order, // Use calculated order
      };

      this._httpService.mobileBankingPost('builder/nodes/action', model)
        .subscribe({
          next: (result: any) => {
            if (result.status === '00') {
              this.fetchIntent(this.intentId);
              this.resetForm();
            }
          },
          error: (err: any) => {
            console.error('Action creation failed:', err);
          }
        });
    }
  }

  onTriggerSubmit(): void {
  if (this.triggerForm.valid) {
    const chatbotId = this.globalService.getChatbotId();
    
    if (!chatbotId) {
      console.warn('No chatbot ID found');
      Swal.fire('Error', 'No chatbot ID found, create Chatbot first', 'error');
      return;
    }

    let order = 1; 
    if (this.currentParent) {
      order = this.currentParent.order + 1; // Child gets parent's order + 1
    }

    const model = {
      ...this.triggerForm.value,
      chatbot_id: chatbotId, 
      parent_id: this.intentId,
      order: order, // Use dynamic order calculation
    };

    console.log('Trigger Form data to submit:', model);

    this._httpService
      .mobileBankingPost('builder/nodes/intent', model)
      .subscribe({
        next: (result: any) => {
          if (result.status === '00') {
            setTimeout(() => {
              this.result = result.data;
              this.globalService.setIntentId(result.data.id);
              
              // Refresh the intent list and current intent
              this.fetchIntentList(chatbotId);
              this.fetchIntent(this.intentId);

              Swal.fire('ChatBot', 'Trigger Added Successfully!', 'success');
              
              this.triggerForm.reset();
              this.showAiActionPanel = false;
              this.currentParent = null; // Reset parent context
              this.closeModal();
            }, 10);
          } else {
            Swal.fire('Error', result.message || 'Failed to create intent', 'error');
          }
        },
        error: (err: any) => {
          console.error('Trigger creation failed:', err);
          Swal.fire('Error', 'Failed to create trigger', 'error');
        }
      });
  } else {
    this.markFormGroupTouched(this.triggerForm);
  }
}


  private resetForm(): void {
    this.currentParent = null;
    this.showActionForm = false;
    this.actionForm.reset({ action_type: 'send_message' });
  }


buildBranchPath(): string {
  // Customize as needed
  return 'root>EBU Services Response>Product Licenses Response>Oracle Services Response';
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
