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

interface BaseItem {
  id: number;
  name: string;
  is_active: boolean;
  order: number;
  parent_id: number | null;
  itemType: 'action' | 'trigger';
}

interface TriggerItem extends BaseItem {
  intent_id: number;
  training_phrases: string[];
  itemType: 'trigger';
  children: Array<ActionItem | TriggerItem>;
  branch_path?: string;
}

interface ActionItem extends BaseItem {
  action_id: number;
  action_type: string;
  config: any;
  itemType: 'action';
}

interface ParentContext {
    id: number;
    itemType: 'trigger' | 'action';
    intent_id: number;
}

interface ActionModel {
    name: string;
    action_type: string;
    config: any;
    intent_id: number;
    parent_action_id: number | null;
    branch_path: string;
    order: number;
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
        private router: Router, 
        private _httpService: HttpService) {
        this.initializeForm();
    }

    ngOnInit() {
        this.intentId = +this.route.snapshot.paramMap.get('id')!;
        this.chatbotId = this.globalService.getChatbotId();

        console.log('Editing intent ID:', this.intentId);
        console.log('For chatbot ID:', this.chatbotId);

        this.fetchIntentList(this.chatbotId!);
         this.fetchNestedIntents(this.intentId);
        this.loadInitialData(); 
    
        if (this.intentId) {
            this.fetchNestedIntents(this.intentId);
         
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

getTriggerIcon(triggerType: string): string {
  const trigger = this.triggerTypes.find(t => t.type === triggerType);
  return trigger ? trigger.featherIcon : 'icon-mail'; 
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


getIndentLevel(item: BaseItem): number {
  if (!item.parent_id) return 0;
  
  // Find parent in combinedItems
  const parent = this.combinedItems.find(i => i.id === item.parent_id);
  
  // If parent not found, check in nested children
  if (!parent) {
    for (const trigger of this.combinedItems) {
      if (trigger.itemType === 'trigger') {
        const foundParent = this.findParentInChildren(trigger, item.parent_id);
        if (foundParent) {
          return this.getIndentLevel(foundParent) + 1;
        }
      }
    }
  }
  
  return parent ? this.getIndentLevel(parent) + 1 : 0;
}

private findParentInChildren(parent: TriggerItem, parentId: number): TriggerItem | null {
  if (parent.id === parentId) return parent;
  
  for (const child of parent.children || []) {
    if (child.itemType === 'trigger') {
      const found = this.findParentInChildren(child, parentId);
      if (found) return found;
    }
  }
  
  return null;
}

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
          this.isActive = !!intent.is_active; 
          this.fetchData(intentId);
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
  // this.fetchIntent(intentId);
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

fetchNestedIntents(intentId: number): void {
  this.loadingTriggers = true;
  const body = { parent_id: intentId };
  
  this._httpService.mobileBankingPost('builder/chatbots/nested-intents/children', body)
    .pipe(
      catchError(err => {
        console.error('Error fetching triggers:', err);
        return of({ status: '01', data: [] });
      })
    )
    .subscribe({
      next: (res: any) => {
        if (res.status === '00') {
          this.triggers = this.processApiResponse(res.data);
          this.combinedItems = this.flattenTriggerHierarchy(this.triggers);
        } else {
          this.triggers = [];
          this.combinedItems = [];
        }
        this.loadingTriggers = false;
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
      error: () => {
        this.triggers = [];
        this.combinedItems = [];
        this.loadingTriggers = false;
        this.isLoading = false;
        this.cdRef.detectChanges();
      }
    });
}

private processApiTriggers(trigger: any, parentId: number): TriggerItem {
  return {
    id: trigger.id,
    name: trigger.name,
    is_active: trigger.is_active,
    order: trigger.order,
    parent_id: parentId,
    intent_id: trigger.intent_id,
    training_phrases: trigger.training_phrases || [],
    itemType: 'trigger',
    children: [
      ...(trigger.actions || []).map((a: any) => this.transformAction(a, trigger.id)),
      ...(trigger.children || []).map((c: any) => this.processApiTriggers(c, trigger.id))
    ]
  };
}


private transformAction(action: any, parentId: number): ActionItem {
  return {
    id: action.id,
    action_id: action.id, 
    name: action.name,
    is_active: action.is_active,
    order: action.order,
    parent_id: parentId,
    action_type: action.action_type,
    config: action.config || {},
    itemType: 'action'
  };
}

getRootTriggers(): any[] {
  return this.combinedItems.filter(item => 
    item.itemType === 'trigger' && item.parent_id === this.intentId
  ).sort((a, b) => a.order - b.order);
}

getChildTriggers(parentId: number): any[] {
  return this.combinedItems.filter(item => 
    item.itemType === 'trigger' && item.parent_id === parentId
  ).sort((a, b) => a.order - b.order);
}

getDirectActions(parentId: number): any[] {
  return this.combinedItems.filter(item => 
    item.itemType === 'action' && item.parent_id === parentId
  ).sort((a, b) => a.order - b.order);
}

// Update your processApiResponse method to ensure proper hierarchy
private processApiResponse(data: any[]): TriggerItem[] {
  return data.map(item => {
    if (item.type !== 'trigger') return null;

    const trigger: TriggerItem = {
      id: item.id,
      name: item.name,
      is_active: item.is_active,
      order: item.order,
      parent_id: item.parent_id,
      intent_id: item.id,
      branch_path: item.branch_path,
      training_phrases: [],
      itemType: 'trigger',
      children: []
    };

    // Process direct children
    if (item.children && item.children.length) {
      // Direct actions
      const actions = item.children
        .filter((child: { type: string; }) => child.type === 'action')
        .map((child: any) => this.transformAction(child, item.id));
      
      // Nested triggers
      const triggers = item.children
        .filter((child: { type: string; }) => child.type === 'trigger')
        .map((child: any) => this.processApiResponse([child])[0])
        .filter(Boolean);
      
      // Combine all children
      trigger.children = [...actions, ...triggers];
    }

    return trigger;
  }).filter(Boolean) as TriggerItem[];
}

// Update flattenTriggerHierarchy to maintain proper structure
private flattenTriggerHierarchy(triggers: TriggerItem[]): (TriggerItem | ActionItem)[] {
  const result: (TriggerItem | ActionItem)[] = [];
  
  const flatten = (items: any[], level = 0) => {
    items.forEach(item => {
      // Add the item itself
      result.push({ ...item, indentLevel: level });
      
      // Recursively add children
      if (item.children && item.children.length) {
        flatten(item.children, level + 1);
      }
    });
  };
  
  flatten(triggers);
  return result;
}

trackById(index: number, item: any): number {
  return item.id || item.action_id;
}

getDisplayItems(): any[] {
  return this.combinedItems.filter(item => {
    if (!item.parent_id) return true;
    
    // Items whose parent exists in combinedItems
    return this.combinedItems.some(parent => parent.id === item.parent_id);
  });
}

toggleTriggerStatus(event: Event, trigger: any): void {
  const isChecked = (event.target as HTMLInputElement).checked;
  const payload = { intent_id: trigger.id, is_active: isChecked };
  
  this._httpService.mobileBankingPost('builder/nodes/intent/status', payload).subscribe({
    next: (res: any) => {
      if (res.status !== '00') {
        // Revert if API call fails
        (event.target as HTMLInputElement).checked = !isChecked;
        this._toastService.error(res.message || 'Failed to update trigger status');
      }
    },
    error: (err: any) => {
      (event.target as HTMLInputElement).checked = !isChecked;
      this._toastService.error(err.message || 'Error updating trigger status');
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

openTriggerForm(parentItem: any): void {
 this.showTriggerType = true;
  this.showActionForm = false;
  this.showActionType = false;
  this.showAiActionPanel = false; 
   this.initializeForm();

    this.currentParent = parentItem ? {
        id: parentItem.id,
        itemType: 'trigger',
        intent_id: parentItem.intent_id || parentItem.id
    } : null;
}

openActionType(parentItem: any): void {
  this.showActionType = true;
  this.fetchActionType();
  this.showActionForm = false;
  this.showAiActionPanel = false;
   this.showTriggerType = false;

   this.currentParent = parentItem ? {
        id: parentItem.id,
        itemType: parentItem.hasOwnProperty('action_type') ? 'action' : 'trigger',
        intent_id: parentItem.intent_id || parentItem.id
    } : null;
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

getNextOrder(parentItem: any): number {
    if (!parentItem || !parentItem.id) return 1;

    if (parentItem.itemType === 'trigger') {
        const triggerChildren = this.getChildTriggers(parentItem.id)?.length || 0;
        const actionChildren = this.getDirectActions(parentItem.id)?.length || 0;
        return triggerChildren + actionChildren + 1;
    } 
    
    if (parentItem.itemType === 'action') {
        const subActions = this.combinedItems?.filter(item =>
            item.parent_action_id === parentItem.id
        )?.length || 0;
        return subActions + 1;
    }

    return 1;
}

onActionSubmit(): void {
     if (!this.actionForm.valid) {
        this.markFormGroupTouched(this.actionForm);
        return;
    }

    const chatbotId = this.globalService.getChatbotId()!;
    let intentId: number;
    let parentActionId: number | null = null;
    let order: number;

    if (!this.currentParent) {
        // Root level action (when no records exist)
        intentId = this.intentId;
        parentActionId = null;
        order = 1;
    } else if (this.currentParent.itemType === 'trigger') {
        // Action under a trigger
        intentId = this.currentParent.id;
        parentActionId = null;
        order = 2; // Fixed order for actions directly under triggers
    } else {
        // Action under another action
        intentId = this.currentParent.intent_id;
        parentActionId = this.currentParent.id;
        order = this.getNextOrder(this.currentParent);
    }

    const model = {
        name: this.actionForm.value.name,
        action_type: this.selectedActionType || 'send_message',
        config: { message: this.actionForm.value.message },
        intent_id: intentId,
        parent_action_id: parentActionId,
        branch_path: this.buildBranchPath(),
        order: order
    };

    console.log('Submitting action with model:', model);


    this._httpService
      .mobileBankingPost('builder/nodes/action', model)
      .subscribe({
        next: (result: any) => {
          if (result.status === '00') {
            setTimeout(() => {
              this.result = result.data;
          
              this.fetchNestedIntents(this.intentId);
              this.checkAndCombine();
              this.cdRef.detectChanges();
            
              Swal.fire('Success', result.message, 'success');
              this.resetForm();

            }, 100);
          } else {
               Swal.fire({
                    icon: 'warning',
                    title: 'Unexpected Response',
                    text: result.message || 'Action creation completed with unexpected response'
                });
              this.resetForm();
          }
        },
        error: (err: any) => {
          console.error('Action creation failed:', err);
         Swal.fire({
                    icon: 'warning',
                    title: 'Unexpected Response',
                    text: err.message || 'Action creation completed with unexpected response'
                });
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

    let parent_id: number;
    let order: number;

    if (!this.currentParent) {
        // Root level trigger (when no records exist)
        parent_id = this.intentId;
        order = 1;
    } else {
        // Nested trigger
        parent_id = this.currentParent.id;
        order = this.getNextOrder(this.currentParent);
    }

    const model = { 
        ...this.triggerForm.value, 
        chatbot_id: chatbotId, 
        parent_id: parent_id, 
        order: order 
    };

    console.log('Submitting trigger with model:', model);

    this._httpService
      .mobileBankingPost('builder/nodes/intent', model)
      .subscribe({
        next: (result: any) => {
          if (result.status === '00') {
            setTimeout(() => {
              this.result = result.data;
          
              this.fetchNestedIntents(this.intentId);
              this.checkAndCombine();
              this.cdRef.detectChanges();
              Swal.fire('Success', 'Trigger/Intent added successfully!', 'success');
              this.resetTriggerForm();

            }, 100);
          } else {
               Swal.fire({
                    icon: 'warning',
                    title: 'Unexpected Response',
                    text: result.message || 'Intent creation completed with unexpected response'
                });
                 this.resetTriggerForm();
          }
        },
        error: (err: any) => {
          console.error('Intent creation failed:', err);
         Swal.fire({
                    icon: 'warning',
                    title: 'Unexpected Response',
                    text: err.message || 'Intent creation completed with unexpected response'
                });
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