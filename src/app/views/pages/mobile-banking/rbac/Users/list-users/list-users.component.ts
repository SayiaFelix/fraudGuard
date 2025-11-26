import { HttpClient } from '@angular/common/http';
import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { GlobalService } from 'src/app/shared/services/global.service';
import Swal from 'sweetalert2';
import {environment} from 'src/environments/environment';

export interface Task {
  id: number;
  description: string;
  assignee?: string;
  status: string;
  dueDate?: string; 
}
export interface Workflow {
  id?: string;
  auditId: string;
  title: string;
  scope: string;
  department: string;
  assignedTo: string;
  status: string;
  startDate: string;
  dueDate: string;
  tasks: any[];
  miniFindings?: any[];
  fieldwork?: {
    evidence: any[];
    meetings: any[];
    weeklyUpdates: any[];
    preClosing: any[];
    documents: any[];
  };
}
export interface MiniFinding {
  id?: string;
  taskId?: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Noted' | 'Confirmed';
  createdAt?: string;
}
@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.scss']
})
export class ListUsersComponent implements OnInit {
  private api = `${environment.apiBase}/workflows`; 
  private apiUrl = `${environment.apiBase}/audits`;

   // UI state
  isDetailsPanelVisible = false;
  selectedWorkflow: Workflow | null = null;
  isAddEditModalVisible = false;
  isEditMode = false;

  // Data
  allWorkflows: Workflow[] = [];
  visibleWorkflows: Workflow[] = [];
  recordsToShow = 5;
  isLoading = false;

showTaskForm = false;
showEvidenceForm = false;
showMeetingForm = false;
showWeeklyForm = false;
showFindingForm = false;

editingFieldworkTask: number | null = null;
editingEvidence: number | null = null;
editingMeeting: number | null = null;
editingFinding: number | null = null;
fieldworkTaskForm: FormGroup;
evidenceForm: FormGroup;
meetingForm: FormGroup;
weeklyForm: FormGroup;
findingForm: FormGroup;

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  filteredWorkflows: Workflow[] = [];

  searchTerm = '';
  departmentFilter = '';
  statusFilter = '';

  // Forms
  workflowForm: FormGroup;
  taskForm: FormGroup;
   miniFindingForm: FormGroup;

fieldwork: {
  tasks: any[];
  evidence: any[];
  meetings: any[];
  weeklyUpdates: any[];
  preClosing: any[];
  documents: any[];
} = {
  tasks: [],
  evidence: [],
  meetings: [],
  weeklyUpdates: [],
  preClosing: [],
  documents: []
};
editingWeekly: number | null = null;
fieldworkTab: string = 'tasks';
selectedEvidenceFiles: File[] = [];
showDocumentForm = false;
editingDocument: number | null = null;
selectedDocumentFile: File | null = null;
documentForm: FormGroup;
documentSearch = '';
documentTypeFilter = '';
documentCategoryFilter = '';
filteredDocuments: any[] = [];
  allAudits: any[];
  selectedAudit: any;
showMiniFindingForm = false;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private globalService: GlobalService
  ) {
    this.workflowForm = this.fb.group({
      title: ['', Validators.required],
      scope: [''],
      department: [''],
      assignedTo: [''],
      status: ['Not Started', Validators.required],
      startDate: ['', Validators.required],
      dueDate: ['', Validators.required]
    });

    this.taskForm = this.fb.group({
      description: ['', Validators.required],
      assignee: [''],
      status: ['Pending', Validators.required],
      dueDate: ['']
    });

    this.miniFindingForm = this.fb.group({
    taskId: ['', Validators.required],
    description: ['', Validators.required],
    severity: ['Low', Validators.required],
    status: ['Noted', Validators.required]
  });

  this.fieldworkTaskForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    assignedTo: [''],
    status: ['Not Started'],
    dueDate: [''],
    priority: ['Medium']
  });

this.evidenceForm = this.fb.group({
  title: ['', Validators.required],
  details: [''],
  status: ['Requested'],
  requestedFrom: [''],
  dueDate: ['']
});

this.meetingForm = this.fb.group({
  person: ['', Validators.required],
  purpose: [''],
  notes: [''],
  date: ['', Validators.required],
  startTime: [''],
  endTime: [''],
  attendees: [''],
  followUpRequired: ['no'],
  location: ['']
}, { validators: this.timeOrderValidator });

this.weeklyForm = this.fb.group({
    week: ['', Validators.required],
    startDate: [''],
    endDate: [''],
    summary: [''],
    nextWeekPlan: [''],
    issues: ['']
  });

  this.findingForm = this.fb.group({
    title: ['', Validators.required],
    details: [''],
    severity: ['Medium'],
    recommendation: [''],
    status: ['Draft']
  });
  this.documentForm = this.fb.group({
  name: ['', Validators.required],
  type: ['', Validators.required],
  description: [''],
  category: ['Fieldwork'],
  confidentiality: ['Internal Use']
});
}

ngOnInit(): void {
      this.loadWorkflows();
      this.loadUsers(); 
      this.loadAudits();
    
  }

  loadWorkflows(): void {
  this.isLoading = true;
  this.globalService.list().subscribe({
    next: (res) => {
      this.allWorkflows = res.map(w => ({ ...w, tasks: w.tasks || [] }))
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      
      this.applyFiltersAndPagination();
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Failed to load workflows', err);
      this.isLoading = false;
    }
  });
}


applyFiltersAndPagination(): void {
  let list = [...this.allWorkflows]; 
  
  const search = this.searchTerm.trim().toLowerCase();

  if (search) {
    list = list.filter(w =>
      (w.title || '').toLowerCase().includes(search) ||
      (w.department || '').toLowerCase().includes(search) ||
      (w.assignedTo || '').toLowerCase().includes(search)
    );
  }
  
  if (this.departmentFilter) {
    list = list.filter(w => (w.department || '').toLowerCase().includes(this.departmentFilter.toLowerCase()));
  }
  
  if (this.statusFilter) {
    list = list.filter(w => (w.status || '').toLowerCase() === this.statusFilter.toLowerCase());
  }
  this.filteredWorkflows = list;

  this.totalPages = Math.ceil(this.filteredWorkflows.length / this.pageSize);
  
  // Ensure current page is valid
  if (this.currentPage > this.totalPages) {
    this.currentPage = 1;
  }
  
  const startIndex = (this.currentPage - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  this.visibleWorkflows = this.filteredWorkflows.slice(startIndex, endIndex);
}

onPageJump(pageNumber: number): void {
  if (pageNumber >= 1 && pageNumber <= this.totalPages) {
    this.currentPage = pageNumber;
    this.applyFiltersAndPagination();
  }
}

  onPageSizeChange(): void {
    this.currentPage = 1; 
    this.applyFiltersAndPagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFiltersAndPagination();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFiltersAndPagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFiltersAndPagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredWorkflows.length);
    return `${start}-${end}`;
  }

  loadMore(): void {
    this.pageSize += 5;
    this.applyFiltersAndPagination();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.departmentFilter = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

selectFieldworkTab(tab: string): void {
  this.fieldworkTab = tab;
  this.cancelFieldworkTask();
  this.cancelEvidence();
  this.cancelMeeting();
  this.cancelWeekly();
  this.cancelFinding();
  this.cancelDocument();
  this.cancelMiniFindingForm(); 
}

cancelMiniFindingForm(): void {
  this.showMiniFindingForm = false;
  this.miniFindingForm.reset({
    severity: 'Low',
    status: 'Noted'
  });
}

addMiniFinding(): void {
  if (!this.selectedWorkflow) return;
  if (this.miniFindingForm.invalid) {
    this.miniFindingForm.markAllAsTouched();
    return;
  }
  
  const finding: any = {
    ...this.miniFindingForm.value,
    id: Date.now().toString(),
    createdAt: new Date().toISOString().split('T')[0]
  };

  const updated = {
    ...this.selectedWorkflow,
    miniFindings: [...(this.selectedWorkflow.miniFindings || []), finding]
  };

  this.globalService.update(updated.id!, updated).subscribe({
    next: wf => {
      this.selectedWorkflow = wf;
      this.cancelMiniFindingForm();
      Swal.fire('Success', 'Mini finding added successfully!', 'success');
    },
    error: err => console.error('Failed to add mini finding', err)
  });
}

deleteMiniFinding(id: string): void {
  if (!this.selectedWorkflow) return;
  const updated = {
    ...this.selectedWorkflow,
    miniFindings: (this.selectedWorkflow.miniFindings || []).filter(mf => mf.id !== id)
  };

  this.globalService.update(updated.id!, updated).subscribe({
    next: wf => {
      this.selectedWorkflow = wf;
      this.loadWorkflows();
      Swal.fire('Deleted', 'Mini finding deleted successfully', 'success');
    },
    error: err => console.error('Failed to delete mini finding', err)
  });
}

private timeOrderValidator(group: FormGroup): { [key: string]: any } | null {
  const startTime = group.get('startTime')?.value;
  const endTime = group.get('endTime')?.value;
  
  if (startTime && endTime && startTime >= endTime) {
    return { 'timeOrder': true };
  }
  return null;
}

saveMeeting(): void {
  if (this.meetingForm.invalid) {
    this.meetingForm.markAllAsTouched();
    if (this.meetingForm.errors?.['timeOrder']) {
      Swal.fire('Time Error', 'End time must be after start time', 'warning');
    }
    return;
  }

  const meetingData = this.meetingForm.value;

  if (this.editingMeeting !== null) {
    this.fieldwork.meetings[this.editingMeeting] = {
      ...this.fieldwork.meetings[this.editingMeeting],
      ...meetingData
    };
  } else {
    this.fieldwork.meetings.push({
      id: 'mt' + Date.now(),
      ...meetingData
    });
  }

  this.cancelMeeting();
  this.saveFieldworkToBackend();
  Swal.fire('Success', 'Meeting saved!', 'success');
}

cancelMeeting(): void {
  this.editingMeeting = null;
  this.showMeetingForm = false;
  this.meetingForm.reset({
    followUpRequired: 'no'
  });
}

getMiniFindingsClass(): string {
  const count = this.getMiniFindingsCount();
  const baseClass = 'accordion-button';
  return count > 0 ? `${baseClass} has-items` : `${baseClass} no-items`;
}

getMiniFindingsCount(): number {
  return this.selectedWorkflow?.miniFindings?.length || 0;
}
validateMeetingTimes(): void {
  const startTime = this.meetingForm.get('startTime')?.value;
  const endTime = this.meetingForm.get('endTime')?.value;
  
  if (startTime && endTime && startTime >= endTime) {
    this.meetingForm.get('endTime')?.setErrors({ 'timeOrder': true });
  } else {
    this.meetingForm.get('endTime')?.setErrors(null);
  }
}

saveEvidence(): void {
  if (this.evidenceForm.invalid || !this.validateFormBeforeSubmit(this.evidenceForm, 'evidence')) {
    this.evidenceForm.markAllAsTouched();
    return;
  }

  const evidenceData = this.evidenceForm.value;

  if (this.editingEvidence !== null) {
    this.fieldwork.evidence[this.editingEvidence] = {
      ...this.fieldwork.evidence[this.editingEvidence],
      ...evidenceData
    };
  } else {
    this.fieldwork.evidence.push({
      id: 'ev' + Date.now(),
      ...evidenceData
    });
  }

  this.cancelEvidence();
  this.saveFieldworkToBackend();
  Swal.fire('Success', 'Evidence request saved!', 'success');
}

editWeekly(index: number): void {
  this.editingWeekly = index;
  const weeklyUpdate = this.fieldwork.weeklyUpdates[index];
  this.weeklyForm.patchValue(weeklyUpdate);
  this.showWeeklyForm = true;
}

cancelEvidence(): void {
  this.editingEvidence = null;
  this.showEvidenceForm = false;
  this.evidenceForm.reset({
    status: 'Requested'
  });
}

removeEvidence(index: number): void {
  Swal.fire({
    title: 'Delete evidence request?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      this.fieldwork.evidence.splice(index, 1);
      this.saveFieldworkToBackend();
      Swal.fire('Deleted', 'Evidence request deleted', 'success');
    }
  });
}

showWorkflowDetails(w: Workflow): void {
  if (this.selectedWorkflow && this.selectedWorkflow.id === w.id) {
    console.log('content', this.selectedWorkflow);
    this.hideDetails();
    return;
  }
  
  this.selectedWorkflow = { 
    ...w,
    fieldwork: w.fieldwork || {
      evidence: [],
      meetings: [],
      weeklyUpdates: [],
      preClosing: [],
      documents: []
    }
  };
  
  this.loadFieldworkData();
  
  this.isDetailsPanelVisible = true;
  console.log('Clicked workflow with fieldwork:', this.selectedWorkflow);
  this.cachePlanningTasks();
  
  if (w.id) {
    this.globalService.get(w.id).subscribe({
      next: wf => {
        this.selectedWorkflow = {
          ...wf,
          fieldwork: wf.fieldwork || {
            evidence: [],
            meetings: [],
            weeklyUpdates: [],
            preClosing: [],
            documents: []
          }
        };
        this.loadFieldworkData();
        this.cachePlanningTasks();
      },
      error: err => console.warn('Could not fetch workflow details', err)
    });
  }
}

private loadFieldworkData(): void {
  if (this.selectedWorkflow?.fieldwork) {
    this.fieldwork = {
      tasks: [],
      evidence: this.selectedWorkflow.fieldwork.evidence || [],
      meetings: this.selectedWorkflow.fieldwork.meetings || [],
      weeklyUpdates: this.selectedWorkflow.fieldwork.weeklyUpdates || [],
      preClosing: this.selectedWorkflow.fieldwork.preClosing || [],
      documents: this.selectedWorkflow.fieldwork.documents || []
    };
    this.filterDocuments(); 
  }
}

onDocumentFileSelected(event: any): void {
  const file: File = event.target.files[0];
  if (file) {
    if (file.size > 25 * 1024 * 1024) {
      Swal.fire('File too large', `${file.name} exceeds 25MB limit`, 'warning');
      return;
    }
    this.selectedDocumentFile = file;
    event.target.value = ''; 
  }
}

removeDocumentFile(): void {
  this.selectedDocumentFile = null;
}

editDocument(index: number): void {
  if (!this.fieldwork.documents?.[index]) return;
  
  const doc = this.fieldwork.documents[index];
  this.editingDocument = index;
  this.documentForm.patchValue({
    name: doc.name,
    type: doc.type,
    description: doc.description,
    category: doc.category,
    confidentiality: doc.confidentiality
  });
  this.showDocumentForm = true;
}

cancelDocument(): void {
  this.editingDocument = null;
  this.showDocumentForm = false;
  this.selectedDocumentFile = null;
  this.documentForm.reset({
    category: 'Fieldwork',
    confidentiality: 'Internal Use'
  });
}

filterDocuments(): void {
  let filtered = this.fieldwork.documents || [];
  
  if (this.documentSearch) {
    const search = this.documentSearch.toLowerCase();
    filtered = filtered.filter(doc => 
      doc.name.toLowerCase().includes(search) ||
      doc.description.toLowerCase().includes(search) ||
      doc.type.toLowerCase().includes(search)
    );
  }
  
  if (this.documentTypeFilter) {
    filtered = filtered.filter(doc => doc.type === this.documentTypeFilter);
  }
  
  if (this.documentCategoryFilter) {
    filtered = filtered.filter(doc => doc.category === this.documentCategoryFilter);
  }
  
  this.filteredDocuments = filtered;
}

private uploadDocumentFile(file: File): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString()
      };
      resolve(mockUploadedFile);
    }, 1000);
  });
}

private saveFieldworkToBackend(): void {
  if (!this.selectedWorkflow?.id) return;

  const updatedWorkflow: Workflow = {
    ...this.selectedWorkflow,
    fieldwork: {
      evidence: this.fieldwork.evidence,
      meetings: this.fieldwork.meetings,
      weeklyUpdates: this.fieldwork.weeklyUpdates,
      preClosing: this.fieldwork.preClosing,
      documents: this.fieldwork.documents
    }
  };

  this.globalService.update(updatedWorkflow.id!, updatedWorkflow).subscribe({
    next: (savedWorkflow) => {
      this.selectedWorkflow = savedWorkflow;
    },
    error: (err) => {
      console.error('Failed to save fieldwork data:', err);
      Swal.fire('Error', 'Failed to save data', 'error');
    }
  });
}

openFieldworkModal() {
  if (this.selectedWorkflow?.fieldwork) {
    this.fieldwork = {
      tasks: [],
      evidence: this.selectedWorkflow.fieldwork.evidence || [],
      meetings: this.selectedWorkflow.fieldwork.meetings || [],
      weeklyUpdates: this.selectedWorkflow.fieldwork.weeklyUpdates || [],
      preClosing: this.selectedWorkflow.fieldwork.preClosing || [],
      documents: this.selectedWorkflow.fieldwork.documents || []
    };
    this.filterDocuments();
  }
  
  this.isFieldworkModalVisible = true;
}
onEvidenceFileSelected(event: any): void {
  const files: FileList = event.target.files;
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire('File too large', `${file.name} exceeds 10MB limit`, 'warning');
        continue;
      }
      
      this.selectedEvidenceFiles.push(file);
    }
    event.target.value = ''; 
  }
}

removeEvidenceFile(index: number): void {
  this.selectedEvidenceFiles.splice(index, 1);
}

removeUploadedEvidenceFile(index: number): void {
  const currentFiles = this.evidenceForm.get('uploadedFiles')?.value || [];
  currentFiles.splice(index, 1);
  this.evidenceForm.patchValue({ uploadedFiles: currentFiles });
}

formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

private uploadFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mockUploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file), 
        uploadedAt: new Date().toISOString()
      };
      resolve(mockUploadedFile);
    }, 1000);
  });

}

validateDueDate(formType: 'task' | 'evidence'): void {
  let form: FormGroup;
  
  if (formType === 'task') {
    form = this.fieldworkTaskForm;
  } else {
    form = this.evidenceForm;
  }
  
  const dueDate = form.get('dueDate')?.value;
  
  if (dueDate && new Date(dueDate) < new Date(this.today)) {
    form.get('dueDate')?.setErrors({ 'min': true });
  } else {
    form.get('dueDate')?.setErrors(null);
  }
}

validateDateRange(formType: 'weekly' | 'workflow'): void {
  let form: FormGroup;
  
  if (formType === 'weekly') {
    form = this.weeklyForm;
  } else {
    form = this.workflowForm;
  }
  
  const startDate = form.get('startDate')?.value;
  const endDate = form.get('endDate')?.value || form.get('dueDate')?.value;
  
  // Validate start date
  if (startDate && new Date(startDate) < new Date(this.today)) {
    form.get('startDate')?.setErrors({ 'min': true });
  } else {
    form.get('startDate')?.setErrors(null);
  }
  
  // Validate end date
  if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
    form.get(formType === 'weekly' ? 'endDate' : 'dueDate')?.setErrors({ 'min': true });
  } else {
    form.get(formType === 'weekly' ? 'endDate' : 'dueDate')?.setErrors(null);
  }
}

validateFormBeforeSubmit(form: FormGroup, formType: string): boolean {
  let isValid = true;
  
  const dateFields = [];
  
  if (formType === 'workflow') {
    dateFields.push('startDate', 'dueDate');
  } else if (formType === 'weekly') {
    dateFields.push('startDate', 'endDate');
  } else if (formType === 'task' || formType === 'evidence') {
    dateFields.push('dueDate');
  }
  
  dateFields.forEach(field => {
    const control = form.get(field);
    if (control?.errors?.['min']) {
      isValid = false;
      control.markAsTouched();
    }
  });
  
  return isValid;
}

deleteMeeting(index: number): void {
  Swal.fire({
    title: 'Delete meeting?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      this.fieldwork.meetings.splice(index, 1);
      // Save to backend immediately
      this.saveFieldworkToBackend();
      Swal.fire('Deleted', 'Meeting deleted', 'success');
    }
  });
}

loadAudits(): void {
      this.isLoading = true;
      this.http.get<any[]>(this.apiUrl).subscribe({
        next: (audits) => {
          this.allAudits = audits;
          this.applyFiltersAndPagination();
          this.isLoading = false;
        },
        error: () => {
       
          this.isLoading = false;
        }
      });
    }

selectAudit(audit: any) {
  this.selectedAudit = audit;
  this.fieldwork.tasks = audit.fieldworkTasks || [];
}
 

cancelFieldworkTask(): void {
  this.editingFieldworkTask = null;
  this.showTaskForm = false;
  this.fieldworkTaskForm.reset({
    status: 'Not Started',
    priority: 'Medium'
  });
}

cancelWeekly(): void {
  this.editingWeekly = null;
  this.showWeeklyForm = false;
  this.weeklyForm.reset();
}

saveFinding(): void {
  if (this.findingForm.invalid) {
    this.findingForm.markAllAsTouched();
    return;
  }

  const findingData = this.findingForm.value;

  if (this.editingFinding !== null) {
    this.fieldwork.preClosing[this.editingFinding] = {
      ...this.fieldwork.preClosing[this.editingFinding],
      ...findingData
    };
  } else {
    this.fieldwork.preClosing.push({
      id: 'fd' + Date.now(),
      ...findingData
    });
  }

  this.cancelFinding();
  // Save to backend immediately
  this.saveFieldworkToBackend();
  Swal.fire('Success', 'Finding saved!', 'success');
}

async saveDocument(): Promise<void> {
  if (this.documentForm.invalid || !this.selectedDocumentFile) {
    this.documentForm.markAllAsTouched();
    return;
  }

  try {
    const uploadedFile = await this.uploadDocumentFile(this.selectedDocumentFile);
    
    const documentData = {
      ...this.documentForm.value,
      file: uploadedFile,
      uploadedAt: new Date().toISOString(),
      id: 'doc' + Date.now()
    };

    if (this.editingDocument !== null) {
      this.fieldwork.documents[this.editingDocument] = documentData;
    } else {
      this.fieldwork.documents.push(documentData);
    }

    this.selectedDocumentFile = null;
    this.cancelDocument();
    this.filterDocuments(); // Update filtered list

    this.saveFieldworkToBackend();
    Swal.fire('Success', 'Document uploaded successfully!', 'success');

  } catch (error) {
    console.error('Error uploading document:', error);
    Swal.fire('Error', 'Failed to upload document', 'error');
  }
}

editEvidence(index: number): void {
  this.editingEvidence = index;
  this.evidenceForm.patchValue(this.fieldwork.evidence[index]);
  this.showEvidenceForm = true;
}

editMeeting(index: number): void {
  this.editingMeeting = index;
  this.meetingForm.patchValue(this.fieldwork.meetings[index]);
  this.showMeetingForm = true;
}

deleteFinding(index: number): void {
  Swal.fire({
    title: 'Delete finding?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      this.fieldwork.preClosing.splice(index, 1);
      this.saveFieldworkToBackend();
      Swal.fire('Deleted', 'Finding deleted', 'success');
    }
  });
}

deleteDocument(index: number): void {
  Swal.fire({
    title: 'Delete document?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      this.fieldwork.documents.splice(index, 1);
      this.filterDocuments(); 
      this.saveFieldworkToBackend();
      Swal.fire('Deleted', 'Document deleted successfully', 'success');
    }
  });
}

getFieldworkCount(section: string): number {
  const fieldworkSection = section as keyof typeof this.fieldwork;
  return this.fieldwork[fieldworkSection]?.length || 0;
}

getFieldworkSectionClass(section: string): string {
  const count = this.getFieldworkCount(section as keyof typeof this.fieldwork);
  const baseClass = 'accordion-button';
  return count > 0 ? `${baseClass} has-items` : `${baseClass} no-items`;
}

getFieldworkTasksClass(): string {
  const count = this.selectedWorkflow?.tasks?.length || 0;
  const baseClass = 'accordion-button';
  return count > 0 ? `${baseClass} has-items` : `${baseClass} no-items`;
}

getPlanningTasksClass(): string {
  const count = this.cachedPlanningTasks.length;
  const baseClass = 'accordion-button';
  return count > 0 ? `${baseClass} has-items` : `${baseClass} no-items`;
}

getEvidenceStatusClass(status: string): string {
  switch (status) {
    case 'Requested': return 'bg-warning';
    case 'Received': return 'bg-info';
    case 'Under Review': return 'bg-primary';
    case 'Completed': return 'bg-success';
    default: return 'bg-secondary';
  }
}

getFindingSeverityClass(severity: string): string {
  switch (severity) {
    case 'Low': return 'bg-success';
    case 'Medium': return 'bg-warning';
    case 'High': return 'bg-danger';
    case 'Critical': return 'bg-dark';
    default: return 'bg-secondary';
  }
}

getDocumentConfidentialityClass(confidentiality: string): string {
  switch (confidentiality) {
    case 'Internal Use': return 'bg-info';
    case 'Confidential': return 'bg-warning';
    case 'Strictly Confidential': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

saveWeeklyUpdate(): void {
  if (this.weeklyForm.invalid || !this.validateFormBeforeSubmit(this.weeklyForm, 'weekly')) {
    this.weeklyForm.markAllAsTouched();
    return;
  }

  const weeklyData = this.weeklyForm.value;

  if (this.editingWeekly !== null) {
    this.fieldwork.weeklyUpdates[this.editingWeekly] = {
      ...this.fieldwork.weeklyUpdates[this.editingWeekly],
      ...weeklyData
    };
  } else {
    this.fieldwork.weeklyUpdates.push({
      id: 'wk' + Date.now(),
      ...weeklyData
    });
  }

  this.cancelWeekly();
  this.saveFieldworkToBackend();
  Swal.fire('Success', 'Weekly update saved!', 'success');
}

editFinding(index: number): void {
  this.editingFinding = index;
  this.findingForm.patchValue(this.fieldwork.preClosing[index]);
  this.showFindingForm = true;
}

deleteWeekly(index: number): void {
  Swal.fire({
    title: 'Delete weekly update?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      if (this.editingWeekly === index) {
        this.cancelWeekly();
      } else if (this.editingWeekly !== null && this.editingWeekly > index) {
        this.editingWeekly--;
      }
      
      this.fieldwork.weeklyUpdates.splice(index, 1);
      this.saveFieldworkToBackend();
      Swal.fire('Deleted', 'Weekly update deleted', 'success');
    }
  });
}

cancelFinding(): void {
  this.editingFinding = null;
  this.showFindingForm = false;
  this.findingForm.reset({
    severity: 'Medium',
    status: 'Draft'
  });
}

saveAllFieldwork(): void {
  if (!this.selectedWorkflow) {
    Swal.fire('Error', 'No workflow selected', 'error');
    return;
  }

  const updatedWorkflow: Workflow = {
    ...this.selectedWorkflow,
    fieldwork: {
      evidence: this.fieldwork.evidence,
      meetings: this.fieldwork.meetings,
      weeklyUpdates: this.fieldwork.weeklyUpdates,
      preClosing: this.fieldwork.preClosing,
      documents: this.fieldwork.documents
    }
  };

  this.globalService.update(updatedWorkflow.id!, updatedWorkflow).subscribe({
    next: (savedWorkflow) => {
      this.selectedWorkflow = savedWorkflow;
      Swal.fire('Success', 'All fieldwork data saved successfully!', 'success');
      this.closeFieldworkModal();
      this.loadWorkflows(); 
    },
    error: (err) => {
      console.error('Failed to save fieldwork data:', err);
      Swal.fire('Error', 'Failed to save fieldwork data', 'error');
    }
  });
}

get allFieldworkTasks() {
  const planningTasks = this.selectedWorkflow?.tasks || [];
  const fieldworkTasks = this.fieldwork?.tasks || [];
  return [...planningTasks, ...fieldworkTasks];
}


isFieldworkModalVisible = false;
activeFieldworkTab = 'fieldwork';

addFieldworkTask() {
  this.showTaskForm = true;
  this.cancelFieldworkTask(); 
}

addEvidenceRequest() {
  this.showEvidenceForm = true;
  this.cancelEvidence(); 
}

addMeeting() {
  this.showMeetingForm = true;
  this.cancelMeeting(); 
}

addWeeklyUpdate() {
  this.showWeeklyForm = true;
  this.cancelWeekly(); 
}

addPreClosingFinding() {
  this.showFindingForm = true;
  this.cancelFinding();
}


closeFieldworkModal() {
  this.isFieldworkModalVisible = false;
}

users: any[] = [];
today: string = new Date().toISOString().split('T')[0];

loadUsers(): void {
  this.http.get<any[]>('http://localhos:3000/users').subscribe({
    next: (res) => this.users = res,
    error: (err) => console.error('Failed to load users', err)
  });
}

saveFieldworkTask(): void {
 if (this.fieldworkTaskForm.invalid || !this.selectedWorkflow ||!this.validateFormBeforeSubmit(this.fieldworkTaskForm, 'task')) {
    this.fieldworkTaskForm.markAllAsTouched();
    return;
  }
  const taskData = this.fieldworkTaskForm.value;
  if (!this.selectedWorkflow.tasks) {
    this.selectedWorkflow.tasks = [];
  }

  if (this.editingFieldworkTask !== null) {
 
    this.selectedWorkflow.tasks[this.editingFieldworkTask] = {
      ...this.selectedWorkflow.tasks[this.editingFieldworkTask],
      ...taskData
    };
  } else {
    this.selectedWorkflow.tasks.push({
      id: 'fw' + Date.now(),
      ...taskData
    });
  }
  this.updateWorkflowTasks();
  this.cancelFieldworkTask();
  Swal.fire('Success', 'Fieldwork task saved!', 'success');
}

editFieldworkTask(index: number): void {
  if (!this.selectedWorkflow?.tasks?.[index]) return;
  
  this.editingFieldworkTask = index;
  this.fieldworkTaskForm.patchValue(this.selectedWorkflow.tasks[index]);
  this.showTaskForm = true;
}

removeFieldworkTask(index: number): void {
  if (!this.selectedWorkflow?.tasks) return;

  Swal.fire({
    title: 'Delete task?',
    text: 'This action cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      this.selectedWorkflow?.tasks.splice(index, 1);
      this.updateWorkflowTasks();
      Swal.fire('Deleted', 'Task deleted successfully', 'success');
    }
  });
}

private updateWorkflowTasks(): void {
  if (!this.selectedWorkflow?.id) return;

  this.globalService.update(this.selectedWorkflow.id, this.selectedWorkflow).subscribe({
    next: (updatedWorkflow) => {
      this.selectedWorkflow = updatedWorkflow;
      this.loadWorkflows(); 
    },
    error: (err) => {
      console.error('Failed to update workflow tasks', err);
      Swal.fire('Error', 'Failed to save tasks', 'error');
    }
  });
}

cachedPlanningTasks: any[] = [];
editingTask: any = null; 
editTask(task: Task): void {
  this.editingTask = task;
  this.taskForm.patchValue(task); 
}

cancelEditTask(): void {
  this.editingTask = null;
  this.taskForm.reset({ status: 'Pending' });
}

addTaskToWorkflow(): void {
  if (!this.selectedWorkflow) {
    Swal.fire('Error', 'No workflow selected', 'error');
    return;
  }

  if (this.taskForm.invalid) {
    this.taskForm.markAllAsTouched();
    return;
  }

  const newTask = {
    id: 't' + Date.now(), 
    ...this.taskForm.value
  };

  this.selectedWorkflow.tasks = this.selectedWorkflow.tasks || [];
  this.selectedWorkflow.tasks.push(newTask);

  const updated = { ...this.selectedWorkflow }; 
  this.syncWorkflowAndAudit(updated);

  Swal.fire('Task Added', 'New task added successfully!', 'success');
  this.taskForm.reset({ status: 'Pending' });
}

getTaskName(taskId: string): string {
  if (!this.selectedWorkflow?.tasks) return 'Unknown Task';
  const task = this.selectedWorkflow.tasks.find(t => t.id === taskId);
  return task?.description || task?.title || 'Unknown Task';
}

isTaskModalVisible = false;
isFindingModalVisible = false;

openFindingModal(): void {
    if (!this.selectedWorkflow) return;
    this.miniFindingForm.reset({
      taskId: '',
      description: '',
      severity: 'Low',
      status: 'Noted'
    });
    this.isFindingModalVisible = true;
  }

  closeFindingModal(): void {
    this.isFindingModalVisible = false;
  }

openTaskModal() { this.isTaskModalVisible = true; }
closeTaskModal() { this.isTaskModalVisible = false; }

getFindingsForTask(taskId: number) {
  return this.selectedWorkflow?.miniFindings?.filter(f => f.taskId === taskId) || [];
}

getAuditPlanningTasks() {
  if (!this.selectedWorkflow) return [];

  const audit = this.allAudits.find(a => a.id === this.selectedWorkflow?.auditId);
  console.log('Selected Audit for planning tasks:', audit);
  if (!audit?.planningTasks || !Array.isArray(audit.planningTasks) || audit.planningTasks.length === 0) {
    console.log('No planning tasks found');
    return [];
  }

  const tasks = audit.planningTasks.map((t: any, index: number) => ({
    id: t.id || `p${index}`,
    description: t.name || t.description || '',
    assignee: t.owner || t.assignee || '',
    status: t.status || 'Pending',
    dueDate: t.endDate || t.startDate || '—'
  }));

  console.log('Mapped Planning Tasks:', tasks);
  return tasks;
}


// showWorkflowDetails(w: Workflow): void {
//   if (this.selectedWorkflow && this.selectedWorkflow.id === w.id) {
//     console.log('content', this.selectedWorkflow);
//     this.hideDetails();
//     return;
//   }
  
//   this.selectedWorkflow = { ...w };
//   this.isDetailsPanelVisible = true;
//   console.log('Clicked workflow:', w);
//   this.cachePlanningTasks();
  
//   if (w.id) {
//     this.globalService.get(w.id).subscribe({
//       next: wf => {
//         this.selectedWorkflow = wf;
//         this.cachePlanningTasks(); // Re-cache after loading
//       },
//       error: err => console.warn('Could not fetch workflow details', err)
//     });
//   }
// }

cachePlanningTasks(): void {
  if (!this.selectedWorkflow) {
    this.cachedPlanningTasks = [];
    return;
  }

  const audit = this.allAudits.find(a => a.id === this.selectedWorkflow?.auditId);

  if (!audit?.planningTasks || !Array.isArray(audit.planningTasks) || audit.planningTasks.length === 0) {
    console.log('No planning tasks found');
    this.cachedPlanningTasks = [];
    return;
  }

  this.cachedPlanningTasks = audit.planningTasks.map((t: any, index: number) => ({
    id: t.id || `p${index}`,
    description: t.name || t.description || '',
    assignee: t.owner || t.assignee || '',
    status: t.status || 'Pending',
    dueDate: t.endDate || t.startDate || '—'
  }));
}

hideDetails(): void {
    this.isDetailsPanelVisible = false;
    this.selectedWorkflow = null;
     this.cachedPlanningTasks = [];
  }

openAddModal(): void {
    this.isEditMode = false;
    this.workflowForm.reset({ status: 'Not Started' });
    const today = new Date().toISOString().split('T')[0];
    this.workflowForm.patchValue({ startDate: today, dueDate: today });
    this.isAddEditModalVisible = true;
    this.selectedWorkflow = null;
  }

openEditModal(w: Workflow): void {
    this.isEditMode = true;
    this.isAddEditModalVisible = true;
    this.selectedWorkflow = w;
    this.workflowForm.patchValue({
      title: w.title,
      scope: w.scope || '',
      department: w.department || '',
      assignedTo: w.assignedTo || '',
      status: w.status || 'Not Started',
      startDate: w.startDate || '',
      dueDate: w.dueDate || ''
    });
  }

closeModal(): void {
    this.isAddEditModalVisible = false;
    this.isEditMode = false;
    this.workflowForm.reset();
  }

saveWorkflow(): void { 
  if (this.workflowForm.invalid || !this.validateFormBeforeSubmit(this.workflowForm, 'workflow')) {
    this.workflowForm.markAllAsTouched();
    return;
  }

  const payload: Workflow = {
    ...this.workflowForm.value,
    id: this.selectedWorkflow?.id || this.workflowForm.value.id,  
    auditId: this.selectedWorkflow?.auditId || this.workflowForm.value.id, 
    tasks: this.selectedWorkflow?.tasks || [],
    miniFindings: this.selectedWorkflow?.miniFindings || []
  };

  if (this.isEditMode && this.selectedWorkflow && this.selectedWorkflow.id) {
    // ------------------- UPDATE WORKFLOW -------------------
    this.globalService.update(this.selectedWorkflow.id!, payload).subscribe({
      next: () => {
        Swal.fire('Updated', 'Workflow updated successfully!', 'success');

        const auditPayload = {
          id: payload.auditId,
          title: payload.title, 
          scope: payload.scope,
          department: payload.department,
          status: payload.status === 'Not Started' ? 'Planned' : payload.status,
          startDate: payload.startDate,
          endDate: payload.dueDate
        };

        this.http.put(`${this.apiUrl}/${payload.auditId}`, auditPayload).subscribe({
          next: () => this.globalService.notifyAuditsChanged(),
          error: err => console.error('Audit sync failed:', err)
        });

        this.closeModal();
        this.loadWorkflows();
          this.hideDetails()
        this.globalService.notifyWorkflowsChanged();
      },
      error: err => {
        console.error(err);
        Swal.fire('Error', 'Failed to update workflow', 'error');
      }
    });

  } else {
    // ------------------- CREATE WORKFLOW -------------------
    const newPayload = {
      ...payload,
      title: `${payload.title}`
    };

    this.globalService.create(newPayload).subscribe({
      next: (createdWf: Workflow) => {
        Swal.fire('Created', 'Workflow created successfully!', 'success');
        const auditPayload = {
          id: createdWf.id,  
          title: createdWf.title.replace(/^Workflow - /, ''), 
          scope: createdWf.scope,
          department: createdWf.department,
          status: createdWf.status === 'Not Started' ? 'Planned' : createdWf.status,
          startDate: createdWf.startDate,
          endDate: createdWf.dueDate
        };

        const auditPayloads = {
            ...payload,
            title: `${payload.title}`
          };

        this.http.post(`${this.apiUrl}`, auditPayloads).subscribe({
          next: () => this.globalService.notifyAuditsChanged(),
          error: err => console.error('Audit create failed:', err)
        });

        this.closeModal();
        this.loadWorkflows();
        this.globalService.notifyWorkflowsChanged();
      },
      error: err => {
        console.error(err);
        Swal.fire('Error', 'Failed to create workflow', 'error');
      }
    });
  }
}

deleteWorkflow(id?: number | string, auditId?: string): void {
  if (!id) return;

  Swal.fire({
    title: 'Delete workflow?',
    text: 'This will remove the workflow, linked audit, and all tasks.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      this.globalService.delete(id).subscribe({
        next: () => {
          if (auditId) {
            this.http.delete(`${this.apiUrl}/${auditId}`).subscribe({
              next: () => this.globalService.notifyAuditsChanged(),
              error: err => console.warn('Failed to delete linked audit', err)
            });
          }

          Swal.fire('Deleted', 'Workflow and linked audit deleted', 'success');
          this.loadWorkflows();
          this.hideDetails();
          this.globalService.notifyWorkflowsChanged();
        },
        error: err => {
          console.error(err);
          Swal.fire('Error', 'Failed to delete workflow', 'error');
        }
      });
    }
  });
}

  openAddTask(): void {
    this.taskForm.reset({ status: 'Pending' });
  }

  addTaskToSelected(): void {
    if (!this.selectedWorkflow) return;
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    const newTask: Task = {
      ...this.taskForm.value,
      // id: Date.now(),
      // status: this.taskForm.value.status as 'Pending' | 'In Progress' | 'Done'
    };
    const updated = { ...this.selectedWorkflow, tasks: [...(this.selectedWorkflow.tasks || []), newTask] };
    // Persist update
    this.globalService.update(updated.id!, updated).subscribe({
      next: wf => {
        this.selectedWorkflow = wf;
        this.loadWorkflows();
        this.taskForm.reset({ status: 'Pending' });
      },
      error: err => console.error('Failed to add task', err)
    });
  }

  toggleTaskStatus(task: Task): void {
  if (!this.selectedWorkflow) return;

  const newStatus =
    task.status === 'Done'
      ? 'Pending'
      : task.status === 'Pending'
      ? 'In Progress'
      : 'Done';

  const tasks = (this.selectedWorkflow.tasks || []).map(t =>
    t.id === task.id ? { ...t, status: newStatus } : t
  );

  const updated = { ...this.selectedWorkflow, tasks };
  this.syncWorkflowAndAudit(updated);
}

updateTask(): void {
  if (!this.selectedWorkflow || !this.editingTask) return;
  if (this.taskForm.invalid) {
    this.taskForm.markAllAsTouched();
    return;
  }

  const tasks = this.selectedWorkflow.tasks.map(t =>
    t.id === this.editingTask.id ? { ...t, ...this.taskForm.value } : t
  );

  const updated = { ...this.selectedWorkflow, tasks };
  this.syncWorkflowAndAudit(updated);

  Swal.fire('Updated', 'Task updated successfully!', 'success');
  this.cancelEditTask();
}

deleteTask(taskId: number | string): void {
  if (!this.selectedWorkflow?.tasks) return;

  const tasks = this.selectedWorkflow.tasks.filter(t => t.id !== taskId);
  const updated = { ...this.selectedWorkflow, tasks };
  this.syncWorkflowAndAudit(updated);
  this.loadWorkflows();

  Swal.fire('Deleted', 'Task deleted successfully!', 'success');
}

private computeWorkflowStatus(tasks: Task[]): string {
  if (!tasks || tasks.length === 0) return 'Not Started';

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Done').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;

  if (done === total) return 'Completed';
  if (inProgress > 0 || done > 0) return 'In Progress';
  return 'Not Started';
}

private syncWorkflowAndAudit(updated: Workflow): void {

  updated.status = this.computeWorkflowStatus(updated.tasks);
  this.globalService.update(updated.id!, updated).subscribe({
    next: wf => {
      this.selectedWorkflow = wf;
      this.loadWorkflows();

      const auditPayload = {
        id: updated.auditId,
        title: updated.title,
        scope: updated.scope,
        department: updated.department,
        status: updated.status === 'Not Started' ? 'Planned' : updated.status,
        startDate: updated.startDate,
        endDate: updated.dueDate
      };

      this.http.put(`${this.apiUrl}/${updated.auditId}`, auditPayload).subscribe({
        next: () => this.globalService.notifyAuditsChanged(),
        error: err => console.error('Audit sync failed:', err)
      });
    },
    error: err => console.error('Failed to sync workflow', err)
  });
}

  taskProgressPercent(w?: Workflow): number {
    const wf = w || this.selectedWorkflow;
    if (!wf || !wf.tasks || wf.tasks.length === 0) return 0;
    const total = wf.tasks.length;
    const done = wf.tasks.filter(t => t.status === 'Done').length;
    return Math.round((done / total) * 100);
  }

}