import {ChangeDetectorRef, Component, ElementRef, Input, OnInit, SecurityContext, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from '@angular/router'; // Added Router
import { catchError, forkJoin, of, tap } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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

interface FileTypeInfo {
  accept: string;
  types: string;
  maxSize: string;
}

interface FileTypeInfoMap {
  image: FileTypeInfo;
  document: FileTypeInfo;
  video: FileTypeInfo;
  audio: FileTypeInfo;
  [key: string]: FileTypeInfo; // Index signature for dynamic access
}

interface FileSizeMap {
  image: number;
  document: number;
  video: number;
  audio: number;
  [key: string]: number; // Index signature for dynamic access
}

type FileFormat = 'image' | 'document' | 'video' | 'audio';
type FileSource = 'upload' | 'link' | 'chat_script';
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

@Component({
    selector: 'app-intent',
    templateUrl: './intent.component.html',
    styleUrls: ['./intent.component.scss']
})
export class IntentComponent implements OnInit {

    @ViewChild('fileUpload', { static: false }) fileInput!: ElementRef<HTMLInputElement>;
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
    filePreviews: { [key: number]: SafeUrl } = {};


    actionIcons: { [key: string]: string } = {
    send_message: 'icon-message-square',      
    send_file: 'icon-file-text',              
    http_request: 'icon-link',                 
    webhook: 'icon-zap',                       
    loop: 'icon-refresh-cw',                   
    conditional: 'icon-code',                
    carousel: 'icon-layers',                   
    Jump_to_Trigger: 'icon-corner-down-right', 
    set_variable: 'icon-sliders',              
    survey: 'icon-edit-3',  
    human_handoff: 'icon-user',                
    create_ticket: 'icon-clipboard'        
  };

    triggers: any;
    currentParentIntentId: number | null = null;
    uploadedFile: File | null = null;
    carouselItemFiles: { [key: number]: File } = {};
    carouselItems: FormArray = this.fb.array([]);
    requiredContext: FormArray = this.fb.array([]);
    quickReplies: FormArray = this.fb.array([]);
    allTriggers: any[] = [];
    teams: any[] = []; 
    isHovering = false;



constructor(
        private sanitizer: DomSanitizer,
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
    
surveyCompleted = false;
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

    // Update your methods
getFilePreview(file: File): SafeUrl {
  const url = URL.createObjectURL(file);
  return this.sanitizer.bypassSecurityTrustUrl(url);
}



calculateIndentLevel(item: any): number {
  if (!item.parent_id) return 0;
  const parent = this.combinedItems.find(i => i.id === item.parent_id);
  return parent ? this.calculateIndentLevel(parent) + 1 : 0;
}

fileTypeInfo: FileTypeInfoMap = {
  image: {
    accept: 'image/*',
    types: 'JPG/JPEG, PNG, GIF',
    maxSize: '20MB'
  },
  document: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    types: 'PDF, DOC, DOCX, XLS, XLSX',
    maxSize: '50MB'
  },
  video: {
    accept: 'video/*,.mp4,.mov,.avi',
    types: 'MP4, MOV, AVI',
    maxSize: '100MB'
  },
  audio: {
    accept: 'audio/*,.mp3,.wav,.aac',
    types: 'MP3, WAV, AAC',
    maxSize: '50MB'
  }
};

private sizeMap: FileSizeMap = {
  image: 20 * 1024 * 1024,    // 20MB
  document: 50 * 1024 * 1024, // 50MB
  video: 100 * 1024 * 1024,   // 100MB
  audio: 50 * 1024 * 1024     // 50MB
};


getFileAcceptTypes(): string {
  const format = this.actionForm?.value.file_format as keyof FileTypeInfoMap;
  return this.fileTypeInfo[format]?.accept || '';
}

getMaxFileSize(format: keyof FileSizeMap): number {
  return this.sizeMap[format] || 20 * 1024 * 1024; // Default to 20MB
}


onFileHovered(isHovering: boolean): void {
  this.isHovering = isHovering;
}

triggerFileInput(): void {
  if (this.fileInput?.nativeElement) {
    this.fileInput.nativeElement.click();
  } else {
    console.error('File input element not found');
  }
}

onFileDropped(event: any): void {
  const dragEvent = event as DragEvent;
  dragEvent.preventDefault();
  dragEvent.stopPropagation();
  
  if (dragEvent.dataTransfer?.files && dragEvent.dataTransfer.files.length > 0) {
    this.uploadedFile = dragEvent.dataTransfer.files[0];
  }
}

removeUploadedFile(): void {
  this.uploadedFile = null;
  // Reset the file input
  this.fileInput.nativeElement.value = '';
  // You might want to update your form control here if needed
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

addQuickReply(): void {
  this.quickReplies.push(this.fb.control('', Validators.required));
}

removeQuickReply(index: number): void {
  this.quickReplies.removeAt(index);
}

// Initialize the form arrays 
initializeFormArrays(): void {
  this.actionForm = this.fb.group({
   
    carouselItems: this.carouselItems,
    surveyQuestions: this.surveyQuestions,
    variables: this.variables,
    carryVariables: this.carryVariables,
    requiredContext: this.requiredContext,
    quickReplies: this.quickReplies
  });
}

removeTrueStep(index: number) {
  this.trueSteps.removeAt(index);
}

removeFalseStep(index: number) {
  this.falseSteps.removeAt(index);
}

removeContextMapKey(key: string) {
  const cmGroup = this.actionForm.get('context_map') as FormGroup;
  cmGroup.removeControl(key);
}

addVariable() {
  this.variables.push(
    this.fb.group({
      name: [''],
      source: ['static'],
      value: [''],
      expression: [''],
      context_key: ['']
    })
  );
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



removeCarouselItemFile(index: number): void {
  // Clean up blob URL
  if (this.filePreviews[index]) {
    URL.revokeObjectURL(this.filePreviews[index] as any);
  }
  
  delete this.carouselItemFiles[index];
  delete this.filePreviews[index];
  this.cdRef.detectChanges();
}

isImageFile(file: File): boolean {
  return file?.type.startsWith('image/');
}

isVideoFile(file: File): boolean {
  return file?.type.startsWith('video/');
}

// Initialize carousel form
initCarouselForm(): void {
  this.actionForm = this.fb.group({
    name: ['', Validators.required],
    action_type: ['carousel', Validators.required],
    display_type: ['slider', Validators.required],
    auto_advance: [false],
    advance_interval: [5, [Validators.min(1), Validators.max(60)]],
    items: this.carouselItems
  });
}

// carousel item
addCarouselItem() {
  this.carouselItems.push(this.fb.group({
    title: [''],
    description: [''],
    item_type: ['image'],
    action_url: ['', Validators.pattern('https?://.+')]
  }));
}


// Remove carousel item
removeCarouselItem(index: number): void {
  this.carouselItems.removeAt(index);
  delete this.carouselItemFiles[index];
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

get trueSteps() {
  return this.actionForm.get('true_steps') as FormArray;
}
get falseSteps() {
  return this.actionForm.get('false_steps') as FormArray;
}

addTrueStep() {
  this.trueSteps.push(this.fb.control(''));
}
addFalseStep() {
  this.falseSteps.push(this.fb.control(''));
}

// dynamically add context_map keys
get contextMapKeys() {
  return Object.keys(this.actionForm.get('context_map')?.value || {});
}

addContextMapKey(key: string) {
  const cmGroup = this.actionForm.get('context_map') as FormGroup;
  cmGroup.addControl(key, this.fb.control(''));
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

onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    const file = input.files[0];
    const format = this.actionForm.value.file_format as keyof FileTypeInfoMap;
    
    if (file.size > this.getMaxFileSize(format)) {
      this._toastService.error(
        `File exceeds maximum size of ${this.fileTypeInfo[format].maxSize}`, 
        'Error'
      );
      input.value = ''; // Clear the invalid file
      return;
    }
    
    this.uploadedFile = file;
  }
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

updateFileInstructions(): void {
  this.cdRef.detectChanges();
}

get variables(): FormArray {
  return this.actionForm.get('variables') as FormArray;
}

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
        source: ['upload', Validators.required], // Default to 'upload'
        file_url: ['', [Validators.pattern('https?://.+')]],
        chat_script: [''],
        caption: ['']
      });

      // Clear any existing files
      this.uploadedFile = null;
      
      // Set up conditional validation
      this.actionForm.get('source')?.valueChanges.subscribe(source => {
        const fileUrlControl = this.actionForm.get('file_url');
        const chatScriptControl = this.actionForm.get('chat_script');
        
        if (source === 'link') {
          fileUrlControl?.setValidators([Validators.required, Validators.pattern('https?://.+')]);
          chatScriptControl?.clearValidators();
        } 
        else if (source === 'chat_script') {
          fileUrlControl?.clearValidators();
          chatScriptControl?.setValidators([Validators.required]);
        }
        else { // upload
          fileUrlControl?.clearValidators();
          chatScriptControl?.clearValidators();
        }
        
        fileUrlControl?.updateValueAndValidity();
        chatScriptControl?.updateValueAndValidity();
      });
      break;

    case 'carousel':
      // Initialize or reset carousel items
      this.carouselItems = this.fb.array([]);
      this.carouselItemFiles = {};
      
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['carousel', Validators.required],
        display_type: [action.config?.display_type || 'slider', Validators.required],
        auto_advance: [action.config?.auto_advance || false],
        advance_interval: [action.config?.advance_interval || 5, [Validators.min(1), Validators.max(60)]],
        items: this.carouselItems
      });

      // If editing existing carousel, populate items
      if (action.config?.items) {
        action.config.items.forEach((item: any, index: number) => {
          const itemGroup = this.fb.group({
            title: [item.title || '', Validators.required],
            description: [item.description || ''],
            item_type: [item.item_type || 'image'],
            action_url: [item.action_url || '', Validators.pattern('https?://.+')]
          });
          this.carouselItems.push(itemGroup);
          
          // Note: For editing, you might need to handle existing files differently
          // since you can't repopulate file inputs due to browser security
        });
      } else {
        // Add one empty item by default
        this.addCarouselItem();
      }
      break;
    
    case 'http_request':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['http_request', Validators.required],
        http_method: [action.config?.method || 'GET', Validators.required],
        url: [action.config?.url || '', Validators.required],
        headers: this.fb.array([]), // we'll populate below
        request_body: [action.config?.body ? JSON.stringify(action.config.body, null, 2) : ''],
        timeout: [action.config?.timeout || 30, [Validators.required, Validators.min(1), Validators.max(60)]]
      });

      // Populate headers if editing existing
      if (action.config?.headers) {
        Object.entries(action.config.headers).forEach(([key, value]) => {
          this.headers.push(
            this.fb.group({
              key: [key],
              value: [value]
            })
          );
        });
      }
      break;
    
    case 'conditional':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['conditional', Validators.required],
        condition: ['', Validators.required],
        true_steps: this.fb.array([]),   // Array of step IDs/names
        false_steps: this.fb.array([]),  // Array of step IDs/names
        context_map: this.fb.group({})   // Key/value expressions
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
    
   case 'Jump_to_Trigger':
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: ['Jump_to_Trigger', Validators.required],
        target_trigger: [action.config?.target || '', Validators.required],

        // Nested form group for condition
        condition: this.fb.group({
          expression: [action.config?.condition?.expression || ''],
          negate: [action.config?.condition?.negate || false]
        }),

        // Stringified JSON in the textarea
        context_updates: [
          action.config?.context_updates
            ? JSON.stringify(action.config.context_updates, null, 2)
            : ''
        ],

        // Array of carry variables
        carry_variables: this.fb.array([])
      });

      // Populate carry variables if editing
      if (action.config?.carry_variables?.length) {
        action.config.carry_variables.forEach((v: any) => {
          this.carryVariables.push(this.fb.control(v));
        });
      }
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
        variables: this.fb.array([]),
        overwrite: [action.config?.overwrite ?? true],
        clear_on_session_end: [action.config?.clear_on_session_end ?? false]
      });

      // If editing an existing action
      if (action.config?.variables) {
        Object.entries(action.config.variables).forEach(([varName, varConfig]: any) => {
          this.variables.push(this.fb.group({
            name: [varName, Validators.required],
            source: [varConfig.source || 'static', Validators.required],
            value: [varConfig.value || ''],
            expression: [varConfig.expression || ''],
            context_key: [varConfig.context_key || '']
          }));
        });
      }

      if (this.variables.length === 0) {
        this.variables.push(this.fb.group({
          name: [''],
          source: ['static'],
          value: [''],
          expression: [''],
          context_key: ['']
        }));
      }
      break;
    
    case 'survey':
      this.initSurveyForm();
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
        mode: [action.config?.mode || 'hybrid', Validators.required],
        handoff_message: [action.config?.handoff_message || '', Validators.required],
        team_id: [action.config?.team_id || '', Validators.required],
        priority: [action.config?.priority || 2, Validators.required],
        required_context: this.fb.array(
          (action.config?.required_context || []).map((ctx: any) => this.fb.control(ctx))
        ),
        fallback_options: this.fb.group({
          delay: [action.config?.fallback_options?.delay || 15, [Validators.required, Validators.min(5), Validators.max(300)]],
          fallback_message: [action.config?.fallback_options?.fallback_message || '', Validators.required]
        })
      });
      break;

    
    default:
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: [action.type || '', Validators.required]
      });
  }
}

createSurveyForm() {
  this.actionForm = this.fb.group({
    name: ['Customer Feedback Survey', Validators.required],
    action_type: ['survey', Validators.required],
    config: this.fb.group({
      questions: this.fb.array([]),
      completion_message: ['Thank you for your feedback!'],
      persist_responses: [true]
    })
  });

  //initial question if needed
  this.addSurveyQuestion();
}

// In your component class
initSurveyForm() {
  this.actionForm = this.fb.group({
    name: ['Customer Feedback Survey', Validators.required],
    action_type: ['survey', Validators.required],
    config: this.fb.group({
      questions: this.fb.array([]),  
      completion_message: ['Thank you for your feedback!'],
      persist_responses: [true]
    })
  });
  this.addSurveyQuestion(); 
}

addSurveyQuestion() {
  // Safely get the questions FormArray
  const questions = this.actionForm?.get('config.questions') as FormArray;
  
  if (!questions) {
    console.error('Questions FormArray not found!');
    return;
  }

  questions.push(this.fb.group({
    id: ['q' + (questions.length + 1)],
    text: ['How satisfied are you? (1-5)', Validators.required],
    type: ['number', Validators.required],
    validation: this.fb.group({
      min: [1],
      max: [5]
    }),
    required: [false]
  }));
}

resetSurveyForm() {
  const questions = this.surveyQuestions;
  while (questions.length > 0) {
    questions.removeAt(0);
  }
  this.addSurveyQuestion(); 
}

get surveyQuestions(): FormArray {
  if (!this.actionForm || !this.actionForm.get('config.questions')) {
    console.error('Form controls not initialized!');
    return this.fb.array([]); // Return empty array as fallback
  }
  return this.actionForm.get('config.questions') as FormArray;
}

updateQuestionValidation(questionIndex: number) {
  const questionGroup = this.surveyQuestions.at(questionIndex) as FormGroup;
  const questionType = questionGroup.get('type')?.value;
  
  questionGroup.removeControl('validation');
  questionGroup.removeControl('options');

  switch(questionType) {
    case 'number':
    case 'rating':
      questionGroup.addControl('validation', this.fb.group({
        min: [1],
        max: [5]
      }));
      break;
      
    case 'choice':
      questionGroup.addControl('options', this.fb.control('', Validators.required));
      break;
  }
}

removeSurveyQuestion(index: number) {
  const questions = this.actionForm.get('config.questions') as FormArray;
  questions.removeAt(index);
}

//these methods to your component class
getQuestionControl(question: AbstractControl, path: string): FormControl {
  const control = question.get(path);
  if (!control) {
    throw new Error(`Control not found at path: ${path}`);
  }
  return control as FormControl;
}

getConfigControl(path: string): FormControl {
  const control = this.actionForm.get(`config.${path}`);
  if (!control) {
    throw new Error(`Control not found at path: config.${path}`);
  }
  return control as FormControl;
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

// Getter for carry_variables
get carryVariables(): FormArray {
  return this.actionForm.get('carry_variables') as FormArray;
}

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

  // Handle different action types
  switch(this.selectedActionType) {
    case 'send_message':
      //send_message functionality
      const sendMessageModel = {
        ...baseModel,
        config: {
          message: this.actionForm.value.message,
          quick_replies: this.quickReplies.value || []
        }
      };
      this.submitAction(sendMessageModel);
      break;

    case 'send_file':
      this.handleSendFileAction(intentId, parent_id, order);
      break;

    case 'http_request':
      const headersObj: { [key: string]: string } = {};
      this.actionForm.value.headers.forEach((h: any) => {
        if (h.key && h.value) {
          headersObj[h.key] = h.value;
        }
      });

      let parsedBody = {};
      if (this.actionForm.value.request_body) {
        try {
          parsedBody = JSON.parse(this.actionForm.value.request_body);
        } catch {
          Swal.fire('Error', 'Invalid JSON in request body', 'error');
          return;
        }
      }

      const httpRequestModel = {
        ...baseModel,
        config: {
          url: this.actionForm.value.url,
          method: this.actionForm.value.http_method,
          headers: headersObj,
          body: parsedBody,
          timeout: this.actionForm.value.timeout || 30,
          retry_policy: { attempts: 3, delay: 1 } // optional default
        }
      };

      this.submitAction(httpRequestModel);
      break;

    case 'conditional':
      const conditionalModel = {
        ...baseModel,
        config: {
          condition: this.actionForm.value.condition,
          true_steps: this.actionForm.value.true_steps,
          false_steps: this.actionForm.value.false_steps,
          context_map: this.actionForm.value.context_map
        }
      };
      this.submitAction(conditionalModel);
      break;

    case 'loop':
      const loopModel = {
        ...baseModel,
        config: {
          collection: this.actionForm.value.collection,
          action: this.actionForm.value.action,
          max_iterations: this.actionForm.value.max_iterations || 100
        }
      };
      this.submitAction(loopModel);
      break;

    case 'carousel':
      this.handleCarouselAction(intentId, parent_id, order);
      break;


    case 'Jump_to_Trigger':
      let parsedContextUpdates = {};
      try {
        parsedContextUpdates = this.actionForm.value.context_updates
          ? JSON.parse(this.actionForm.value.context_updates)
          : {};
      } catch (e) {
        console.error("Invalid JSON in context_updates", e);
        alert("Please enter valid JSON in Context Updates.");
        return; // stop submission
      }

      const jumpModel = {
        ...baseModel,
        config: {
          target_trigger: this.actionForm.value.target_trigger,
          condition: this.actionForm.value.condition,
          context_updates: parsedContextUpdates,
          carry_variables: this.carryVariables.value || []
        }
      };
      
      this.submitAction(jumpModel);
      break;

    case 'set_variable':
        const setVariableModel = {
        ...baseModel,
        config: {
          variables: this.variables.value.reduce((acc: any, v: any) => {
            acc[v.name] = {
              source: v.source,
              ...(v.source === 'static' && { value: v.value }),
              ...(v.source === 'expression' && { expression: v.expression }),
              ...(v.source === 'context' && { context_key: v.context_key })
            };
            return acc;
          }, {}),
          overwrite: this.actionForm.value.overwrite,
          clear_on_session_end: this.actionForm.value.clear_on_session_end
        }
      };
      this.submitAction(setVariableModel);
      break;

    case 'survey':
      const surveyModel = {
        ...baseModel,
        config: {
          questions: this.actionForm.value.config.questions.map((q: any, idx: number) => {
            const question: any = {
              id: q.id || `q${idx + 1}`,
              text: q.text?.trim(),
              type: q.type,
              required: !!q.required
            };

            if (q.type === 'number') {
              question.validation = {
                min: q.min ?? 1,
                max: q.max ?? 5
              };
            }

            if (q.type === 'choice') {
              const opts = q.options
                ? q.options.split(',').map((opt: string) => opt.trim()).filter(Boolean)
                : [];
              if (opts.length === 0) {
                opts.push('Option 1'); 
              }
              question.options = opts;
            }

            return question;
          }),
          completion_message: this.actionForm.value.config.completion_message?.trim() || 'Thank you for your feedback!',
          persist_responses: this.actionForm.value.config.persist_responses !== false
        }
      };

      // Frontend validation
      if (!this.surveyQuestions || this.surveyQuestions.length === 0) {
        Swal.fire('Error', 'Please add at least one survey question', 'error');
        return;
      }

      this.submitAction(surveyModel);
      break;

    case 'human_handoff':
      const handoffModel = {
        ...baseModel,
        config: {
          mode: this.actionForm.value.mode || 'direct',
          team_id: this.actionForm.value.team_id,
          priority: this.actionForm.value.priority || 2,
          handoff_message: this.actionForm.value.handoff_message,
          required_context: this.actionForm.value.required_context || [],
          fallback_options: {
            delay: this.actionForm.value.fallback_options?.delay || 15,
            fallback_message: this.actionForm.value.fallback_options?.fallback_message || 
              "All agents are busy. We'll contact you shortly."
          }
        }
      };
      this.submitAction(handoffModel);
      break;


    default:
      // Generic action handler
      const defaultModel = {
        ...baseModel,
        config: this.actionForm.value.config || {}
      };
      this.submitAction(defaultModel);
  }
   console.log('Creating action under parent:', this.currentParent, 'with intentId:', intentId, 'and parent_id:', parent_id);
}

private handleSendFileAction(intentId: number, parent_id: number, order: number): void {
  const sourceType = this.actionForm.value.source;
  const fileFormat = this.actionForm.value.file_format;
  const caption = this.actionForm.value.caption || '';

  // Validate based on source type
  if (sourceType === 'upload' && !this.uploadedFile) {
    Swal.fire('Error', "Please upload a file first", 'error');
    return;
  }

  if (sourceType === 'link' && !this.actionForm.value.file_url) {
    Swal.fire('Error', "Please provide a file URL", 'error');
    return;
  }

  if (sourceType === 'chat_script' && !this.actionForm.value.chat_script) {
    Swal.fire('Error', "Please enter a chat script", 'error');
    return;
  }

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append('name', this.actionForm.value.name);
  formData.append('action_type', 'send_file');
  formData.append('intent_id', intentId.toString());
  formData.append('parent_id', parent_id.toString());
  formData.append('order', order.toString());

  // config as JSON string
  const config = {
    name: this.actionForm.value.name,
    intent_id: intentId,
    caption: caption,
    file_type: this.getFileType(fileFormat),
    order: order,
    source_type: sourceType
  };
  formData.append('config', JSON.stringify(config));
  // formData.append('branch_path', this.buildBranchPath());
  

  // Handle different source types
  if (sourceType === 'upload') {
    formData.append('files', this.uploadedFile!);
   
    // Use the multipart endpoint
    this._httpService.mobileBankingPostFormData('builder/nodes/action-multipart', formData).subscribe({
      next: (result: any) => this.handleActionResponse(result),
      error: (err: any) => this.handleActionError(err)
    });
  } else if (sourceType === 'chat_script') {
    // For chat script, use regular JSON endpoint
    const model = {
      ...config,
      script_content: this.actionForm.value.chat_script,
      file_type: 'text'
    };

    console.log('Submitting Model Form:', model);
    this._httpService.mobileBankingPost('builder/nodes/action', model).subscribe({
      next: (result: any) => this.handleActionResponse(result),
      error: (err: any) => this.handleActionError(err)
    });
  } else {
    // For URL-based file
    const model = {
      ...config,
      file_url: this.actionForm.value.file_url
    };
    
    console.log('Submitting Model form:', model);
    this._httpService.mobileBankingPost('builder/nodes/action', model).subscribe({
      next: (result: any) => this.handleActionResponse(result),
      error: (err: any) => this.handleActionError(err)
    });
  }
}

private getFileType(format: string): string {
  switch(format) {
    case 'image': return 'image/*';
    case 'document': return 'application/pdf,application/msword,application/vnd.ms-excel';
    case 'video': return 'video/*';
    case 'audio': return 'audio/*';
    default: return 'application/octet-stream';
  }
}

onCarouselItemFileSelected(event: Event, index: number): void {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  const itemType = this.carouselItems.at(index).get('item_type')?.value;

  if (itemType === 'image' && !file.type.startsWith('image/')) {
     Swal.fire('Error', 'Please select an image file', 'error');
    return;
  }

  if (itemType === 'video' && !file.type.startsWith('video/')) {
     Swal.fire('Error', 'Please select a video file', 'error');
    return;
  }

  // Validate file size
  const maxSize = itemType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxSize) {
     Swal.fire('Error', `File too large. Max ${maxSize/1024/1024}MB allowed`, 'error');
    return;
  }

  this.cleanupFileResources(index);

  this.carouselItemFiles[index] = file;
  this.filePreviews[index] = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
  
  // Update form validity
  this.carouselItems.at(index).markAsDirty();
  this.cdRef.detectChanges();
}

private cleanupFileResources(index: number): void {
  // Revoke previous object URL
  if (this.filePreviews[index]) {
    const unsafeUrl = this.sanitizer.sanitize(
      SecurityContext.RESOURCE_URL, 
      this.filePreviews[index]
    );
    if (unsafeUrl) URL.revokeObjectURL(unsafeUrl);
  }
  
  delete this.carouselItemFiles[index];
  delete this.filePreviews[index];
}

private handleCarouselAction(intentId: number, parent_id: number, order: number): void {
  // Validate form before submission
  if (this.actionForm.invalid) {
    this.markFormGroupTouched(this.actionForm);
    Swal.fire('Error', 'Please fill all required fields correctly', 'error');
    return;
  }

  // Enhanced file validation
  const invalidItems = this.carouselItems.controls
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => {
      const itemType = item.get('item_type')?.value;
      const requiresFile = ['image', 'video'].includes(itemType);
      return requiresFile && !this.carouselItemFiles[index];
    });

  if (invalidItems.length > 0) {
    const itemNumbers = invalidItems.map(({ index }) => index + 1).join(', ');
    Swal.fire('Error', `Please upload files for items: ${itemNumbers}`, 'error');
    return;
  }

  //FormData
  const formData = new FormData();
  
  // basic fields with validation
  this.appendFormDataField(formData, 'name', this.actionForm.value.name);
  formData.append('action_type', 'carousel');
  formData.append('intent_id', intentId.toString());
  formData.append('parent_id', parent_id.toString());
  formData.append('order', order.toString());
  
  // Build config object with default styles
  const config = {
    display_type: this.actionForm.value.display_type || 'slider',
    auto_advance: Boolean(this.actionForm.value.auto_advance),
    advance_interval: Math.min(Math.max(this.actionForm.value.advance_interval || 5, 1), 60),
    intent_id: intentId,
    name:  this.actionForm.value.name,
    style: {
      card_width: "300px",
      max_height: "400px",
      show_indicators: true,
      show_controls: true,
      // // Added responsive settings
      // responsive: {
      //   mobile: { card_width: "250px", max_height: "350px" },
      //   tablet: { card_width: "275px", max_height: "375px" }
      // }
    },
    items: this.carouselItems.value.map((item: any, index: number) => ({
      title: item.title || `Item ${index + 1}`,
      description: item.description || '',
      item_type: item.item_type || 'image',
      file_name: this.carouselItemFiles[index]?.name || '',
      // Add action URL if exists
      ...(item.action_url ? { action_url: item.action_url } : {})
    }))
  };
  
  // Safely stringify config
  try {
    formData.append('config', JSON.stringify(config));
  } catch (error) {
    console.error('Error stringifying config:', error);
    Swal.fire('Error', 'Failed to prepare carousel configuration', 'error');
    return;
  }

  // Add files with better naming convention
  Object.entries(this.carouselItemFiles).forEach(([index, file]) => {
    if (file) {
      const safeIndex = index.padStart(3, '0'); // 001, 002, etc.
      const extension = file.name.split('.').pop() || '';
      formData.append('files', file, `item_${safeIndex}.${extension}`);
    }
  });

  // Submit to multipart endpoint
  this._httpService.mobileBankingPostFormData('builder/nodes/action-multipart', formData).subscribe({
    next: (result: any) => this.handleActionResponse(result),
    error: (err: any) => this.handleActionError(err)
  });
}


private appendFormDataField(formData: FormData, key: string, value: any): void {
  if (value !== null && value !== undefined) {
    formData.append(key, value);
  }
}

private submitAction(model: any): void {
  console.log('Submitting action with model:', model);
  this._httpService.mobileBankingPost('builder/nodes/action', model).subscribe({
    next: (result: any) => this.handleActionResponse(result),
    error: (err: any) => this.handleActionError(err)
  });
}

private handleActionResponse(result: any): void {
 
  if (result.status === '00') {
    setTimeout(() => {
      Swal.close();  // When your API call completes
      this.result = result.data;
      this.fetchNestedIntents(this.intentId);
      this.checkAndCombine();
      this.cdRef.detectChanges();
      Swal.fire('Success', result.message || "Action Created Successfully !!!!", 'success');
      this.resetForm();
      this.resetSurveyForm()
    }, 100);
  } else {
    Swal.close();  
    Swal.fire({
      icon: 'warning',
      title: 'Unexpected Response',
      text: result.message || 'Action creation completed with unexpected response'
    });
    this.resetForm();
    this.resetSurveyForm()
  }
}

private handleActionError(err: any): void {
  console.error('Action creation failed:', err);
  Swal.fire({
    icon: 'error',
    title: 'Action Creation Failed',
    text: err.message || 'Failed to create action. Please try again.'
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

launchBot() {
  this.isLaunching = true;
  this.launchMessage = 'Preparing bot launch...';

  const chatbotId = this.globalService.getChatbotId();

  // if (!chatbotId) {
  //   Swal.fire('Error', 'Error: No ChatbotId specified', 'error');
  //   return;
  // }

  if (!chatbotId) {
    this.isLaunching = false;
    this.launchMessage = 'Error: No ChatbotId specified';
    return;
  }

  // const branches = this.getBranchesFromCombinedItems(intentId);
  // const payload = { root_intent_id: intentId, branches };

  const payload = { chatbot_id: chatbotId };
  console.log("ChatBot ID Launched", chatbotId)
  
  this._httpService.mobileBankingPost('builder/chatbots/initialize', payload).subscribe({
      next: (result: any) => {
        this.isLaunching = false;
        if (result.status === '00') {
          this.launchMessage = 'Bot launched successfully!';
          Swal.fire('ChatBot',  'Chatbot Launched Successfully !!!!, Test Now!!', 'success');
        } else {
          this.launchMessage = 'Failed to Launch Bot';
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

buildBranchPath(actionId?: number): string {
  if (actionId) {
    return this.getPathForAction(actionId);
  }

  // Default path when creating new actions
  if (!this.currentParent) {
    return 'root';
  }

  // Get path based on current parent
  if (this.currentParent.itemType === 'trigger') {
    return this.getTriggerPath(this.currentParent.id);
  } else {
    // For actions, find their parent trigger first
    const parentTrigger = this.findParentTrigger(this.currentParent.id);
    return parentTrigger ? this.getTriggerPath(parentTrigger.id) : 'root';
  }
}

private getPathForAction(actionId: number): string {
  const action = this.findActionById(actionId);
  if (!action) return 'root';

  const parentTrigger = this.findParentTrigger(action.id);
  return parentTrigger ? this.getTriggerPath(parentTrigger.id) : 'root';
}

private findActionById(id: number): any {
  // Search through combinedItems to find the action
  return this.combinedItems.find(item => 
    item.itemType === 'action' && (item.id === id || item.action_id === id)
  );
}

private findParentTrigger(actionId: number): any {
  // First find the action
  const action = this.findActionById(actionId);
  if (!action) return null;

  // If action has direct parent_id, find if it's a trigger
  if (action.parent_id) {
    const parent = this.combinedItems.find(item => 
      item.id === action.parent_id || 
      (item.itemType === 'trigger' && item.id === action.parent_id)
    );
    
    if (parent && parent.itemType === 'trigger') {
      return parent;
    }
  }

  // If no direct trigger parent, search through all triggers' children
  for (const item of this.combinedItems) {
    if (item.itemType === 'trigger') {
      const found = this.searchTriggerChildren(item, actionId);
      if (found) return item;
    }
  }

  return null;
}

private searchTriggerChildren(trigger: any, actionId: number): boolean {
  if (!trigger.children) return false;
  
  for (const child of trigger.children) {
    if (child.itemType === 'action' && (child.id === actionId || child.action_id === actionId)) {
      return true;
    }
    if (child.itemType === 'trigger') {
      const foundInNested = this.searchTriggerChildren(child, actionId);
      if (foundInNested) return true;
    }
  }
  
  return false;
}

private getTriggerPath(triggerId: number): string {
  const pathParts: string[] = [];
  let currentId = triggerId;
  
  while (currentId) {
    const trigger = this.combinedItems.find(item => 
      item.itemType === 'trigger' && item.id === currentId
    );
    
    if (!trigger) break;
    
    pathParts.unshift(trigger.name);
    currentId = trigger.parent_id;
  }
  
  // If we have no path parts, just return 'root'
  if (pathParts.length === 0) return 'root';
  
  // Add root at the beginning if needed
  if (pathParts[0] !== 'root') {
    pathParts.unshift('root');
  }
  
  return pathParts.join('>');
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

ngOnDestroy() {
  // Clean up all blob URLs
  Object.values(this.filePreviews).forEach(url => {
    URL.revokeObjectURL(url as any);
  });
}


}