import { HttpClient } from '@angular/common/http';
import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { GlobalService } from 'src/app/shared/services/global.service';
import Swal from 'sweetalert2';

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
  // Add fieldwork data to workflow
  fieldwork?: {
    evidence: any[];
    meetings: any[];
    weeklyUpdates: any[];
    preClosing: any[];
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
  
  private api = 'http://localhost:3000/workflows'; 
  private apiUrl = 'http://localhost:3000/audits';

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

  // Add these properties to your component class
showTaskForm = false;
showEvidenceForm = false;
showMeetingForm = false;
showWeeklyForm = false;
showFindingForm = false;

editingFieldworkTask: number | null = null;
editingEvidence: number | null = null;
editingMeeting: number | null = null;
editingFinding: number | null = null;

// Form groups for fieldwork
fieldworkTaskForm: FormGroup;
evidenceForm: FormGroup;
meetingForm: FormGroup;
weeklyForm: FormGroup;
findingForm: FormGroup;

  // Filters
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
  dueDate: [''],
  uploadedFiles: [[]] 
});

  this.meetingForm = this.fb.group({
    person: ['', Validators.required],
    purpose: [''],
    notes: [''],
    date: [''],
    attendees: [''],
    followUpRequired: ['no']
  });

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

// Document Methods
onDocumentFileSelected(event: any): void {
  const file: File = event.target.files[0];
  if (file) {
    // Check file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      Swal.fire('File too large', `${file.name} exceeds 25MB limit`, 'warning');
      return;
    }
    this.selectedDocumentFile = file;
    event.target.value = ''; // Reset file input
  }
}

removeDocumentFile(): void {
  this.selectedDocumentFile = null;
}

async saveDocument(): Promise<void> {
  if (this.documentForm.invalid || !this.selectedDocumentFile) {
    this.documentForm.markAllAsTouched();
    return;
  }

  try {
    // Upload the document file
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
    Swal.fire('Success', 'Document uploaded successfully!', 'success');

  } catch (error) {
    console.error('Error uploading document:', error);
    Swal.fire('Error', 'Failed to upload document', 'error');
  }
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
      this.filterDocuments(); // Update filtered list
      Swal.fire('Deleted', 'Document deleted successfully', 'success');
    }
  });
}

// Document filtering
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

// File upload method for documents
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

selectFieldworkTab(tab: string): void {
  this.fieldworkTab = tab;
  this.cancelFieldworkTask();
  this.cancelEvidence();
  this.cancelMeeting();
  this.cancelWeekly();
  this.cancelFinding();
  this.cancelDocument(); 
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
    event.target.value = ''; // Reset file input
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

async saveEvidence(): Promise<void> {
  if (this.evidenceForm.invalid) {
    this.evidenceForm.markAllAsTouched();
    return;
  }

  try {
    // Upload files if any selected
    const uploadedFiles: any[] = [];
    
    if (this.selectedEvidenceFiles.length > 0) {
      for (const file of this.selectedEvidenceFiles) {
        const uploadedFile = await this.uploadFile(file);
        if (uploadedFile) {
          uploadedFiles.push(uploadedFile);
        }
      }
    }

    const evidenceData = {
      ...this.evidenceForm.value,
      uploadedFiles: [...(this.evidenceForm.value.uploadedFiles || []), ...uploadedFiles]
    };

    // Rest of your existing save logic...
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

    this.selectedEvidenceFiles = []; // Clear selected files
    this.cancelEvidence();
    Swal.fire('Success', 'Evidence request saved!', 'success');

  } catch (error) {
    console.error('Error saving evidence:', error);
    Swal.fire('Error', 'Failed to save evidence request', 'error');
  }
}

// File upload method (you'll need to implement based on your backend)
private uploadFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    // Simulate file upload - replace with your actual file upload service
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
  
  /* 
  // Real implementation would look something like:
  const formData = new FormData();
  formData.append('file', file);
  
  return this.http.post('/api/upload', formData).toPromise();
  */
}

cancelEvidence(): void {
  this.editingEvidence = null;
  this.showEvidenceForm = false;
  this.selectedEvidenceFiles = [];
  this.evidenceForm.reset({
    status: 'Requested',
    uploadedFiles: []
  });
}

loadAudits(): void {
      this.isLoading = true;
      this.http.get<any[]>(this.apiUrl).subscribe({
        next: (audits) => {
          this.allAudits = audits;
          // console.log('Loaded audits:', audits);
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

editEvidence(index: number): void {
  this.editingEvidence = index;
  this.evidenceForm.patchValue(this.fieldwork.evidence[index]);
  this.showEvidenceForm = true;
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
      Swal.fire('Deleted', 'Evidence request deleted', 'success');
    }
  });
}

// Meeting Methods
saveMeeting(): void {
  if (this.meetingForm.invalid) {
    this.meetingForm.markAllAsTouched();
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
  Swal.fire('Success', 'Meeting saved!', 'success');
}

editMeeting(index: number): void {
  this.editingMeeting = index;
  this.meetingForm.patchValue(this.fieldwork.meetings[index]);
  this.showMeetingForm = true;
}

cancelMeeting(): void {
  this.editingMeeting = null;
  this.showMeetingForm = false;
  this.meetingForm.reset({
    followUpRequired: 'no'
  });
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
      Swal.fire('Deleted', 'Meeting deleted', 'success');
    }
  });
}

saveWeeklyUpdate(): void {
  if (this.weeklyForm.invalid) {
    this.weeklyForm.markAllAsTouched();
    return;
  }

  const weeklyData = this.weeklyForm.value;

  this.fieldwork.weeklyUpdates.push({
    id: 'wk' + Date.now(),
    ...weeklyData
  });

  this.cancelWeekly();
  Swal.fire('Success', 'Weekly update saved!', 'success');
}

editWeekly(index: number): void {
  this.weeklyForm.patchValue(this.fieldwork.weeklyUpdates[index]);
  this.fieldwork.weeklyUpdates.splice(index, 1); // Remove old entry
  this.showWeeklyForm = true;
}

cancelWeekly(): void {
  this.showWeeklyForm = false;
  this.weeklyForm.reset();
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
      this.fieldwork.weeklyUpdates.splice(index, 1);
      Swal.fire('Deleted', 'Weekly update deleted', 'success');
    }
  });
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
  Swal.fire('Success', 'Finding saved!', 'success');
}

editFinding(index: number): void {
  this.editingFinding = index;
  this.findingForm.patchValue(this.fieldwork.preClosing[index]);
  this.showFindingForm = true;
}

cancelFinding(): void {
  this.editingFinding = null;
  this.showFindingForm = false;
  this.findingForm.reset({
    severity: 'Medium',
    status: 'Draft'
  });
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
      Swal.fire('Deleted', 'Finding deleted', 'success');
    }
  });
}

// Save all fieldwork data
saveAllFieldwork(): void {
  if (!this.selectedWorkflow) return;

  // Here you would typically save to your backend
  console.log('Saving fieldwork data:', this.fieldwork);
  
  Swal.fire('Success', 'All fieldwork data saved successfully!', 'success');
  this.closeFieldworkModal();
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
  this.cancelFieldworkTask(); // Reset form
}

addEvidenceRequest() {
  this.showEvidenceForm = true;
  this.cancelEvidence(); // Reset form
}

addMeeting() {
  this.showMeetingForm = true;
  this.cancelMeeting(); // Reset form
}

addWeeklyUpdate() {
  this.showWeeklyForm = true;
  this.cancelWeekly(); // Reset form
}

addPreClosingFinding() {
  this.showFindingForm = true;
  this.cancelFinding(); // Reset form
}

openFieldworkModal() {
  this.isFieldworkModalVisible = true;
}

closeFieldworkModal() {
  this.isFieldworkModalVisible = false;
}

users: any[] = [];
today: string = new Date().toISOString().split('T')[0];

loadUsers(): void {
  this.http.get<any[]>('http://localhost:3000/users').subscribe({
    next: (res) => this.users = res,
    error: (err) => console.error('Failed to load users', err)
  });
}


// Fieldwork Tasks Methods - Now working with selectedWorkflow.tasks
saveFieldworkTask(): void {
  if (this.fieldworkTaskForm.invalid || !this.selectedWorkflow) {
    this.fieldworkTaskForm.markAllAsTouched();
    return;
  }

  const taskData = this.fieldworkTaskForm.value;

  // Ensure tasks array exists
  if (!this.selectedWorkflow.tasks) {
    this.selectedWorkflow.tasks = [];
  }

  if (this.editingFieldworkTask !== null) {
    // Edit existing task
    this.selectedWorkflow.tasks[this.editingFieldworkTask] = {
      ...this.selectedWorkflow.tasks[this.editingFieldworkTask],
      ...taskData
    };
  } else {
    // Add new task
    this.selectedWorkflow.tasks.push({
      id: 'fw' + Date.now(),
      ...taskData
    });
  }

  // Update the workflow in the backend
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

// Helper method to update workflow tasks in backend
private updateWorkflowTasks(): void {
  if (!this.selectedWorkflow?.id) return;

  this.globalService.update(this.selectedWorkflow.id, this.selectedWorkflow).subscribe({
    next: (updatedWorkflow) => {
      this.selectedWorkflow = updatedWorkflow;
      this.loadWorkflows(); // Refresh the list
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

// Cancel editing
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
    id: 't' + Date.now(), // simple unique id
    ...this.taskForm.value
  };

  // Push into workflow tasks
  this.selectedWorkflow.tasks = this.selectedWorkflow.tasks || [];
  this.selectedWorkflow.tasks.push(newTask);

  const updated = { ...this.selectedWorkflow }; 
  this.syncWorkflowAndAudit(updated);

  Swal.fire('Task Added', 'New task added successfully!', 'success');
  this.taskForm.reset({ status: 'Pending' });
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
    },
    error: err => console.error('Failed to delete mini finding', err)
  });
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

  addMiniFinding(): void {
    if (!this.selectedWorkflow) return;
    if (this.miniFindingForm.invalid) {
      this.miniFindingForm.markAllAsTouched();
      return;
    }
    const finding: MiniFinding = {
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
        this.loadWorkflows();
        this.closeFindingModal();
      },
      error: err => console.error('Failed to add mini finding', err)
    });
  }

openTaskModal() { this.isTaskModalVisible = true; }
closeTaskModal() { this.isTaskModalVisible = false; }

loadWorkflows(): void {
    this.isLoading = true;
    this.globalService.list().subscribe({
      next: (res) => {
        // Ensure tasks array present
        this.allWorkflows = res.map(w => ({ ...w, tasks: w.tasks || [] }));
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

    this.visibleWorkflows = list.slice(0, this.recordsToShow);
  }

getFindingsForTask(taskId: number) {
  return this.selectedWorkflow?.miniFindings?.filter(f => f.taskId === taskId) || [];
}

loadMore(): void {
    this.recordsToShow += 5;
    this.applyFiltersAndPagination();
  }

resetFilters(): void {
    this.searchTerm = '';
    this.departmentFilter = '';
    this.statusFilter = '';
    this.applyFiltersAndPagination();
  }

getAuditPlanningTasks() {
  if (!this.selectedWorkflow) return [];

  const audit = this.allAudits.find(a => a.id === this.selectedWorkflow?.auditId);
  console.log('Selected Audit for planning tasks:', audit);

  // Check if planningTasks exists and has data
  if (!audit?.planningTasks || !Array.isArray(audit.planningTasks) || audit.planningTasks.length === 0) {
    console.log('No planning tasks found');
    return [];
  }

  const tasks = audit.planningTasks.map((t: any, index: number) => ({
    id: t.id || `p${index}`,
    description: t.name || t.description || '', // Use 'name' from your data structure
    assignee: t.owner || t.assignee || '',
    status: t.status || 'Pending',
    dueDate: t.endDate || t.startDate || '—'
  }));

  console.log('Mapped Planning Tasks:', tasks);
  return tasks;
}

debugAuditData() {
  if (!this.selectedWorkflow) return;
  const audit = this.allAudits.find(a => a.id === this.selectedWorkflow?.auditId);
  console.log('Full audit object:', audit);
  console.log('Planning tasks raw:', audit?.planningTasks);
}

showWorkflowDetails(w: Workflow): void {
  if (this.selectedWorkflow && this.selectedWorkflow.id === w.id) {
    console.log('content', this.selectedWorkflow);
    this.hideDetails();
    return;
  }
  
  this.selectedWorkflow = { ...w };
  this.isDetailsPanelVisible = true;
  console.log('Clicked workflow:', w);
  this.cachePlanningTasks();
  
  if (w.id) {
    this.globalService.get(w.id).subscribe({
      next: wf => {
        this.selectedWorkflow = wf;
        this.cachePlanningTasks(); // Re-cache after loading
      },
      error: err => console.warn('Could not fetch workflow details', err)
    });
  }
}

cachePlanningTasks(): void {
  if (!this.selectedWorkflow) {
    this.cachedPlanningTasks = [];
    return;
  }

  const audit = this.allAudits.find(a => a.id === this.selectedWorkflow?.auditId);
  // console.log('Selected Audit for planning tasks:', audit);

  // Check if planningTasks exists and has data
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

  // console.log('Cached Planning Tasks:', this.cachedPlanningTasks);
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
  if (this.workflowForm.invalid) {
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

        this.http.put(`http://localhost:3000/audits/${payload.auditId}`, auditPayload).subscribe({
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

        this.http.post(`http://localhost:3000/audits`, auditPayloads).subscribe({
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
          // 🔹 Also delete linked audit if auditId is provided
          if (auditId) {
            this.http.delete(`http://localhost:3000/audits/${auditId}`).subscribe({
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
    // We'll use the modal in details panel DOM to add
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
  // Compute workflow status from tasks
  updated.status = this.computeWorkflowStatus(updated.tasks);

  // Save workflow
  this.globalService.update(updated.id!, updated).subscribe({
    next: wf => {
      this.selectedWorkflow = wf;
      this.loadWorkflows();

      // 🔹 Sync linked audit
      const auditPayload = {
        id: updated.auditId,
        title: updated.title,
        scope: updated.scope,
        department: updated.department,
        status: updated.status === 'Not Started' ? 'Planned' : updated.status,
        startDate: updated.startDate,
        endDate: updated.dueDate
      };

      this.http.put(`http://localhost:3000/audits/${updated.auditId}`, auditPayload).subscribe({
        next: () => this.globalService.notifyAuditsChanged(),
        error: err => console.error('Audit sync failed:', err)
      });
    },
    error: err => console.error('Failed to sync workflow', err)
  });
}

  // --- helpers -----------------------------------------------
  taskProgressPercent(w?: Workflow): number {
    const wf = w || this.selectedWorkflow;
    if (!wf || !wf.tasks || wf.tasks.length === 0) return 0;
    const total = wf.tasks.length;
    const done = wf.tasks.filter(t => t.status === 'Done').length;
    return Math.round((done / total) * 100);
  }

}