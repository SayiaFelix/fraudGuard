import {ChangeDetectorRef, Component, ElementRef, Input, OnInit, SecurityContext, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from '@angular/router'; 
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

interface SurveyQuestion {
  id?: string;
  text: string;
  type: 'text' | 'number' | 'choice' | 'rating';
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
  };
  options?: string[];
}
interface SurveyConfig {
  questions: SurveyQuestion[];
  completion_message?: string;
  persist_responses?: boolean;
}
interface SurveyAction {
  name: string;
  action_type: 'survey';
  config: SurveyConfig;
}
interface Node {
  id: number;
  type: 'action' | 'trigger';
  name: string;
  children: Node[]; 
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
  types: string[];  
  maxSize: number;  
}
interface FileTypeInfoMap {
  image: FileTypeInfo;
  document: FileTypeInfo;
  video: FileTypeInfo;
  audio: FileTypeInfo;
  [key: string]: FileTypeInfo;
}
interface FileSizeMap {
  image: number;
  document: number;
  video: number;
  audio: number;
  [key: string]: number; 
}
interface VariableConfig {
  source: 'static' | 'expression' | 'context';
  value?: string;
  expression?: string;
  context_key?: string;
}
interface FallbackOptions {
  delay: number;
  fallback_message: string;
}
interface HumanHandoffConfig {
  mode: 'direct' | 'hybrid' | 'request';
  handoff_message: string;
  team_id: number;
  priority: 1 | 2 | 3 | 4;
  fallback_options: FallbackOptions;
  required_context: string[];
}
interface HumanHandoffAction {
  name: string;
  action_type: 'human_handoff';
  config: HumanHandoffConfig;
}
interface SetVariableAction {
  name: string;
  action_type: 'set_variable';
  config: {
    variables: Record<string, VariableConfig>;
    overwrite: boolean;
    clear_on_session_end: boolean;
  };
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

    availableLanguages: string[] = ['English', 'Swahili','Dholuo','Luhya','Kikuyu','French', 'Arabic', 'Spanish', 'German'];
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
    agentList: any[]; 
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
    indentLevel: number = 0;
    currentParent: any = null;
    combinedItems: any[] = [];
    loadingIntents = false;
    loadingTriggers = false;
    isLaunching = false;
    launchMessage = '';
    isActive: boolean = false;
    filePreviews: { [key: number]: SafeUrl } = {};
    triggers: any;
    currentParentIntentId: number | null = null;
    uploadedFile: File | null = null;
    carouselItemFiles: { [key: number]: File } = {};
    carouselItems: FormArray = this.fb.array([]);
    quickReplies: FormArray = this.fb.array([]);
    allTriggers: any[] = [];
    teams: any[] = []; 
    isHovering = false;
    editingItem: any = null;
    isEditing: boolean = false;


    actionIcons: { [key: string]: string } = {
      send_message: 'icon-message-square',      
      send_file: 'icon-file-text',              
      http_request: 'icon-link',                 
      // webhook: 'icon-zap',                       
      // loop: 'icon-zap',                   
      conditional: 'icon-code',                
      carousel: 'icon-layers',                   
      Jump_to_Trigger: 'icon-refresh-cw', 
      set_variable: 'icon-sliders',              
      survey: 'icon-edit-3',  
      human_handoff: 'icon-user',                
      create_ticket: 'icon-clipboard'        
    };

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

getFilePreview(file: File): SafeUrl {
  const url = URL.createObjectURL(file);
  return this.sanitizer.bypassSecurityTrustUrl(url);
}

get requiredContext(): FormArray {
  return this.actionForm.get('required_context') as FormArray;
}

get fallbackOptions(): FormGroup {
  return this.actionForm.get('fallback_options') as FormGroup;
}

addRequiredContext(context: string = '') {
  this.requiredContext.push(this.fb.control(context, Validators.required));
}

removeRequiredContext(index: number) {
  this.requiredContext.removeAt(index);
}

private createSafePreview(file: File): SafeUrl {
  return this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
}

calculateIndentLevel(item: any): number {
  if (!item.parent_id) return 0;
  const parent = this.combinedItems.find(i => i.id === item.parent_id);
  return parent ? this.calculateIndentLevel(parent) + 1 : 0;
}

fileTypeInfo: FileTypeInfoMap = {
  image: {
    accept: 'image/*',
    types: ['JPG', 'JPEG', 'PNG', 'GIF'],
    maxSize: 20 * 1024 * 1024
  },
  document: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    types: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX'],
    maxSize: 50 * 1024 * 1024
  },
  video: {
    accept: 'video/*,.mp4,.mov,.avi',
    types: ['MP4', 'MOV', 'AVI'],
    maxSize: 100 * 1024 * 1024
  },
  audio: {
    accept: 'audio/*,.mp3,.wav,.aac',
    types: ['MP3', 'WAV', 'AAC'],
    maxSize: 50 * 1024 * 1024
  }
};

private sizeMap: FileSizeMap = {
  image: 20 * 1024 * 1024,    // 20MB
  document: 50 * 1024 * 1024, // 50MB
  video: 100 * 1024 * 1024,   // 100MB
  audio: 50 * 1024 * 1024     // 50MB
};

get trueSteps(): FormArray {
  return this.actionForm.get('true_steps') as FormArray;
}

get falseSteps(): FormArray {
  return this.actionForm.get('false_steps') as FormArray;
}

addTrueStep(step?: string) {
  this.trueSteps.push(this.fb.control(step || ''));
}

addFalseStep(step?: string) {
  this.falseSteps.push(this.fb.control(step || ''));
}

removeTrueStep(index: number) {
  this.trueSteps.removeAt(index);
}

removeFalseStep(index: number) {
  this.falseSteps.removeAt(index);
}

getFileAcceptTypes(): string {
  const format = this.actionForm?.value.file_format as keyof FileTypeInfoMap;
  return this.fileTypeInfo[format]?.accept || '';
}

triggerFileInput(): void {
  if (this.fileInput?.nativeElement) {
    this.fileInput.nativeElement.click();
  } else {
    console.error('File input element not found');
  }
}

removeUploadedFile(): void {
  this.uploadedFile = null;
  this.fileInput.nativeElement.value = '';
}

removeVariable(index: number): void {
  this.variables.removeAt(index);
}

addQuickReply(): void {
  this.quickReplies.push(this.fb.control('', Validators.required));
}

removeQuickReply(index: number): void {
  this.quickReplies.removeAt(index);
}

initializeFormArrays(): void {
  this.actionForm = this.fb.group({
    carouselItems: this.carouselItems,
    surveyQuestions: this.surveyQuestions,
    variables: this.variables,
    carry_variables: this.fb.array([]),
    requiredContext: this.requiredContext,
    quickReplies: this.quickReplies
  });
}

removeContextMapKey(key: string) {
  const cmGroup = this.actionForm.get('context_map') as FormGroup;
  cmGroup.removeControl(key);
}

addVariable(name: string = '', config?: VariableConfig) {
   const source = config?.source || 'static';
  
    const variableGroup = this.fb.group({
      name: [name, Validators.required],
      source: [source, Validators.required],
      value: [source === 'static' ? config?.value : ''],
      expression: [source === 'expression' ? config?.expression : ''],
      context_key: [source === 'context' ? config?.context_key : '']
    });

  const sourceControl = variableGroup.get('source');
  sourceControl?.valueChanges.subscribe(source => {
    const valueCtrl = variableGroup.get('value');
    const exprCtrl = variableGroup.get('expression');
    const ctxCtrl = variableGroup.get('context_key');

    // Clear validators first
    [valueCtrl, exprCtrl, ctxCtrl].forEach(ctrl => ctrl?.clearValidators());

    switch (source) {
      case 'static':
        valueCtrl?.setValidators(Validators.required);
        break;
      case 'expression':
        exprCtrl?.setValidators(Validators.required);
        break;
      case 'context':
        ctxCtrl?.setValidators(Validators.required);
        break;
    }

    [valueCtrl, exprCtrl, ctxCtrl].forEach(ctrl => ctrl?.updateValueAndValidity());
  });

  this.variables.push(variableGroup);
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

    if (this.filePreviews[index]) {
    const url = this.filePreviews[index] as unknown as string;
    if (url.startsWith('blob:')) {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
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

onFileHovered(isHovering: boolean): void {
  this.isHovering = isHovering;
}

get carryVariables(): FormArray {
  return this.actionForm.get('carry_variables') as FormArray;
}

addCarryVariable(): void {
  this.carryVariables.push(this.fb.control(''));
  // console.log('After add:', this.carryVariables.value);
}

private getAcceptTypes(): string[] {
  const format = this.actionForm.value.file_format;
  return this.getFileTypeInfo(format).types;
}

private getMaxFileSize(): number {
  const format = this.actionForm.value.file_format;
  return this.getFileTypeInfo(format).maxSize;
}

private getFileTypeInfo(format: string): FileTypeInfo {
  const fileTypeMap: FileTypeInfoMap = {
    image: {
      maxSize: 20 * 1024 * 1024, // 20MB
      types: ['image/jpeg', 'image/png', 'image/gif'],
      accept: 'image/jpeg,image/png,image/gif'
    },
    document: {
      maxSize: 50 * 1024 * 1024, // 50MB
      types: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      accept: '.pdf,.doc,.docx'
    },
    video: {
      maxSize: 100 * 1024 * 1024, // 100MB
      types: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
      accept: 'video/mp4,video/quicktime,video/x-msvideo'
    },
    audio: {
      maxSize: 50 * 1024 * 1024, // 50MB
      types: ['audio/mpeg', 'audio/wav', 'audio/aac'],
      accept: 'audio/mpeg,audio/wav,audio/aac'
    }
  };

  return fileTypeMap[format as keyof FileTypeInfoMap] || {
    maxSize: 10 * 1024 * 1024,
    types: [],
    accept: '*/*'
  };
}

addCarouselItem() {
  this.carouselItems.push(this.fb.group({
    title: [''],
    description: [''],
    item_type: ['image'],
    action_url: ['', Validators.pattern('https?://.+')]
  }));
}

removeCarouselItem(index: number): void {
  this.carouselItems.removeAt(index);
  delete this.carouselItemFiles[index];
}

get headers(): FormArray {
  return this.actionForm.get('headers') as FormArray;
}

addHeader(key: string = '', value: string = '') {
  this.headers.push(this.fb.group({
    key: [key, Validators.required],
    value: [value, Validators.required]
  }));
}

removeHeader(index: number) {
  this.headers.removeAt(index);
}

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
        this.isActive = !!triggerData.is_active; 
        this.intentId = triggerData.id;
        this.fetchData(this.intentId); 
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
  
  // Sort by ID in ascending order (lower IDs first, higher IDs later)
  this.combinedItems = [...rootActions, ...this.flattenTriggerHierarchy(processedTriggers)].sort((a, b) => a.id - b.id);
  this.isLoading = false;
}

getRootTriggers(): any[] {
  return this.combinedItems.filter(item => 
    item.itemType === 'trigger' && item.parent_id === this.intentId
  ).sort((a, b) => a.id - b.id);  
}

getRootActions(): any[] {
  return this.combinedItems.filter(item => 
    item.itemType === 'action' && item.parent_id === this.intentId
  ).sort((a, b) => a.id - b.id);  
}

getChildTriggers(parentId: number): any[] {
  return this.combinedItems.filter(item => 
    item.itemType === 'trigger' && item.parent_id === parentId
  ).sort((a, b) => a.id - b.id);  
}

getDirectActions(parentId: number): any[] {
  return this.combinedItems.filter(item => 
    item.itemType === 'action' && item.parent_id === parentId
  ).sort((a, b) => a.id - b.id);  
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
  const body = { 
    chatbot_id: this.chatbotId,
    parent_id: intentId 
  };
  console.log('Fetching triggers with body:', body);
  
  this._httpService.mobileBankingPost('builder/intents/children', body)
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

onFileDropped(files: FileList): void {
  if (files.length > 0) {
    const file = files[0];

    // Validate file type
    const allowedTypes = this.getAcceptTypes();
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      Swal.fire('Error', `Invalid file type. Supported types: ${allowedTypes.join(', ')}`, 'error');
      return;
    }

    // Validate file size
    const maxSize = this.getMaxFileSize();
    if (file.size > maxSize) {
      Swal.fire('Error', `File too large. Max ${maxSize / 1024 / 1024}MB allowed`, 'error');
      return;
    }

    this.handleUploadedFile(file);
  }
}

private handleUploadedFile(file: File): void {
  this.uploadedFile = file;
  this.filePreviews = '';

  // Generate preview for images & videos
  if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.filePreviews = e.target?.result as string;
      this.cdRef.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  this.actionForm.patchValue({
    source: 'upload',
    file_url: file.name
  });

  this.actionForm.updateValueAndValidity();
}

onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    const file = input.files[0];
    const format = this.actionForm.value.file_format as keyof FileTypeInfoMap;
    
    if (file.size > this.getMaxFileSize()) {
      this._toastService.error(
        `File exceeds maximum size of ${this.fileTypeInfo[format].maxSize}`, 
        'Error'
      );
      input.value = '';
      return;
    }
    
    this.uploadedFile = file;
  }
}

onDragOver(event: DragEvent): void {
  event.preventDefault();
}

onDragLeave(event: DragEvent): void {
  event.preventDefault();
}

onCarouselItemFileDropped(event: DragEvent, index: number): void {
  event.preventDefault();
  if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;

  const file = event.dataTransfer.files[0];

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    Swal.fire('Error', 'Invalid file type. Only images or videos are allowed.', 'error');
    return;
  }

  // Optional size check
  const maxSize = 5 * 1024 * 1024; // 5MB example
  if (file.size > maxSize) {
    Swal.fire('Error', `File too large. Max ${maxSize / 1024 / 1024}MB allowed.`, 'error');
    return;
  }

  this.handleCarouselItemUploadedFile(file, index);
}

handleCarouselItemUploadedFile(file: File, index: number): void {
  this.carouselItemFiles[index] = file;

  if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.filePreviews[index] = e.target?.result as string;
      this.cdRef.detectChanges();
    };
    reader.readAsDataURL(file);
  } else {
    this.filePreviews[index] = '';
  }

  // Update the form control
  const itemsArray = this.actionForm.get('items') as FormArray;
  itemsArray.at(index).patchValue({ media_url: file.name });
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
      // Add root-level actions to combinedItems
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
    
    return this.combinedItems.some(parent => parent.id === item.parent_id);
  });
}

toggleActionStatus(action: any): void {
  console.log('Toggled action:', action);

  const body = {
    action_id: action.id,
    is_active: action.is_active
  };
  console.log('Updating action status with body:', body);

  this._httpService.mobileBankingPatch('builder/actions/update', body)
    .subscribe({
      next: (res: any) => {
        if (res.status === '00') {
          this.fetchNestedIntents(this.intentId);
        
          console.log(`Action ${action.id} status updated successfully`);
        } else {
          console.error(`Failed to update status for action ${action.id}`);
        }
      },
      error: (err : any) => {
        console.error('Error updating action status:', err);
      }
    });
}

toggleTriggerStatus(trigger: any): void {
  console.log('Toggled trigger:', trigger);

  const body = {
    id: trigger.id,
    is_active: trigger.is_active
  };

  this._httpService.mobileBankingPatch('builder/triggers/update', body)
    .subscribe({
      next: (res: any) => {
        if (res.status === '00') {
           this.fetchNestedIntents(this.intentId);
          console.log(`Trigger ${trigger.id} status updated successfully`);
        } else {
          console.error(`Failed to update status for trigger ${trigger.id}`);
        }
      },
      error: (err: any) => {
        console.error('Error updating trigger status:', err);
      }
    });
}



fetchActionType(): void {
  this.isLoading = true;
  this._httpService.mobileBankingGet('builder/actions/types').subscribe({
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

getTargetPlaceholder(): string {
  const type = this.actionForm?.get('target_type')?.value;
  switch(type) {
    case 'flow': return 'Enter flow name (e.g. checkout_flow)';
    case 'intent': return 'Enter intent ID or name';
    case 'action': return 'Enter action ID or name';
    case 'step': return 'Enter step ID or name';
    default: return 'Enter target';
  }
}

removeCarryVariable(index: number): void {
  if (this.carryVariables.length > 0) {
    this.carryVariables.removeAt(index);
  }
}

private isVariableConfig(config: any): config is VariableConfig {
  return (
    config && 
    ['static', 'expression', 'context'].includes(config.source) &&
    (config.source !== 'static' || 'value' in config) &&
    (config.source !== 'expression' || 'expression' in config) &&
    (config.source !== 'context' || 'context_key' in config)
  );
}

editAction(item: any): void {
  console.log('Editing item:', item);
  this.editingItem = item;
  this.isEditing = true;
  
  if (item.itemType === 'action' || item.action_type) {
    this.openActionForm(item);
  } else {
    this.openAiActionPanel(item);
  }
}

openActionForm(action: any): void {
  this.selectedActionType = action.action_type || action.type;
  console.log('Selected action type:', this.selectedActionType);

  this.showActionForm = true;
  this.showActionType = false;
  this.showAiActionPanel = false;

  if (this.isEditing && this.editingItem) {
    action = this.editingItem;
  }

  // Initialize form based on action type
  switch(this.selectedActionType) {
    case 'send_message':
      this.actionForm = this.fb.group({
        action_id: [action.id || null], 
        name: [action.name || '', Validators.required],
        action_type: ['send_message', Validators.required],
        message: [action.config?.message || '', Validators.required]
      });
      break;

     case 'send_file':
      this.actionForm = this.fb.group({
        action_id: [action.id || null], 
        name: [action.name || '', Validators.required],
        action_type: ['send_file', Validators.required],
        file_format: [action.config?.file_type?.split('/')[0] || 'image', Validators.required],
        source: [action.config?.source ? 'link' : 'upload', Validators.required],
        file_url: [action.config?.file_url || '', [Validators.pattern('https?://.+')]],
        chat_script: [action.config?.chat_script || ''],
        caption: [action.config?.caption || '']
      });

      this.uploadedFile = null;
      
     // Set up condition validation
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
        action_id: [action.id || null], 
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
            action_id: [action.id || null], 
            title: [item.title || '', Validators.required],
            description: [item.description || ''],
            item_type: [item.item_type || 'image'],
            action_url: [item.action_url || '', Validators.pattern('https?://.+')]
          });
          this.carouselItems.push(itemGroup);
        });
      } else {
        this.addCarouselItem();
      }
      break;

    case 'http_request':
      this.actionForm = this.fb.group({
        action_id: [action.id || null], 
        name: [action.name || '', Validators.required],
        action_type: ['http_request', Validators.required],
        http_method: [action.config?.method || 'GET', Validators.required],         
        url: [action.config?.url || '', [
          Validators.required,
          Validators.pattern(/^https?:\/\/.+/)
        ]],
        headers: this.fb.array([]),
        request_body: [action.config?.body ? JSON.stringify(action.config.body, null, 2) : ''],
        timeout: [action.config?.timeout || 30, [Validators.required, Validators.min(1), Validators.max(60)]],
        retry_attempts: [action.config?.retry_policy?.attempts || 3, [Validators.min(0), Validators.max(5)]],
        retry_delay: [action.config?.retry_policy?.delay || 1, [Validators.min(0), Validators.max(10)]]
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
        action_id: [action.id || null],
        name: [action.name || '', Validators.required],
        action_type: ['conditional', Validators.required],
        condition: [action.config?.condition || '', Validators.required],
        true_steps: this.fb.array(action.config?.true_steps?.map((step: any) => this.fb.control(step)) || []),
        false_steps: this.fb.array(action.config?.false_steps?.map((step: any) => this.fb.control(step)) || []),
        context_map: this.fb.group(action.config?.context_map || {})
      });
      break;

    case 'Jump_to_Trigger':
      this.actionForm = this.fb.group({
        action_id: [action.id || null], 
        name: [action.name || '', Validators.required],
        action_type: ['Jump_to_Trigger', Validators.required],
        target_type: [action.config?.target_type || 'flow', Validators.required], 
        target: [action.config?.target || '', Validators.required],
        condition: this.fb.group({
          expression: [action.config?.condition?.expression || ''],
          negate: [action.config?.condition?.negate || false]
        }),
        context_updates: [
          action.config?.context_updates 
            ? JSON.stringify(action.config.context_updates, null, 2)
            : '{}'
        ],
         carry_variables: this.fb.array(
           action.config?.carry_variables?.length 
        ? action.config.carry_variables.map((v: any) => this.fb.control(v))
        : []
        )
      });
      break;

    case 'set_variable':
      this.actionForm = this.fb.group({
        action_id: [action.id || null],
        name: [action.name || '', Validators.required],
        action_type: ['set_variable', Validators.required],
        variables: this.fb.array([]),
        overwrite: [action.config?.overwrite ?? true],
        clear_on_session_end: [action.config?.clear_on_session_end ?? false]
      });

      // Initialize variables 
      if (action.config?.variables) {
        Object.entries(action.config.variables).forEach(([varName, varConfig]) => {
        
          if (this.isVariableConfig(varConfig)) {
            this.addVariable(varName, varConfig);
          } else {
            console.warn('Invalid variable config:', varConfig);
            this.addVariable(varName);
          }
        });
      } else {
        this.addVariable(); 
      }
      break;

    case 'survey':
       this.actionForm = this.fb.group({
          action_id: [action.id || null],
          name: [action?.name || 'Customer Feedback Survey', Validators.required],
          action_type: ['survey', Validators.required],
          config: this.fb.group({
            questions: this.fb.array([]),
            completion_message: [action?.config?.completion_message || 'Thank you for your feedback!'],
            persist_responses: [action?.config?.persist_responses !== false]
          })
        });

        // Initialize with existing questions if editing
        if (action?.config?.questions?.length) {
          action.config.questions.forEach((q: SurveyQuestion) => {
            this.addSurveyQuestion(q);
          });
        } else {
          this.addSurveyQuestion(); 
        }

      // this.initSurveyForm();
      break;
    
    case 'create_ticket':
      this.actionForm = this.fb.group({
        action_id: [action.id || null], 
        name: [action.name || '', Validators.required],
        action_type: ['create_ticket', Validators.required],
        ticket_type: ['', Validators.required],
        subject: ['', Validators.required],
        description: ['', Validators.required]
      });
      break;
  
      case 'human_handoff':
        this.actionForm = this.fb.group({
          name: [action?.name || '', Validators.required],
          action_type: ['human_handoff', Validators.required],
          mode: [action?.config?.mode || 'hybrid', Validators.required],
          handoff_message: [
            action?.config?.handoff_message || 'Connecting you with an agent...', 
            Validators.required
          ],
          team_id: [action?.config?.team_id || null, [Validators.required, Validators.min(1)]],
          priority: [action?.config?.priority || 2, Validators.required],
          required_context: this.fb.array(
            (action?.config?.required_context || []).map((ctx: any) => this.fb.control(ctx, Validators.required))
          ),
          fallback_options: this.fb.group({
            delay: [
              action?.config?.fallback_options?.delay || 15, 
              [Validators.required, Validators.min(5), Validators.max(300)]
            ],
            fallback_message: [
              action?.config?.fallback_options?.fallback_message || 
              'All agents are busy. We\'ll contact you shortly.',
              Validators.required
            ]
          })
        });
        break;

    default:
      this.actionForm = this.fb.group({
        name: [action.name || '', Validators.required],
        action_type: [action.type || '', Validators.required]
      });
  }

  console.log('Form values after initialization:', this.actionForm.value);
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

get surveyQuestions(): FormArray {
  return (this.actionForm.get('config.questions') as FormArray);
}

addSurveyQuestion(question?: SurveyQuestion) {
  // Safely get the questions FormArray
  const questions = this.actionForm?.get('config.questions') as FormArray;
  if (!questions) {
    return;
  }

  const questionGroup = this.fb.group({
    id: [question?.id || ''],
    text: [question?.text || '', Validators.required],
    type: [question?.type || 'text', Validators.required],
    required: [question?.required || false],
    // Conditional fields
    validation: this.fb.group({
      min: [question?.type === 'number' ? question?.validation?.min : null],
      max: [question?.type === 'number' ? question?.validation?.max : null]
    }),
    options: [question?.type === 'choice' ? question?.options?.join(', ') : '']
  });

  // Set up type change handler
  questionGroup.get('type')?.valueChanges.subscribe(type => {
    this.updateQuestionValidation(this.surveyQuestions.controls.indexOf(questionGroup));
  });

  this.surveyQuestions.push(questionGroup);
}

removeSurveyQuestion(index: number) {
  this.surveyQuestions.removeAt(index);
}

updateQuestionValidation(index: number) {
  const question = this.surveyQuestions.at(index);
  const type = question.get('type')?.value;

  question.get('validation.min')?.clearValidators();
  question.get('validation.max')?.clearValidators();
  question.get('options')?.clearValidators();
  
  // Set validators based on type
  if (type === 'number' || type === 'rating') {
    const min = type === 'rating' ? 1 : null;
    const max = type === 'rating' ? 5 : null;
    
    question.get('validation.min')?.setValidators([Validators.required, Validators.min(0)]);
    question.get('validation.max')?.setValidators([Validators.required, Validators.min(1)]);
    
    // Auto-set values for rating
    if (type === 'rating') {
      question.get('validation.min')?.setValue(1);
      question.get('validation.max')?.setValue(5);
    }
  } else if (type === 'choice') {
    question.get('options')?.setValidators(Validators.required);
  }
  
  // Update validity
  question.get('validation.min')?.updateValueAndValidity();
  question.get('validation.max')?.updateValueAndValidity();
  question.get('options')?.updateValueAndValidity();
}

resetSurveyForm() {
  const questions = this.surveyQuestions;
  if (questions && questions.length > 0) {
    while (questions.length !== 0) {
      questions.removeAt(0);
    }
  }
  this.addSurveyQuestion();
}

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

onActionSubmit(): void {
  if (!this.actionForm.valid) {
    this.markFormGroupTouched(this.actionForm);
    return;
  }

  const isEditing = this.isEditing && this.editingItem;
  const actionId = isEditing ? this.editingItem.id : null;

  if (isEditing) {
    this.updateAction(actionId);
  } else {
    this.createNewAction();
  }
}

prepareFormData(isEditing: boolean): any {
  const formValue = this.actionForm.value;
  const baseData: any = {
    name: formValue.name,
    action_type: formValue.action_type
  };
   
  // Include ID only when editing
  if (isEditing) {
    baseData.action_id = formValue.action_id;
  }

  switch (formValue.action_type) {
    case 'send_message':
      baseData.config = {
        message: formValue.message,
        quick_replies: this.quickReplies.value || []
      };
      console.log('Prepared send_message config:', baseData);
      break;

    case 'http_request':
      const headersObj: { [key: string]: string } = {};
      if (this.headers && this.headers.controls) {
        this.headers.controls.forEach(headerGroup => {
          const key = headerGroup.get('key')?.value?.trim();
          const value = headerGroup.get('value')?.value?.trim();
          if (key && value) {
            headersObj[key] = value;
          }
        });
      }

      let parsedBody = {};
      if (formValue.request_body) {
        try {
          parsedBody = JSON.parse(formValue.request_body);
        } catch (e) {
          console.error('Invalid JSON in request body:', e);
          parsedBody = {};
        }
      }

      baseData.config = {
        url: formValue.url,
        method: formValue.http_method,
        headers: headersObj,
        body: parsedBody,
        timeout: formValue.timeout,
        retry_policy: {
          attempts: formValue.retry_attempts,
          delay: formValue.retry_delay
        }
      };
      break;

    case 'conditional':
      baseData.config = {
        condition: formValue.condition,
        true_steps: this.trueSteps?.controls?.map(control => control.value) || [],
        false_steps: this.falseSteps?.controls?.map(control => control.value) || [],
        context_map: formValue.context_map || {}
      };
      break;

    case 'Jump_to_Trigger':
      let parsedContextUpdates = {};
      try {
        parsedContextUpdates = formValue.context_updates
          ? JSON.parse(formValue.context_updates)
          : {};
      } catch (e) {
        console.error("Invalid JSON in context_updates", e);
        parsedContextUpdates = {};
      }

      baseData.config = {
        target_type: formValue.target_type,
        target: formValue.target,
        condition: {
          expression: formValue.condition?.expression,
          negate: formValue.condition?.negate || false
        },
        context_updates: parsedContextUpdates,
        carry_variables: this.carryVariables?.value?.filter((v: string) => v.trim() !== '')?.map((v: string) => v.trim()) || []
      };
      break;

    case 'set_variable':
      const variablesObj: Record<string, any> = {};
      if (this.variables && this.variables.controls) {
        this.variables.controls.forEach(variableGroup => {
          const varName = variableGroup.get('name')?.value;
          const source = variableGroup.get('source')?.value;
          
          if (!varName) return;

          variablesObj[varName] = {
            source,
            ...(source === 'static' && { value: variableGroup.get('value')?.value }),
            ...(source === 'expression' && { expression: variableGroup.get('expression')?.value }),
            ...(source === 'context' && { context_key: variableGroup.get('context_key')?.value })
          };
        });
      }

      baseData.config = {
        variables: variablesObj,
        overwrite: formValue.overwrite,
        clear_on_session_end: formValue.clear_on_session_end
      };
      break;

    case 'survey':
      const questions = formValue.config?.questions || [];
      baseData.config = {
        questions: questions.map((q: any, idx: number) => {
          const question: any = {
            id: q.id || `q${idx + 1}`,
            text: q.text?.trim(),
            type: q.type,
            required: !!q.required
          };

          if (q.type === 'number') {
            question.validation = {
              min: q.validation?.min ?? 1,
              max: q.validation?.max ?? 5
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
        completion_message: formValue.config?.completion_message?.trim() || 'Thank you for your feedback!',
        persist_responses: formValue.config?.persist_responses !== false
      };
      break;

    case 'human_handoff':
      baseData.config = {
        mode: formValue.mode,
        team_id: Number(formValue.team_id),
        priority: Number(formValue.priority),
        handoff_message: formValue.handoff_message?.trim(),
        required_context: this.requiredContext?.value?.filter((ctx: string) => ctx.trim()) || [],
        fallback_options: {
          delay: Number(formValue.fallback_options?.delay),
          fallback_message: formValue.fallback_options?.fallback_message?.trim()
        }
      };
      break;

    default:
      baseData.config = formValue.config || {};
  }

  return baseData;
}

private prepareMultipartFormData(isEditing: boolean): FormData {
  const formValue = this.actionForm.value;
  const formData = new FormData();

  // fields
  formData.append('name', formValue.name);
  formData.append('action_type', formValue.action_type);
  
  if (isEditing && formValue.id) {
    formData.append('action_id', formValue.id.toString());
  }

  switch (formValue.action_type) {
    case 'send_file':
      const sendFileConfig: {
        name: any;
        caption: any;
        source_type: any;
        file_url?: string;
        chat_script?: string;
        file_type?: string;
      } = {
        name: formValue.name,
        caption: formValue.caption || '',
        source_type: formValue.source
      };

      if (formValue.source === 'link') {
        sendFileConfig.file_url = formValue.file_url;
      } else if (formValue.source === 'chat_script') {
        sendFileConfig.chat_script = formValue.chat_script;
      } else if (formValue.source === 'upload' && this.uploadedFile) {
        // Add the file to FormData
        formData.append('files', this.uploadedFile);
        sendFileConfig.file_type = this.uploadedFile.type;
      }

      formData.append('config', JSON.stringify(sendFileConfig));
      break;

    case 'carousel':
      const carouselConfig = {
        name: formValue.name,
        display_type: formValue.display_type,
        auto_advance: formValue.auto_advance,
        advance_interval: formValue.advance_interval,
        style: {
          card_width: "300px",
          max_height: "400px",
          show_indicators: true,
          show_controls: true,
        },
        items: this.carouselItems.value.map((item: any, index: number) => ({
          title: item.title || `Item ${index + 1}`,
          description: item.description || '',
          item_type: item.item_type || 'image',
          file_name: this.carouselItemFiles[index]?.name || '',
          ...(item.action_url ? { action_url: item.action_url } : {})
        }))
      };

      formData.append('config', JSON.stringify(carouselConfig));

      // Add all carousel item files
      Object.entries(this.carouselItemFiles).forEach(([index, file]) => {
        if (file) {
          const safeIndex = index.padStart(3, '0');
          const extension = file.name.split('.').pop() || '';
          formData.append('files', file, `item_${safeIndex}.${extension}`);
        }
      });
      break;

    default:
      // Fallback for other multipart types
      const config = this.prepareFormData(isEditing).config;
      formData.append('config', JSON.stringify(config));
  }

  return formData;
}

updateAction(actionId: number): void {
  const isMultipart = this.actionForm.value.action_type === 'send_file' || this.actionForm.value.action_type === 'carousel';
  
  let endpoint = 'builder/actions/update';
  let payload: any;
  let serviceCall: Observable<any>;

  if (isMultipart) {
    endpoint = 'builder/action-multipart/update';
    // For multipart,
    payload = this.prepareMultipartFormData(true);
    serviceCall = this._httpService.mobileBankingPatchFormData(endpoint, payload);
  } else {
    // For non-multipart,
    payload = this.prepareFormData(true);
    serviceCall = this._httpService.mobileBankingPatch(endpoint, payload);
  }

  console.log('Updating action with data:', payload);

  serviceCall.subscribe({
    next: (res: any) => {
      if (res.status === '00') {
        this.fetchNestedIntents(this.intentId);
        Swal.fire('Success', res.message || "Action updated successfully !!!!", 'success');
        this.resetForm();
        this.resetSurveyForm();
      } else {
        Swal.fire('Error', res.message || 'Failed to update action', 'error');
      }
    },
    error: (err: any) => {
      console.error('Error updating action:', err);
      Swal.fire('Error', 'Failed to update action', 'error');
    }
  });
}


createNewAction(): void {
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
    // branch_path: this.buildBranchPath(),
    order: order
  };

  switch(this.selectedActionType) {
    case 'send_message':
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
      this.headers.controls.forEach(headerGroup => {
        const key = headerGroup.get('key')?.value?.trim();
        const value = headerGroup.get('value')?.value?.trim();
        if (key && value) {
          headersObj[key] = value;
        }
      });

      let parsedBody = {};
      if (this.actionForm.value.request_body) {
        try {
          parsedBody = JSON.parse(this.actionForm.value.request_body);
        } catch (e) {
          Swal.fire('Invalid JSON', `Error in request body: ${(e as Error).message}`, 'error');
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
          timeout: this.actionForm.value.timeout,
          retry_policy: {
            attempts: this.actionForm.value.retry_attempts,
            delay: this.actionForm.value.retry_delay
          }
        }
      };

      this.submitAction(httpRequestModel);
      break;

    case 'conditional':
      const conditionalModel = {
        ...baseModel,
        config: {
          condition: this.actionForm.value.condition,
          true_steps: this.trueSteps.controls.map(control => control.value),
          false_steps: this.falseSteps.controls.map(control => control.value), 
          context_map: this.actionForm.value.context_map
        }
      };
      this.submitAction(conditionalModel);
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
        Swal.fire('Error', 'Please enter valid JSON in Context Updates', 'error');
        return;
      }

      const jumpModel = {
        ...baseModel,
        config: {
          target_type: this.actionForm.value.target_type,
          target: this.actionForm.value.target,  
          condition: {
            expression: this.actionForm.value.condition.expression,
            negate: this.actionForm.value.condition.negate
          },
          context_updates: parsedContextUpdates,
          carry_variables: this.carryVariables.value
           .filter((v: string) => v.trim() !== '') 
           .map((v: string) => v.trim()) } 
      };
      
      this.submitAction(jumpModel);
      console.log("Jump Model =====>", jumpModel)
      break;

    case 'set_variable':
      const variablesObj = this.variables.controls.reduce((acc, variableGroup) => {
        const varName = variableGroup.get('name')?.value;
        const source = variableGroup.get('source')?.value;
        
        if (!varName) return acc; 

        acc[varName] = {
          source,
          ...(source === 'static' && { value: variableGroup.get('value')?.value }),
          ...(source === 'expression' && { expression: variableGroup.get('expression')?.value }),
          ...(source === 'context' && { context_key: variableGroup.get('context_key')?.value })
        };
        return acc;
      }, {} as Record<string, VariableConfig>);

      const setVariableModel = {
        ...baseModel,
        config: {
          variables: variablesObj,
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
                min: q.validation?.min ?? 1,
                max: q.validation?.max ?? 5
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
          mode: this.actionForm.value.mode,
          team_id: Number(this.actionForm.value.team_id),
          priority: Number(this.actionForm.value.priority),
          handoff_message: this.actionForm.value.handoff_message.trim(),
          required_context: this.requiredContext.value.filter((ctx: string) => ctx.trim()),
          fallback_options: {
            delay: Number(this.fallbackOptions.value.delay),
            fallback_message: this.fallbackOptions.value.fallback_message.trim()
          }
        }
      };
      
      // Additional validation
      if (handoffModel.config.required_context.length === 0) {
        Swal.fire('Warning', 'At least one context key is recommended for handoff', 'warning');
      }
      
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

  const formData = new FormData();
  formData.append('name', this.actionForm.value.name);
  formData.append('action_type', 'send_file');
  formData.append('intent_id', intentId.toString());
  formData.append('parent_action_id', parent_id.toString());
  formData.append('order', order.toString());
  formData.append('branch_path', this.buildBranchPath());

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

  // Handle different source types
  if (sourceType === 'upload') {
    formData.append('files', this.uploadedFile!);
   
    // Use the multipart endpoint
    this._httpService.mobileBankingPostFormData('builder/actions/create-multipart', formData).subscribe({
      next: (result: any) => this.handleActionResponse(result),
      error: (err: any) => this.handleActionError(err)
    });
  } else if (sourceType === 'chat_script') {
  
    const model = {
      ...config,
      script_content: this.actionForm.value.chat_script,
      file_type: 'text'
    };

    console.log('Submitting Model Form:', model);
    this._httpService.mobileBankingPost('builder/actions/create', model).subscribe({
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
    this._httpService.mobileBankingPost('builder/actions/create', model).subscribe({
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
  this.filePreviews[index] = this.createSafePreview(file);

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
  formData.append('parent_action_id', parent_id.toString());
  formData.append('order', order.toString());
  formData.append('branch_path', this.buildBranchPath());

  
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
      ...(item.action_url ? { action_url: item.action_url } : {})
    }))
  };
 
  try {
    formData.append('config', JSON.stringify(config));
  } catch (error) {
    console.error('Error stringifying config:', error);
    Swal.fire('Error', 'Failed to prepare carousel configuration', 'error');
    return;
  }

  Object.entries(this.carouselItemFiles).forEach(([index, file]) => {
    if (file) {
      const safeIndex = index.padStart(3, '0'); // 001, 002, etc.
      const extension = file.name.split('.').pop() || '';
      formData.append('files', file, `item_${safeIndex}.${extension}`);
    }
  });

  this._httpService.mobileBankingPostFormData('builder/actions/create-multipart', formData).subscribe({
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
  this._httpService.mobileBankingPost('builder/actions/create', model).subscribe({
    next: (result: any) => this.handleActionResponse(result),
    error: (err: any) => this.handleActionError(err)
  });
}

private handleActionResponse(result: any): void {
 
  if (result.status === '00') {
    setTimeout(() => {
      this.result = result.data;
      this.fetchNestedIntents(this.intentId);
      this.checkAndCombine();
      this.cdRef.detectChanges();
      Swal.fire('Success', result.message || "Action Created Successfully !!!!", 'success');
      this.resetForm();
      this.resetSurveyForm()
    }, 100);
  } else {
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

  let parent_id: number;
  let order: number;

  if (this.currentParent) {
    console.log('Creating nested trigger under:', this.currentParent);

    parent_id = this.currentParent.id;
    console.log('Parent ID for nested trigger:', parent_id);

    order = this.getNextOrder(this.currentParent);
  } else {
    // For root-level triggers
    parent_id = this.intentId;
    order = this.combinedItems.length > 0 
      ? this.getNextRootOrder() 
      : 1; 
  }

  const model = { 
    ...this.triggerForm.value,
    chatbot_id: chatbotId,
    parent_id: parent_id,
    order: order,
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

getNextRootOrder(): number {
  const rootTriggers = this.combinedItems.filter(item => 
    item.itemType === 'trigger' && item.parent_id === this.intentId
  );
  return rootTriggers.length + 1;
}

getNextOrder(parentItem: any): number {
  if (!parentItem) return 1;
  
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
          Swal.fire('Error', this.launchMessage || "Error in Launching the Bot", 'error');
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
    this.isEditing = false;
   this.editingItem = null;
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

  if (!this.currentParent) {
    return 'root';
  }

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

  if (action.parent_id) {
    const parent = this.combinedItems.find(item => 
      item.id === action.parent_id || 
      (item.itemType === 'trigger' && item.id === action.parent_id)
    );
    
    if (parent && parent.itemType === 'trigger') {
      return parent;
    }
  }

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
  Object.values(this.filePreviews).forEach(url => {
    URL.revokeObjectURL(url as any);
  });
}
}