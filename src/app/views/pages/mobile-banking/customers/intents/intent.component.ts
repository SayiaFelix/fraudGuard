import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { ActivatedRoute } from '@angular/router';
import { catchError, forkJoin, of, tap } from 'rxjs';

interface Node {
  id: number;
  type: 'action' | 'trigger';
  name: string;
  children: Node[]; // nested actions/triggers
}

interface Branch {
  intent_id: number;
  order: number;
  actions: {
    action_id: number;
    order: number;
  }[];
  children: Branch[];
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
    showTriggerType = false;
    intentname: any;
    editingName = false;
    actionTypes: any;
    selectedAction: any = null;
    hoveredAction: string | null = null;
    selectedActionType: string | null = null;
    headers: FormArray;
    indentLevel: number = 0; // Track nesting level
    currentParent: any = null;
    combinedItems: any[] = [];
    loadingIntents = false;
    loadingTriggers = false;

    // In your component class
    isLaunching = false;
    launchMessage = '';


    isActive: boolean = false;

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
  triggers: any;
  currentParentIntentId: number | null = null;


  constructor(
        private cdRef: ChangeDetectorRef,
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
      this.fetchNestedIntents(this.intentId) 

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

triggerTypes = [
  { 
    type: 'message_received', 
    name: 'Message Received',
    featherIcon: 'icon-mail' // Feather icon class
  },
  { 
    type: 'attachment_received', 
    name: 'Attachment Received',
    featherIcon: 'icon-paperclip' 
  },
  { 
    type: 'fallback', 
    name: 'Fallback',
    featherIcon: 'icon-refresh-cw'
  }
];

onFileSelected(){ }

  public submitData(): void {
        if (this.formData) {
            this.saveChanges();
        } else {
            // this.createRecord();
        }
        this.loading = true;
    }

// Add this method to your component
getDisplayItems() {
  return this.combinedItems.map(item => {
    return {
      ...item,
      // Calculate indent level based on hierarchy
      indentLevel: this.calculateIndentLevel(item)
    };
  });
}

calculateIndentLevel(item: any): number {
  if (!item.parent_id) return 0; // Root level
  // Find parent and return its level + 1
  const parent = this.combinedItems.find(i => i.id === item.parent_id);
  return parent ? this.calculateIndentLevel(parent) + 1 : 0;
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
    name: ['', Validators.required], 
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

fetchData(intentId: number): void {
  this.loadingIntents = true;
  this.loadingTriggers = true;
  
  // Fetch both intents and triggers
  this.fetchIntent(intentId);
  this.fetchNestedIntents(intentId);
}



private checkAndCombine(): void {
  if (!this.loadingIntents && !this.loadingTriggers) {
    // Force new references
    this.intents = [...this.intents];
    this.triggers = [...this.triggers];
    this.combineAndSortItems();
    this.cdRef.detectChanges();
  }
}



private combineAndSortItems(): void {
  // Enhanced processTrigger function
  const processTrigger = (trigger: any, level = 0): any => {
    const processedTrigger = {
      ...trigger,
      itemType: 'trigger',
      indentLevel: level, // Track nesting level
      children: []
    };

    // Process trigger's direct actions
    if (trigger.actions && trigger.actions.length) {
      processedTrigger.children.push(
        ...trigger.actions.map((action: any) => ({
          ...action,
          itemType: 'action',
          parent_id: trigger.id,
          isActionChild: true,
          indentLevel: level + 1
        }))
      );
    }

    // Process nested triggers recursively
    if (trigger.children && trigger.children.length) {
      processedTrigger.children.push(
        ...trigger.children.map((child: any) => processTrigger(child, level + 1))
      );
    }

    return processedTrigger;
  };

  // Process all root triggers with initial level 0
  const processedTriggers = (this.triggers || []).map((trigger: any) => 
    processTrigger(trigger, 0)
  );

  // Process root-level actions (not associated with any trigger)
  const rootActions = (this.intents || []).filter(
    (action: any) => !this.triggers.some((t: { id: any; }) => t.id === action.intent_id)
  ).map((action: any) => ({
    ...action,
    itemType: 'action',
    indentLevel: 0
  }));

  // Flatten the structure for the combinedItems array
  this.combinedItems = [
    ...rootActions,
    ...this.flattenTriggerHierarchy(processedTriggers)
  ].sort((a, b) => a.order - b.order);
  
  this.isLoading = false;
}


// Helper to flatten the nested trigger hierarchy
private flattenTriggerHierarchy(triggers: any[]): any[] {
  return triggers.reduce((acc, trigger) => {
    acc.push(trigger);
    if (trigger.children && trigger.children.length) {
      acc.push(...this.flattenTriggerHierarchy(trigger.children));
    }
    return acc;
  }, []);
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
  const body = { intent_id: intentId };

  this._httpService.mobileBankingPost('builder/nodes/action/list', body).subscribe({
    next: (res: any) => {
      if (res.status === '00') {
        this.intents = (res.data || []).map((intent: any) => ({
          ...intent,
          is_active: !!intent.is_active,
          // Ensure children are properly mapped
          children: intent.children ? intent.children.map((child: any) => ({
            ...child,
            is_active: !!child.is_active
          })) : []
        }));
        this.checkAndCombine();
        this.description = res.description;
        this.intentname = res.intent_name;
        this.isActive = !!res.is_active; 
      } else {
        this.intents = [];
      }
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Error fetching agent list:', err);
      this.intents = [];
      this.isLoading = false;
      this.checkAndCombine();
    }
  });
}

fetchNestedIntents(intentId: number): void {
  this.loadingTriggers = true;
  const chatbotId = this.globalService.getChatbotId();
  const body = { parent_id: intentId };

  this._httpService.mobileBankingPost('builder/chatbots/nested-intents/children', body).subscribe({
    next: (res: any) => {
      if (res.status === '00') {
        this.triggers = res.data;
      } else {
        this.triggers = [];
      }
      this.loadingTriggers = false;
      this.checkAndCombine();
    },
    error: (err: any) => {
      console.error('Error fetching triggers:', err);
      this.triggers = [];
      this.loadingTriggers = false;
      this.checkAndCombine();
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


openTriggerForm(parentIntent: any): void {
 this.showTriggerType = true;
  this.showActionForm = false;
  this.showActionType = false;
  this.showAiActionPanel = false; 
   this.currentParent = parentIntent;
   this.initializeForm();

    if (parentIntent) {
    this.currentParentIntentId = parentIntent.id;
  }
 
}


openActionType(parentIntent: any): void {
  this.currentParent = parentIntent;
  this.showActionType = true;
  this.fetchActionType();
  this.showActionForm = false;
  this.showAiActionPanel = false;
   this.showTriggerType = false;
  
  // Set the currentParentIntentId for hierarchy tracking
  if (parentIntent) {
    this.currentParentIntentId = parentIntent.id;
  }
}

openAiActionPanel(parentIntent: any) {
    this.currentParent = parentIntent; 
    this.selectedTrigger = parentIntent;
    this.showAiActionPanel = true;
    this.showActionForm = false;
    this.showActionType = false;
    this.showTriggerType = false;

    // Initialize form with selected trigger type
  this.triggerForm.patchValue({
    name: parentIntent.name
  });
  }


shouldShowAddActionButton(): boolean {
  // Show if no root actions exist
  return !this.combinedItems.some(item => 
    item.itemType === 'action' && !item.parent_id
  );
}

shouldShowAddTriggerButton(): boolean {
  // Show if no root triggers exist (parent_id matches intentId)
  return !this.combinedItems.some(item => 
    item.itemType === 'trigger' && item.parent_id === this.intentId
  );
}

// Helper methods for hierarchy
hasChildren(parentId: number): boolean {
  return this.combinedItems.some(item => item.parent_id === parentId);
}

getChildren(parentId: number): any[] {
  return this.combinedItems
    .filter(item => item.parent_id === parentId)
    .sort((a, b) => a.order - b.order);
}



shouldShowRootButtons(): boolean {
  return (this.shouldShowAddActionButton() || this.shouldShowAddTriggerButton()) && 
         this.combinedItems.length > 0;
}


getIndentLevel(item: any): number {
  if (!item.parent_id && !item.isActionChild) return 0;
  
  // For actions under triggers
  if (item.isActionChild) {
    const parentTrigger = this.findParentTrigger(item);
    return parentTrigger ? this.getIndentLevel(parentTrigger) + 1 : 0;
  }
  
  // For nested triggers
  const parent = this.findParentItem(item);
  return parent ? this.getIndentLevel(parent) + 1 : 0;
}

private findParentItem(item: any): any {
  return this.combinedItems.find(i => 
    i.id === item.parent_id || 
    i.action_id === item.parent_id
  );
}

private findParentTrigger(action: any): any {
  // Search through all triggers to find the parent
  for (const trigger of this.triggers || []) {
    if (trigger.id === action.intent_id) return trigger;
    const found = this.findTriggerInChildren(trigger, action.intent_id);
    if (found) return found;
  }
  return null;
}

private findTriggerInChildren(trigger: any, intentId: number): any {
  if (trigger.id === intentId) return trigger;
  for (const child of trigger.children || []) {
    if (child.itemType === 'trigger') {
      const found = this.findTriggerInChildren(child, intentId);
      if (found) return found;
    }
  }
  return null;
}


onActionSubmit(): void {
    if (this.actionForm.valid) {
         const chatbotId = this.globalService.getChatbotId()!;
    
    // Determine IDs based on hierarchy
    let intentId: number;
    let parentActionId: number | null;

    if (!this.currentParent) {
      // Root level action
      intentId = this.intentId;
      parentActionId = chatbotId; 
    } else if (this.currentParent.itemType === 'trigger') {
      // Action under a trigger
      intentId = this.currentParent.id; // trigger ID becomes intent_id
      parentActionId = this.intentId; // root intent ID as parent_action_id
    } else {
      // Action under another action (if needed)
      intentId = this.currentParent.intent_id;
      parentActionId = this.currentParent.action_id;
    }

    const model = {
      name: this.actionForm.value.name,
      action_type: this.selectedActionType || 'send_message',
      config: {
        message: this.actionForm.value.message,
        // include other config fields as needed
      },
      intent_id: intentId,
      parent_action_id: null, // Use null if no parent action
      branch_path: this.buildBranchPath(),
      order: this.getNextOrder(this.currentParent),
    };

    console.log('Submitting action with:', {
      intent_id: intentId,
      parent_action_id: parentActionId,
      currentParent: this.currentParent,
      hierarchy: !this.currentParent ? 'root' : 
                this.currentParent.itemType === 'trigger' ? 'under trigger' : 'under action'
    });

        this._httpService.mobileBankingPost('builder/nodes/action', model)
            .subscribe({
                next: (result: any) => {
                    if (result.status === '00') {
                        // Parallel data refresh
                        forkJoin([
                            this.fetchIntent(this.intentId),
                            this.fetchNestedIntents(this.intentId)
                        ]).subscribe({
                            next: () => {
                                this.checkAndCombine();
                                this.cdRef.detectChanges();
                                Swal.fire('Success', 'Action created successfully!', 'success');
                                this.resetForm(); // Reset after everything is done
                            },
                            error: (err) => {
                                console.error('Error refreshing data:', err);
                                this.resetForm(); // Still reset form even if refresh fails
                            }
                        });
                    } else {
                        Swal.fire('Error', result.message || 'Action creation failed', 'error');
                    }
                },
                error: (err: any) => {
                    console.error('API Error:', err);
                    Swal.fire('Error', 'Failed to create action', 'error');
                    // Don't reset form on error - let user retry with their data
                }
            });
    } else {
        this.markFormGroupTouched(this.actionForm);
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

    // Determine parent ID
    const parent_id = this.currentParent ? this.currentParent.id : this.intentId;

    const model = {
      ...this.triggerForm.value,
      chatbot_id: chatbotId,
      parent_id: parent_id,
      order: this.getNextOrder(this.currentParent),
    };

    console.log('Trigger Form data to submit:', model);

    this._httpService.mobileBankingPost('builder/nodes/intent', model)
      .subscribe({
        next: (result: any) => {
          if (result.status === '00') {
            // Use forkJoin for parallel data fetching
            forkJoin([
              this.fetchIntent(this.intentId),
              this.fetchIntentList(chatbotId),
              this.fetchNestedIntents(this.intentId)
            ]).subscribe({
              next: () => {
                this.checkAndCombine();
                this.cdRef.detectChanges();
                Swal.fire('Success', 'Trigger added successfully!', 'success');
                this.resetTriggerForm();
              },
              error: (err) => {
                console.error('Error refreshing data:', err);
                this.resetTriggerForm(); // Still reset form even if refresh fails
              }
            });
          } else {
            Swal.fire('Error', result.message || 'Failed to create trigger', 'error');
          }
        },
        error: (err: any) => {
          console.error('Trigger creation failed:', err);
          Swal.fire('Error', 'Failed to create trigger', 'error');
          // Don't reset form on error - let user retry with their data
        }
      });
  } else {
    this.markFormGroupTouched(this.triggerForm);
  }
}

private resetTriggerForm(): void {
  // Reset form values
  this.triggerForm.reset({
    name: '',
    description: '',
    training_phrases: ['']
  });

  // Clear FormArray while keeping one empty control
  const trainingPhrases = this.trainingPhrases;
  while (trainingPhrases.length > 1) {
    trainingPhrases.removeAt(0);
  }
  trainingPhrases.reset(['']);

  // Reset UI state
  this.showAiActionPanel = false;
  this.currentParent = null;
  this.selectedTrigger = null;
  this.editingName = false;
}

// Improved getNextOrder to handle hierarchy correctly
getNextOrder(parent: any): number {
  if (!parent) {
    // Root level items - find max order among root items
    const rootItems = this.combinedItems.filter(item => 
      (item.itemType === 'action' && !item.parent_id) || 
      (item.itemType === 'trigger' && item.parent_id === this.intentId)
    );
    return rootItems.length > 0 ? Math.max(...rootItems.map(i => i.order)) + 1 : 1;
  } else {
    // Child items - find max order among siblings
    const siblings = this.combinedItems.filter(item => 
      (item.parent_id === parent.id) ||
      (item.parent_action_id === parent.action_id)
    );
    return siblings.length > 0 ? Math.max(...siblings.map(i => i.order)) + 1 : 1;
  }
}


launchBot(intentId: number) {
  console.log('Launching bot for intent:', intentId);
  this.isLaunching = true;
  this.launchMessage = 'Preparing bot launch...';

  if (!intentId) {
    this.isLaunching = false;
    this.launchMessage = 'Error: No intent specified';
    return;
  }

  const branches = this.getBranchesFromCombinedItems(intentId);
  this.launchMessage = 'Building bot structure...';

  const payload = {
    root_intent_id: intentId,
    branches
  };

  console.log('Bot launch payload:', payload);
  this.launchMessage = 'Sending to server...';

  this._httpService
    .mobileBankingPost('builder/flows/from-tree', payload)
    .subscribe({
      next: (result: any) => {
        this.isLaunching = false;
        if (result.status === '00') {
          this.launchMessage = 'Bot launched successfully!';
          setTimeout(() => {
            this.fetchData(this.intentId);
            this.checkAndCombine();
            Swal.fire('ChatBot', 'Chatbot Launched Successfully, Test Now!!', 'success');
            this.launchMessage = '';
          }, 10);
        } else {
          this.launchMessage = result.message || 'Failed to Launch Bot';
          Swal.fire('Error', this.launchMessage, 'error');
        }
      },
      error: (err: any) => {
        this.isLaunching = false;
        this.launchMessage = 'Failed to Launch Bot';
        console.error('Bot Launch failed:', err);
        Swal.fire('Error', this.launchMessage, 'error');
      }
    });
}

getBranchesFromCombinedItems(rootId: number): Branch[] {
  const branches: Branch[] = [];

  // Get direct triggers under the root
  const rootTriggers = this.combinedItems.filter(
    (item: any) => item.itemType === 'trigger' && item.parent_id === rootId
  );

  for (const trigger of rootTriggers) {
    const branch: Branch = {
      intent_id: trigger.id,
      order: trigger.order || 1,
      actions: [],
      children: []
    };

    // Process direct actions under this trigger
    const directActions = this.combinedItems.filter(
      (item: any) => item.itemType === 'action' && item.intent_id === trigger.id
    );
    
    branch.actions = directActions.map((action: any) => ({
      action_id: action.action_id,
      order: action.order || 1
    }));

    // Process nested triggers recursively
    if (trigger.children && trigger.children.length) {
      const nestedTriggers = trigger.children.filter(
        (child: any) => child.itemType === 'trigger'
      );
      
      for (const nestedTrigger of nestedTriggers) {
        const nestedBranch = this.getBranchesFromCombinedItems(nestedTrigger.id);
        branch.children.push(...nestedBranch);
      }
    }

    branches.push(branch);
  }

  return branches;
}


private resetForm(): void {
    this.currentParent = null;
    this.selectedAction = null;
    this.selectedActionType = null;
    
    // Close all panels
    this.showActionForm = false;
    this.showActionType = false;
    this.showTriggerType = false;
    this.showAiActionPanel = false;

    // Reset forms with their default values
    this.actionForm.reset({
        action_type: 'send_message',
        name: '',
        message: ''
    });

    this.triggerForm.reset({
        name: '',
        description: '',
        training_phrases: ['']
    });

    // Clear FormArrays properly
    const trainingPhrases = this.triggerForm.get('training_phrases') as FormArray;
    while (trainingPhrases.length > 1) {
        trainingPhrases.removeAt(0);
    }
    trainingPhrases.reset(['']);

    // Reset any other form-related state
    this.editingName = false;
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
            this.fetchIntent(this.intentId)


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

  toggleIntentStatus(event: Event) {
      const inputElement = event.target as HTMLInputElement;
      const isChecked = inputElement.checked;
      if (!this.intentId) return;
      const payload = { intent_id: this.intentId, is_active: isChecked };
      this.isActive = isChecked; // Optimistic update
      this._httpService.mobileBankingPost('builder/nodes/intent/status', payload).subscribe({
          next: (res: any) => {
            if (res.status === '00') {
              Swal.fire('Success', `Intent status updated to ${isChecked ? 'Active' : 'Inactive'}.`, 'success');
            } else {
              this.isActive = !isChecked;
              inputElement.checked = !isChecked; // Revert UI
              Swal.fire('API Error', res.message || 'Failed to update intent status', 'error');
            }
          },
          // ✅ CORRECTED: Added 'any' type to the error parameter to fix TS7006
          error: (err: any) => {
            this.isActive = !isChecked;
            inputElement.checked = !isChecked; // Revert UI
            Swal.fire('Error', err?.error?.message || 'An unexpected error occurred.', 'error');
          }
        });
    }
}
