import {ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
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

   @ViewChild('fileInput') fileInput!: ElementRef;

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
    // headers: FormArray;
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
     uploadedFile: File | null = null;
  
    carouselItemFiles: File[] = [];
    carouselItems: FormArray = this.fb.array([]);
    surveyQuestions: FormArray = this.fb.array([]);
    variables: FormArray = this.fb.array([]);
    carryVariables: FormArray = this.fb.array([]);
    requiredContext: FormArray = this.fb.array([]);
    quickReplies: FormArray = this.fb.array([]);
    allTriggers: any[] = [];
    teams: any[] = []; 
      isHovering = false;



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




  onFileHovered(isHovering: boolean) {
    this.isHovering = isHovering;
  }


triggerFileInput() {
  this.fileInput.nativeElement.click();
}


onFileDropped(event: any): void {
  const dragEvent = event as DragEvent;
  dragEvent.preventDefault();
  dragEvent.stopPropagation();
  
  if (dragEvent.dataTransfer?.files && dragEvent.dataTransfer.files.length > 0) {
    this.uploadedFile = dragEvent.dataTransfer.files[0];
  }
}
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    this.uploadedFile = input.files[0];
  }
}

addCarouselItem(): void {
  const items = this.actionForm.get('items') as FormArray;
  items.push(this.fb.group({
    title: ['', Validators.required],
    description: [''],
    item_type: ['image'],
    file: [null]
  }));
}


removeUploadedFile(): void {
  this.uploadedFile = null;
}

onCarouselItemFileSelected(event: Event, index: number): void {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    this.carouselItemFiles[index] = input.files[0];
  }
}

removeCarouselItem(index: number): void {
  this.carouselItems.removeAt(index);
  this.carouselItemFiles.splice(index, 1);
}

addSurveyQuestion(): void {
  this.surveyQuestions.push(this.fb.group({
    text: ['', Validators.required],
    type: ['text', Validators.required],
    required: [true],
    options: [''],
    min: [null],
    max: [null]
  }));
}

removeSurveyQuestion(index: number): void {
  this.surveyQuestions.removeAt(index);
}

addVariable(): void {
  this.variables.push(this.fb.group({
    name: ['', Validators.required],
    source: ['static', Validators.required],
    value: [''],
    expression: [''],
    contextKey: ['']
  }));
}

removeVariable(index: number): void {
  this.variables.removeAt(index);
}

addCarryVariable(): void {
  this.carryVariables.push(this.fb.control('', Validators.required));
}

removeCarryVariable(index: number): void {
  this.carryVariables.removeAt(index);
}

addRequiredContext(): void {
  this.requiredContext.push(this.fb.control('', Validators.required));
}

removeRequiredContext(index: number): void {
  this.requiredContext.removeAt(index);
}

addMessageVariant(): void {
  // Implement if you need multiple message variants
}

addQuickReply(): void {
  this.quickReplies.push(this.fb.control('', Validators.required));
}

removeQuickReply(index: number): void {
  this.quickReplies.removeAt(index);
}

// Initialize the form arrays in ngOnInit or when creating the form
initializeFormArrays(): void {
  this.actionForm = this.fb.group({
    // ... your existing form controls
    carouselItems: this.carouselItems,
    surveyQuestions: this.surveyQuestions,
    variables: this.variables,
    carryVariables: this.carryVariables,
    requiredContext: this.requiredContext,
    quickReplies: this.quickReplies
  });
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


get headers(): FormArray {
  return this.actionForm.get('headers') as FormArray;
}

addHeader(): void {
  this.headers.push(this.fb.group({
    key: ['', Validators.required],
    value: ['', Validators.required]
  }));
}

removeHeader(index: number): void {
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
  
  // check in nested children
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

getRootActions(): any[] {
  return this.combinedItems.filter(item => 
    item.itemType === 'action' && item.parent_id === this.intentId
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

private processApiResponse(data: any[]): TriggerItem[] {
  const result: TriggerItem[] = [];
  
  data.forEach(item => {
    if (item.type === 'trigger') {
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
          .filter((child: any) => child.type === 'action')
          .map((child: any) => this.transformAction(child, item.id));
        
        // Nested triggers
        const triggers = item.children
          .filter((child: any) => child.type === 'trigger')
          .map((child: any) => this.processApiResponse([child])[0])
          .filter(Boolean);
        
        // Combine all children
        trigger.children = [...actions, ...triggers];
      }

      result.push(trigger);
    } else if (item.type === 'action') {
      // Add root-level actions to combinedItems through flattenTriggerHierarchy
      const action = this.transformAction(item, item.parent_id);
      result.push(action as any); 
    }
  });

  return result;
}

private flattenTriggerHierarchy(triggers: TriggerItem[]): (TriggerItem | ActionItem)[] {
  const result: (TriggerItem | ActionItem)[] = [];
  
const flatten = (items: any[], level = 0) => {
    items.forEach(item => {
      // Add the item itself
      const newItem = { ...item, indentLevel: level };
      result.push(newItem);
      
      // Only triggers have children
      if (item.itemType === 'trigger' && item.children && item.children.length) {
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

// openActionForm(action: any): void {

//   this.selectedActionType = action.type;
//   this.showActionForm = true;
//   this.showActionType = false;
//   this.showAiActionPanel = false; 

//   if (action.type === 'send_message') {
//     this.actionForm = this.fb.group({ name: [action.name || '', Validators.required], action_type: ['send_message', Validators.required], message: ['', Validators.required] });
//   } else if (action.type === 'send_file') {
//     this.actionForm = this.fb.group({ name: [action.name || '', Validators.required], action_type: ['send_file', Validators.required], file_url: ['', Validators.required] });
//   } else if (action.type === 'http_request'){
//     this.actionForm = this.fb.group({ name: [action.name || '', Validators.required], action_type: ['http_request', Validators.required], url: ['', Validators.required] });
//   }
// }

openActionForm(action: any): void {
  this.selectedActionType = action.type;
  this.showActionForm = true;
  this.showActionType = false;
  this.showAiActionPanel = false;

  // Initialize form based on action type
  switch(action.type) {
    case 'send_message':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['send_message', Validators.required],
        message: ['', Validators.required]
      });
      break;
    
    case 'send_file':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['send_file', Validators.required],
        file_format: ['image', Validators.required],
        source: ['upload', Validators.required],
        file_url: ['']
      });
      break;
    
    case 'http_request':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['http_request', Validators.required],
        http_method: ['GET', Validators.required],
        url: ['', Validators.required],
        headers: this.fb.array([])
      });
      break;
    
    case 'loop':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['loop', Validators.required],
        collection: ['', Validators.required],
        action: ['', Validators.required]
      });
      break;
    
    case 'carousel':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['carousel', Validators.required],
        items: this.fb.array([])
      });
      break;
    
    case 'Jump_to_Trigger':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['Jump_to_Trigger', Validators.required],
        target_trigger: ['', Validators.required]
      });
      break;
    
    case 'webhook':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['webhook', Validators.required],
        url: ['', Validators.required],
        payload: ['']
      });
      break;
    
    case 'set_variable':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['set_variable', Validators.required],
        variable_name: ['', Validators.required],
        variable_value: ['', Validators.required]
      });
      break;
    
    case 'survey':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['survey', Validators.required],
        questions: this.fb.array([])
      });
      break;
    
    case 'create_ticket':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['create_ticket', Validators.required],
        ticket_type: ['', Validators.required],
        subject: ['', Validators.required],
        description: ['', Validators.required]
      });
      break;
    
    case 'human_handoff':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['human_handoff', Validators.required],
        team: ['', Validators.required],
        message: ['', Validators.required]
      });
      break;
    
    default:
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: [action.type || '', Validators.required]
      });
  }
}

openTriggerForm(parentItem: any): void {
  console.log('Opening trigger form for parent item:', parentItem);
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
  console.log('Opening action type for parent item:', parentItem);

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



// onActionSubmit(): void {
//   if (!this.actionForm.valid) {
//     this.markFormGroupTouched(this.actionForm);
//     return;
//   }

//   const chatbotId = this.globalService.getChatbotId()!;
//   let intentId: number;
//   let parent_id: number; // Can be intentId or triggerId
//   let order: number;

//   if (!this.currentParent) {
  
//     intentId = this.intentId;
//     parent_id = this.intentId; // Use intentId as parent
//     order = this.combinedItems.length > 0 
//       ? this.getNextRootOrder() 
//       : 1;
//   } else if (this.currentParent.itemType === 'trigger') {
//     // Action under a trigger
//     intentId = this.currentParent.id;
//     parent_id = this.currentParent.id; // Use trigger's ID as parent
//     order = this.getNextOrder(this.currentParent);
//   } else {
//     // Action under another action
//     intentId = this.currentParent.intent_id;
//     parent_id = this.currentParent.id; // Use parent action's ID
//     order = this.getNextOrder(this.currentParent);
//   }

//   console.log('Creating action under parent:', this.currentParent, 'with intentId:', intentId, 'and parent_id:', parent_id);

//   const model = {
//     name: this.actionForm.value.name,
//     action_type: this.selectedActionType || 'send_message',
//     config: { message: this.actionForm.value.message },
//     intent_id: intentId,
//     parent_id: parent_id, 
//     branch_path: this.buildBranchPath(),
//     order: order
//   };

//   console.log('Submitting action with model:', model);

//   this._httpService.mobileBankingPost('builder/nodes/action', model).subscribe({
//     next: (result: any) => {
//       if (result.status === '00') {
//         setTimeout(() => {
//           this.result = result.data;
//           this.fetchNestedIntents(this.intentId);
//           this.checkAndCombine();
//           this.cdRef.detectChanges();
//           Swal.fire('Success', result.message, 'success');
//           this.resetForm();
//         }, 100);
//       } else {
//         Swal.fire({
//           icon: 'warning',
//           title: 'Unexpected Response',
//           text: result.message || 'Action creation completed with unexpected response'
//         });
//         this.resetForm();
//       }
//     },
//     error: (err: any) => {
//       console.error('Action creation failed:', err);
//       Swal.fire({
//         icon: 'warning',
//         title: 'Unexpected Response',
//         text: err.message || 'Action creation completed with unexpected response'
//       });
//     }
//   });
// }




onActionSubmit(): void {
  if (!this.actionForm.valid) {
    this.markFormGroupTouched(this.actionForm);
    return;
  }

  const chatbotId = this.globalService.getChatbotId()!;
  let intentId: number;
  let parent_id: number;
  let order: number;

  if (!this.currentParent) {
    intentId = this.intentId;
    parent_id = this.intentId;
    order = this.combinedItems.length > 0 ? this.getNextRootOrder() : 1;
  } else if (this.currentParent.itemType === 'trigger') {
    intentId = this.currentParent.id;
    parent_id = this.currentParent.id;
    order = this.getNextOrder(this.currentParent);
  } else {
    intentId = this.currentParent.intent_id;
    parent_id = this.currentParent.id;
    order = this.getNextOrder(this.currentParent);
  }

  // Base model structure
  const baseModel = {
    name: this.actionForm.value.name,
    action_type: this.selectedActionType,
    intent_id: intentId,
    parent_id: parent_id,
    branch_path: this.buildBranchPath(),
    order: order
  };

  // Action-specific config
  let config: any = {};
  let formData = new FormData();

  switch(this.selectedActionType) {
    case 'send_message':
      config = {
        message: this.actionForm.value.message,
        quick_replies: this.actionForm.value.quick_replies || []
      };
      break;

    case 'send_file':
      if (this.actionForm.value.source === 'upload') {
        // Handle file upload with FormData
        formData.append('name', this.actionForm.value.name);
        formData.append('action_type', 'send_file');
        formData.append('intent_id', intentId.toString());
        formData.append('parent_id', parent_id.toString());
        formData.append('source_type', 'upload');
        formData.append('file_type', this.actionForm.value.file_format);
        formData.append('caption', this.actionForm.value.caption || '');
        if (this.uploadedFile) {
          formData.append('file', this.uploadedFile);
        }
      } else {
        config = {
          source_type: this.actionForm.value.source,
          file_url: this.actionForm.value.file_url,
          file_type: this.actionForm.value.file_format,
          caption: this.actionForm.value.caption || ''
        };
      }
      break;

    case 'http_request':
      config = {
        url: this.actionForm.value.url,
        method: this.actionForm.value.http_method,
        headers: this.actionForm.value.headers || {},
        timeout: 30,
        retry_policy: {
          attempts: 3,
          delay: 1
        }
      };
      break;

    case 'loop':
      config = {
        collection: this.actionForm.value.collection,
        action: this.actionForm.value.action,
        max_iterations: this.actionForm.value.max_iterations || 100
      };
      break;

    case 'carousel':
      // For carousel with file uploads, use FormData
      if (this.hasFileUploads()) {
        formData.append('name', this.actionForm.value.name);
        formData.append('action_type', 'carousel');
        formData.append('intent_id', intentId.toString());
        formData.append('parent_id', parent_id.toString());
        formData.append('display_type', this.actionForm.value.display_type || 'slider');
        
        this.actionForm.value.items.forEach((item: any, index: number) => {
          formData.append(`items[${index}][title]`, item.title);
          formData.append(`items[${index}][description]`, item.description);
          formData.append(`items[${index}][item_type]`, item.item_type);
          if (item.file) {
            formData.append(`items[${index}][file]`, item.file);
          }
        });
      } else {
        config = {
          display_type: this.actionForm.value.display_type || 'slider',
          auto_advance: this.actionForm.value.auto_advance || false,
          items: this.actionForm.value.items || []
        };
      }
      break;

    case 'Jump_to_Trigger':
      config = {
        target: this.actionForm.value.target_trigger,
        condition: this.actionForm.value.condition || {},
        context_updates: this.actionForm.value.context_updates || {}
      };
      break;

    case 'webhook':
      config = {
        url: this.actionForm.value.url,
        method: this.actionForm.value.method || 'POST',
        payload: this.actionForm.value.payload || {},
        headers: this.actionForm.value.headers || {}
      };
      break;

    case 'set_variable':
      config = {
        variables: {
          [this.actionForm.value.variable_name]: {
            value: this.actionForm.value.variable_value,
            source: "static"
          }
        },
        overwrite: true,
        clear_on_session_end: false
      };
      break;

    case 'survey':
      config = {
        questions: this.actionForm.value.questions || [],
        completion_message: this.actionForm.value.completion_message || 'Thank you for your feedback!',
        persist_responses: this.actionForm.value.persist_responses !== false
      };
      break;

    case 'create_ticket':
      config = {
        ticket_type: this.actionForm.value.ticket_type,
        subject: this.actionForm.value.subject,
        description: this.actionForm.value.description,
        priority: this.actionForm.value.priority || 'medium'
      };
      break;

    case 'human_handoff':
      config = {
        mode: this.actionForm.value.mode || 'direct',
        team_id: this.actionForm.value.team,
        priority: this.actionForm.value.priority || 1,
        handoff_message: this.actionForm.value.message,
        fallback_options: {
          delay: 15,
          fallback_message: 'All agents are busy. We\'ll contact you shortly.'
        }
      };
      break;

    default:
      config = this.actionForm.value.config || {};
  }

  // For actions that don't require file upload
  if (formData.getAll('name').length === 0) {
    const model = {
      ...baseModel,
      config: config
    };

    console.log('Creating action under parent:', this.currentParent, 'with intentId:', intentId, 'and parent_id:', parent_id);
    console.log('Submitting action with model:', model);
    this.submitAction(model);
  } else {
    // For actions with file upload (FormData)
    console.log('Submitting action with FormData');
    this.submitFormDataAction(formData);
  }
}

// Helper method to submit regular JSON payload
private submitAction(model: any): void {
  this._httpService.mobileBankingPost('builder/nodes/action', model).subscribe({
    next: (result: any) => this.handleActionResponse(result),
    error: (err: any) => this.handleActionError(err)
  });
}

// Helper method to submit FormData payload
private submitFormDataAction(formData: FormData): void {
  this._httpService.mobileBankingPostFormData('builder/nodes/action', formData).subscribe({
    next: (result: any) => this.handleActionResponse(result),
    error: (err: any) => this.handleActionError(err)
  });
}

// Handle successful response
private handleActionResponse(result: any): void {
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
}

// Handle error response
private handleActionError(err: any): void {
  console.error('Action creation failed:', err);
  Swal.fire({
    icon: 'error',
    title: 'Action Creation Failed',
    text: err.message || 'Failed to create action. Please try again.'
  });
}

// Helper to check if we have file uploads
private hasFileUploads(): boolean {
  return this.selectedActionType === 'send_file' && this.actionForm.value.source === 'upload' ||
         this.selectedActionType === 'carousel' && this.actionForm.value.items.some((item: any) => item.file);
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

  //parent_id and order
  let parent_id: number;
  let order: number;

  if (this.currentParent) {
    console.log('Creating nested trigger under:', this.currentParent);

    parent_id = this.currentParent.id;
    console.log('Parent ID for nested trigger:', parent_id);

    order = this.getNextOrder(this.currentParent);
  } else {
    // For root-level triggers - use intentId
    parent_id = this.intentId;
    order = this.combinedItems.length > 0 
      ? this.getNextRootOrder() 
      : 1; // First item gets order 1
  }

  const model = { 
    ...this.triggerForm.value,
    chatbot_id: chatbotId,
    parent_id: parent_id,
    order: order,
    // is_root: parent_id === this.intentId // Mark as root if parent is intent
  };

  console.log('Submitting Trigger with model:', model);

  this._httpService.mobileBankingPost('builder/nodes/intent', model).subscribe({
    next: (result: any) => {
      if (result.status === '00') {
        console.log('Created trigger with ID:', result.data.id);
        this.fetchNestedIntents(this.intentId);
        this.cdRef.detectChanges();
        Swal.fire('Success', 'Trigger created!', 'success');
        this.resetTriggerForm();
      } else {
        Swal.fire('Error', result.message || 'Creation failed', 'error');
      }
    },
    error: (err: { message: any; }) => {
      console.error('Creation error:', err);
      Swal.fire('Error', err.message || 'Request failed', 'error');
    }
  });
}

// order for root triggers
getNextRootOrder(): number {
  const rootTriggers = this.combinedItems.filter(item => 
    item.itemType === 'trigger' && item.parent_id === this.intentId
  );
  return rootTriggers.length + 1;
}

// getNextOrder to handle nested items
getNextOrder(parentItem: any): number {
  if (!parentItem) return 1;
  
  // Get all direct children of this parent
  const children = this.combinedItems.filter(item => 
    item.parent_id === parentItem.id
  );
  
  return children.length + 1;
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