import {ChangeDetectorRef, Component, Input, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from '@angular/router'; // Added Router
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
    agentList: any[]; // CORRECTED: from never[] to any[]
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
    indentLevel: number = 0;
    currentParent: any = null;
    combinedItems: any[] = [];
    loadingIntents = false;
    loadingTriggers = false;

    isLaunching = false;
    launchMessage = '';

    // This property holds the active status for the entire intent.
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
        private router: Router, // ADDED: Router for fetching initial state
        private _httpService: HttpService) {
        this.initializeForm();
    }

    ngOnInit() {
        this.intentId = +this.route.snapshot.paramMap.get('id')!;
        this.chatbotId = this.globalService.getChatbotId();

        console.log('Editing intent ID:', this.intentId);
        console.log('For chatbot ID:', this.chatbotId);

        // CORRECTED: Replaced old data fetching with robust loading logic
        if (this.intentId) {
            this.loadInitialData(); 
        } else {
            console.warn('No intent selected.');
            this.isLoading = false;
        }
        
        if (this.chatbotId) {
            this.fetchIntentList(this.chatbotId);
        }
        
        this.fetchActionType();

        this.actionForm = this.fb.group({
            name: ['', Validators.required],
            action_type: ['send_message'],
            message: ['', Validators.required],
        });

        this.form = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            language: [''], 
        });
    }

triggerTypes = [
  { 
    type: 'message_received', 
    name: 'Message Received',
    featherIcon: 'icon-mail'
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
        }
        this.loading = true;
    }

getDisplayItems() {
  return this.combinedItems.map(item => {
    return {
      ...item,
      indentLevel: this.calculateIndentLevel(item)
    };
  });
}

calculateIndentLevel(item: any): number {
  if (!item.parent_id) return 0;
  const parent = this.combinedItems.find(i => i.id === item.parent_id);
  return parent ? this.calculateIndentLevel(parent) + 1 : 0;
}

    
addChild(parent: Node, type: 'action' | 'trigger') {
    const newId = Date.now();
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
        if (this.language.length === 1 && this.language[0] === 'English') {
        this.language = [];
        }
        this.language.push(selectedLang);
        this.defaultLanguage = selectedLang;
        select.value = '';
    }
}

removeLanguage(lang: string): void {
  this.language = this.language.filter(l => l !== lang);
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

// ADDED: Method to correctly load initial data, including intent status
loadInitialData(): void {
    this.isLoading = true;
    const navigation = this.router.getCurrentNavigation();
    const triggerData = navigation?.extras?.state?.triggerData;

    if (triggerData) {
        console.log('Using router state for initial data:', triggerData);
        this.intentname = triggerData.name;
        this.description = triggerData.description;
        this.isActive = !!triggerData.is_active; // Use passed status
        this.intentId = triggerData.id;
        this.fetchData(this.intentId); // Fetch children
    } else {
        console.log('No router state found. Fetching full intent details from API...');
        this.fetchIntentDetailsFromAPI(this.intentId);
    }
}

// ADDED: Method to fetch details of the root intent itself
fetchIntentDetailsFromAPI(intentId: number): void {
  this.isLoading = true;
  const chatbotId = this.globalService.getChatbotId();
  if (!chatbotId) {
    console.error('Chatbot ID is missing.');
    this.isLoading = false;
    return;
  }
  const body = { chatbot_id: chatbotId };
  this._httpService.mobileBankingPost('builder/chatbots/root-intents', body).subscribe({
    next: (res: any) => {
      if (res.status === '00' && Array.isArray(res.data)) {
        const intent = res.data.find((i: any) => i.id === intentId);
        if (intent) {
          this.intentname = intent.name;
          this.description = intent.description;
          this.isActive = !!intent.is_active; // Correctly set status
          this.fetchData(intentId); // Now fetch children
        } else {
          this._toastService.error('Could not find the specified intent.', 'Error');
          this.isLoading = false;
        }
      } else {
        this._toastService.error('Failed to fetch intent details.', 'Error');
        this.isLoading = false;
      }
    },
    error: (err: any) => {
      console.error('Error fetching root intents:', err);
      this.isLoading = false;
    }
  });
}

fetchData(intentId: number): void {
  this.loadingIntents = true;
  this.loadingTriggers = true;
  this.fetchIntent(intentId);
  this.fetchNestedIntents(intentId);
}

private checkAndCombine(): void {
  if (!this.loadingIntents && !this.loadingTriggers) {
    this.intents = [...this.intents];
    this.triggers = [...this.triggers];
    this.combineAndSortItems();
    this.cdRef.detectChanges();
  }
}

private combineAndSortItems(): void {
  const processTrigger = (trigger: any, level = 0): any => {
    const processedTrigger = { ...trigger, itemType: 'trigger', indentLevel: level, children: [] };
    if (trigger.actions && trigger.actions.length) {
      processedTrigger.children.push(...trigger.actions.map((action: any) => ({ ...action, itemType: 'action', parent_id: trigger.id, isActionChild: true, indentLevel: level + 1 })));
    }
    if (trigger.children && trigger.children.length) {
      processedTrigger.children.push(...trigger.children.map((child: any) => processTrigger(child, level + 1)));
    }
    return processedTrigger;
  };
  const processedTriggers = (this.triggers || []).map((trigger: any) => processTrigger(trigger, 0));
  const rootActions = (this.intents || []).filter((action: any) => !this.triggers.some((t: { id: any; }) => t.id === action.intent_id)).map((action: any) => ({ ...action, itemType: 'action', indentLevel: 0 }));
  this.combinedItems = [...rootActions, ...this.flattenTriggerHierarchy(processedTriggers)].sort((a, b) => a.order - b.order);
  this.isLoading = false;
}

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
        this.agentList = res.data.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

// CLEANED: This method now only fetches actions, as intended.
fetchIntent(intentId: number): void {
  this.loadingIntents = true;
  const body = { intent_id: intentId };
  this._httpService.mobileBankingPost('builder/nodes/action/list', body).subscribe({
    next: (res: any) => {
      if (res.status === '00') {
        this.intents = (res.data || []).map((intent: any) => ({
          ...intent,
          is_active: !!intent.is_active,
          children: intent.children ? intent.children.map((child: any) => ({ ...child, is_active: !!child.is_active })) : []
        }));
      } else {
        this.intents = [];
      }
      this.loadingIntents = false;
      this.checkAndCombine();
    },
    error: (err: any) => {
      console.error('Error fetching actions list:', err);
      this.intents = [];
      this.loadingIntents = false;
      this.checkAndCombine();
    }
  });
}

fetchNestedIntents(intentId: number): void {
  this.loadingTriggers = true;
  const body = { parent_id: intentId };
  this._httpService.mobileBankingPost('builder/chatbots/nested-intents/children', body).subscribe({
    next: (res: any) => {
      this.triggers = (res.status === '00') ? res.data : [];
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
      this.actionTypes = (res?.status === '00') ? res.data || [] : [];
      console.log("Action Types:", this.actionTypes);
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

  if (action.type === 'send_message') {
    this.actionForm = this.fb.group({ name: [action.name || '', Validators.required], action_type: ['send_message', Validators.required], message: ['', Validators.required] });
  } else if (action.type === 'send_file') {
    this.actionForm = this.fb.group({ name: [action.name || '', Validators.required], action_type: ['send_file', Validators.required], file_url: ['', Validators.required] });
  } else if (action.type === 'http_request'){
    this.actionForm = this.fb.group({ name: [action.name || '', Validators.required], action_type: ['http_request', Validators.required], url: ['', Validators.required] });
  }
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
    this.triggerForm.patchValue({ name: parentIntent.name });
}


shouldShowAddActionButton(): boolean {
  return !this.combinedItems.some(item => item.itemType === 'action' && !item.parent_id);
}

shouldShowAddTriggerButton(): boolean {
  return !this.combinedItems.some(item => item.itemType === 'trigger' && item.parent_id === this.intentId);
}

hasChildren(parentId: number): boolean {
  return this.combinedItems.some(item => item.parent_id === parentId);
}

getChildren(parentId: number): any[] {
  return this.combinedItems.filter(item => item.parent_id === parentId).sort((a, b) => a.order - b.order);
}

shouldShowRootButtons(): boolean {
  return (this.shouldShowAddActionButton() || this.shouldShowAddTriggerButton()) && this.combinedItems.length > 0;
}


getIndentLevel(item: any): number {
  if (!item.parent_id && !item.isActionChild) return 0;
  if (item.isActionChild) {
    const parentTrigger = this.findParentTrigger(item);
    return parentTrigger ? this.getIndentLevel(parentTrigger) + 1 : 0;
  }
  const parent = this.findParentItem(item);
  return parent ? this.getIndentLevel(parent) + 1 : 0;
}

private findParentItem(item: any): any {
  return this.combinedItems.find(i => i.id === item.parent_id || i.action_id === item.parent_id);
}

private findParentTrigger(action: any): any {
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
    if (!this.actionForm.valid) {
        this.markFormGroupTouched(this.actionForm);
        return;
    }
    const chatbotId = this.globalService.getChatbotId()!;
    let intentId: number;
    let parentActionId: number | null;

    if (!this.currentParent) {
      intentId = this.intentId;
      parentActionId = chatbotId; 
    } else if (this.currentParent.itemType === 'trigger') {
      intentId = this.currentParent.id;
      parentActionId = this.intentId;
    } else {
      intentId = this.currentParent.intent_id;
      parentActionId = this.currentParent.action_id;
    }

    const model = {
      name: this.actionForm.value.name,
      action_type: this.selectedActionType || 'send_message',
      config: { message: this.actionForm.value.message },
      intent_id: intentId,
      parent_action_id: null,
      branch_path: this.buildBranchPath(),
      order: this.getNextOrder(this.currentParent),
    };

    this._httpService.mobileBankingPost('builder/nodes/action', model).subscribe({
        next: (result: any) => {
            if (result.status === '00') {
                forkJoin([this.fetchIntent(this.intentId), this.fetchNestedIntents(this.intentId)]).subscribe({
                    next: () => {
                        this.checkAndCombine();
                        this.cdRef.detectChanges();
                        Swal.fire('Success', 'Action created successfully!', 'success');
                        this.resetForm();
                    },
                    error: (err) => {
                        console.error('Error refreshing data:', err);
                        this.resetForm();
                    }
                });
            } else {
                Swal.fire('Error', result.message || 'Action creation failed', 'error');
            }
        },
        error: (err: any) => {
            console.error('API Error:', err);
            Swal.fire('Error', 'Failed to create action', 'error');
        }
    });
}


onTriggerSubmit(): void {
    if (!this.triggerForm.valid) {
        this.markFormGroupTouched(this.triggerForm);
        return;
    }
    const chatbotId = this.globalService.getChatbotId();
    if (!chatbotId) {
      Swal.fire('Error', 'No chatbot ID found, create Chatbot first', 'error');
      return;
    }
    const parent_id = this.currentParent ? this.currentParent.id : this.intentId;
    const model = { ...this.triggerForm.value, chatbot_id: chatbotId, parent_id: parent_id, order: this.getNextOrder(this.currentParent) };

    this._httpService.mobileBankingPost('builder/nodes/intent', model).subscribe({
        next: (result: any) => {
            if (result.status === '00') {
                forkJoin([this.fetchIntent(this.intentId), this.fetchIntentList(chatbotId), this.fetchNestedIntents(this.intentId)]).subscribe({
                    next: () => {
                        this.checkAndCombine();
                        this.cdRef.detectChanges();
                        Swal.fire('Success', 'Trigger added successfully!', 'success');
                        this.resetTriggerForm();
                    },
                    error: (err) => {
                        console.error('Error refreshing data:', err);
                        this.resetTriggerForm();
                    }
                });
            } else {
                Swal.fire('Error', result.message || 'Failed to create trigger', 'error');
            }
        },
        error: (err: any) => {
            console.error('Trigger creation failed:', err);
            Swal.fire('Error', 'Failed to create trigger', 'error');
        }
    });
}

private resetTriggerForm(): void {
  this.triggerForm.reset({ name: '', description: '', training_phrases: [''] });
  const trainingPhrases = this.trainingPhrases;
  while (trainingPhrases.length > 1) { trainingPhrases.removeAt(0); }
  trainingPhrases.reset(['']);
  this.showAiActionPanel = false;
  this.currentParent = null;
  this.selectedTrigger = null;
  this.editingName = false;
}

getNextOrder(parent: any): number {
  if (!parent) {
    const rootItems = this.combinedItems.filter(item => (item.itemType === 'action' && !item.parent_id) || (item.itemType === 'trigger' && item.parent_id === this.intentId));
    return rootItems.length > 0 ? Math.max(...rootItems.map(i => i.order)) + 1 : 1;
  } else {
    const siblings = this.combinedItems.filter(item => (item.parent_id === parent.id) || (item.parent_action_id === parent.action_id));
    return siblings.length > 0 ? Math.max(...siblings.map(i => i.order)) + 1 : 1;
  }
}


launchBot(intentId: number) {
  this.isLaunching = true;
  this.launchMessage = 'Preparing bot launch...';

  if (!intentId) {
    this.isLaunching = false;
    this.launchMessage = 'Error: No intent specified';
    return;
  }
  const branches = this.getBranchesFromCombinedItems(intentId);
  const payload = { root_intent_id: intentId, branches };
  
  this._httpService.mobileBankingPost('builder/flows/from-tree', payload).subscribe({
      next: (result: any) => {
        this.isLaunching = false;
        if (result.status === '00') {
          this.launchMessage = 'Bot launched successfully!';
          Swal.fire('ChatBot', 'Chatbot Launched Successfully, Test Now!!', 'success');
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
  const rootTriggers = this.combinedItems.filter((item: any) => item.itemType === 'trigger' && item.parent_id === rootId);

  for (const trigger of rootTriggers) {
    const branch: Branch = { intent_id: trigger.id, order: trigger.order || 1, actions: [], children: [] };
    const directActions = this.combinedItems.filter((item: any) => item.itemType === 'action' && item.intent_id === trigger.id);
    branch.actions = directActions.map((action: any) => ({ action_id: action.action_id, order: action.order || 1 }));
    if (trigger.children && trigger.children.length) {
      const nestedTriggers = trigger.children.filter((child: any) => child.itemType === 'trigger');
      for (const nestedTrigger of nestedTriggers) {
        branch.children.push(...this.getBranchesFromCombinedItems(nestedTrigger.id));
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
    this.showActionForm = false;
    this.showActionType = false;
    this.showTriggerType = false;
    this.showAiActionPanel = false;
    this.actionForm.reset({ action_type: 'send_message', name: '', message: '' });
    this.triggerForm.reset({ name: '', description: '', training_phrases: [''] });
    const trainingPhrases = this.triggerForm.get('training_phrases') as FormArray;
    while (trainingPhrases.length > 1) { trainingPhrases.removeAt(0); }
    trainingPhrases.reset(['']);
    this.editingName = false;
}

buildBranchPath(): string {
  return 'root>EBU Services Response>Product Licenses Response>Oracle Services Response';
}


sendBot(): void {
  const model = { name: this.form.value.name, description: this.form.value.description, intentId: this.intentId };
  this._httpService.mobileBankingPost('builder/chatbots', model).subscribe({
      next: (result: any) => {
        if (result.status === '00') {
          this.result = result.data;
          this.globalService.setChatbotId(result.data.id);
          this.globalService.setChatbotData(result.data);
          this.fetchData(this.intentId);
          Swal.fire('ChatBot', 'Bot created successfully!', 'success');
          this.form.reset();
          this.language = ['English'];
          this.defaultLanguage = 'English';
        } else {
          this._toastService.warning(result.message || 'Bot creation did not complete successfully.', 'Warning');
        }
      },
      error: (err: any) => {
        console.error('Bot creation failed:', err);
        this._toastService.error(err?.error?.message || 'An error occurred while creating the bot.', 'Error');
      }
    });
}


uploadImageClick(){}
removeImage(){}

public closeModal(): void {
    if(this.activeModal) {
        this.activeModal.dismiss('Cross click');
    }
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
        error: (err: any) => {
          this.isActive = !isChecked;
          inputElement.checked = !isChecked; // Revert UI
          Swal.fire('Error', err?.error?.message || 'An unexpected error occurred.', 'error');
        }
      });
  }
}