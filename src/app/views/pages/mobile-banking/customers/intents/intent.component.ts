import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, SecurityContext, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from '@angular/router'; 
import { catchError, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as saveAs from 'file-saver';
import jsPDF from 'jspdf';
import { HttpClient } from '@angular/common/http';


interface Audit {
  id: number;
  title: string;
  scope: string;
  department: string;
  status: string;
  startDate: string;
  endDate: string;
  planningTasks?: PlanningTask[];
}

interface PlanningTask {
  id?: number;
  name: string;
  description?: string;
  assignedTo?: string;
  startDate: string;
  endDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
}


@Component({
    selector: 'app-intent',
    templateUrl: './intent.component.html',
    styleUrls: ['./intent.component.scss']
})
export class IntentComponent implements OnInit {
  editingMember: any;
hoverTask: any;

removeTeamMember(_t195: any) {
throw new Error('Method not implemented.');
}

  @Output() auditsChanged = new EventEmitter<void>();
    todayString: string;
    // State
    isDetailsPanelVisible = false;
    selectedAudit: any = null;
  
    allAudits: any[] = [];
    filteredAudits: any[] = [];
    visibleAudits: any[] = [];
    isTaskModalVisible: boolean = false;
    taskForm: FormGroup;
    editingTaskIndex: number | null = null; // null if adding new

    recordsToShow = 20;
    isLoading = false;
  // Task Modal State
    isAddTaskFormVisible: boolean = false;

    // Filters
    searchTerm = '';
    departmentFilter = '';
    statusFilter = '';
  formErrors: string[] = [];
  currentYear = new Date().getFullYear();
  
    // Form & Modal
    addAuditForm: FormGroup;
    isAddAuditModalVisible = false;
    externalFiles: File[] = [];
    internalFiles: File[] = [];
    editingMemberIndex: number | null = null;
    criteriaFiles: File[] = [];
    rcmFile: File | null = null;
    interviewSchedule: any[] = [];
    logisticsChecklist: any[] = [];
   riskInterviewSummary: [''];
   scopingNotes: ['']
    private apiUrl = 'http://localhost:3000/audits';
    sortColumn = 'startDate'; 
  sortDirection: 'asc' | 'desc' = 'desc'; 
     currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  yearFilter = '';
  uniqueDepartments: string[] = [];
  uniqueYears: number[] = [];

    constructor(
      private fb: FormBuilder,
      private http: HttpClient,
      private toastr: ToastrService,
        private router: Router,
        private globalService: GlobalService
    ) {
  
    this.taskForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    owner: ['', Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    status: ['Not Started']
  });

  
    }
  
ngOnInit(): void {
    const today = new Date();
    this.todayString = today.toISOString().split('T')[0];
    this.loadAudits();
  
    this.taskForm.get('startDate')?.valueChanges.subscribe(start => {
      if (this.taskForm.get('endDate')?.value < start) {
        this.taskForm.patchValue({ endDate: start }); 
      }
    });
    }

    
loadAudits(): void {
  this.isLoading = true;
  this.http.get<any[]>(this.apiUrl).subscribe({
    next: (audits) => {

      this.allAudits = audits.map(audit => ({
        ...audit,
        sortDate: audit.createdAt || audit.startDate
      }));
      this.extractUniqueValues();
      this.applyFiltersAndPagination();
      this.isLoading = false;
    },
    error: () => {
      this.toastr.error('Could not load audits from backend.', 'API Error');
      this.isLoading = false;
    }
  });
}

// Helper method to get current date-time in the correct format for datetime-local input
getCurrentDateTime(): string {
  const now = new Date();
  
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

isMeetingDateInvalid(): boolean {
  if (!this.selectedAudit?.planningMeetingDate) {
    return false;
  }
  
  const meetingDate = new Date(this.selectedAudit.planningMeetingDate);
  const now = new Date();
  
  return meetingDate < now;
}

validateMeetingDate(): void {
  if (this.isMeetingDateInvalid()) {
    this.toastr.warning('Meeting date cannot be in the past. Please select a future date.', 'Invalid Date');
    
    // Optionally clear the invalid date
    // this.selectedAudit.planningMeetingDate = '';
  }
}

private sortAudits(audits: any[]): any[] {
  return audits.sort((a, b) => {
    let aValue = a[this.sortColumn];
    let bValue = b[this.sortColumn];

    if (this.sortColumn.includes('Date') || this.sortColumn === 'startDate' || this.sortColumn === 'createdAt') {
 
      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
      
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Handle string sorting
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    if (aValue < bValue) {
      return this.sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return this.sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

resetToDefaultSort(): void {
  this.sortColumn = 'startDate'; // or 'createdAt'
  this.sortDirection = 'desc';
  this.applyFiltersAndPagination();
}


private extractUniqueValues(): void {
  this.uniqueDepartments = [...new Set(this.allAudits.map(audit => audit.department).filter(Boolean))].sort();
  
  // Extract unique years from start dates
  const years = this.allAudits.map(audit => {
    if (audit.startDate) {
      return new Date(audit.startDate).getFullYear();
    }
    return null;
  }).filter(year => year !== null) as number[];
  
  this.uniqueYears = [...new Set(years)].sort((a, b) => b - a); // Descending order
}

applyFiltersAndPagination(): void {
  let audits = [...this.allAudits];

  const search = this.searchTerm.trim().toLowerCase();
  if (search) {
    audits = audits.filter(a =>
      a.title?.toLowerCase().includes(search) ||
      a.department?.toLowerCase().includes(search) ||
      a.status?.toLowerCase().includes(search)
    );
  }

  // Apply department filter
  if (this.departmentFilter) {
    audits = audits.filter(a => a.department === this.departmentFilter);
  }

  // Apply status filter
  if (this.statusFilter) {
    audits = audits.filter(a => a.status === this.statusFilter);
  }

  // Apply year filter
  if (this.yearFilter) {
    audits = audits.filter(a => {
      if (a.startDate) {
        const year = new Date(a.startDate).getFullYear().toString();
        return year === this.yearFilter;
      }
      return false;
    });
  }

  // Apply sorting
  audits = this.sortAudits(audits);

  this.filteredAudits = audits;
  this.totalPages = Math.ceil(this.filteredAudits.length / this.pageSize);
  this.updateVisibleAudits();
}

// New sorting method
sortBy(column: string): void {
  if (this.sortColumn === column) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortColumn = column;
    this.sortDirection = 'asc';
  }
  this.applyFiltersAndPagination();
}

updateVisibleAudits(): void {
  const startIndex = (this.currentPage - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  this.visibleAudits = this.filteredAudits.slice(startIndex, endIndex);
}

goToPage(page: number): void {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page;
    this.updateVisibleAudits();
  }
}

onPageSizeChange(): void {
  this.currentPage = 1;
  this.applyFiltersAndPagination();
}

getPaginationPages(): number[] {
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

getEndIndex(): number {
  return Math.min(this.currentPage * this.pageSize, this.filteredAudits.length);
}

hasActiveFilters(): boolean {
  return !!(this.searchTerm || this.departmentFilter || this.statusFilter || this.yearFilter);
}

resetFilters(): void {
  this.searchTerm = '';
  this.departmentFilter = '';
  this.statusFilter = '';
  this.yearFilter = '';
  this.currentPage = 1;
  this.applyFiltersAndPagination();
}



updateTeam(index: number) {
  this.editingMemberIndex = index; 
  const member = this.selectedAudit.team[index];
  this.teamMember = member.name;
  this.teamRole = member.role;
}


deleteMember(index: number) {
  const member = this.selectedAudit.team[index];
  Swal.fire({
    title: 'Are you sure?',
    text: `Delete ${member.name} from the team?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.selectedAudit.team.splice(index, 1);
      // Hit backend if needed
      this.savePlanning();
      Swal.fire('Deleted!', `${member.name} has been removed.`, 'success');
    }
  });
}

addTeamMember() {
  if (!this.teamMember || !this.teamRole) return;

  const newMember = {
    name: this.teamMember,
    role: this.teamRole
  };

  if (this.editingMemberIndex !== null) {
    // update existing member
    this.selectedAudit.team[this.editingMemberIndex] = newMember;
    this.editingMemberIndex = null; // reset
  } else {
    // add new member
    if (!this.selectedAudit.team) this.selectedAudit.team = [];
    this.selectedAudit.team.push(newMember);
  }

  this.teamMember = '';
  this.teamRole = '';

  // this.savePlanning();
}

openInterviewModal() {
    const modal = document.getElementById('interviewModal');
    modal?.classList.add('show');
    modal?.setAttribute('style', 'display:block; background: rgba(0,0,0,0.5)');
  }
  
  closeInterviewModal() {
    const modal = document.getElementById('interviewModal');
    modal?.classList.remove('show');
    modal?.setAttribute('style', 'display:none');
  }
  get f() { return this.addAuditForm.controls; }
  validateAuditYear(control: any) {
    const value = Number(control.value);
    const currentYear = new Date().getFullYear();
  
    if (!value || value < currentYear || value > 2030) {
      return { invalidYear: true };
    }
  
    return null;
  }
  
  openAddTaskModal(index?: number) {
  if (!this.selectedAudit) return;

  if (index !== undefined) {
    // Edit existing task
    const task = this.selectedAudit.planningTasks[index];
    this.taskForm.patchValue(task);
    this.editingTaskIndex = index;
  } else {
    // Add new task
    this.taskForm.reset({ status: 'Not Started' });
    this.editingTaskIndex = null;
  }

  this.isTaskModalVisible = true;
}

closeTaskModal() {
  this.isTaskModalVisible = false;
  this.taskForm.reset({ status: 'Not Started' });
}

editTask(index: number) {
  this.editingTaskIndex = index;
  const task = this.selectedAudit.planningTasks[index];

  // Populate form
  this.taskForm.patchValue({
    name: task.name,
    description: task.description,
    owner: task.owner,
    startDate: task.startDate,
    endDate: task.endDate,
    status: task.status
  });

  // Show task modal
  this.isTaskModalVisible = true;
}

deleteTask(index: number) {
  Swal.fire({
    title: 'Are you sure?',
    text: "This task will be permanently deleted!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      // Remove task from array
      this.selectedAudit.planningTasks.splice(index, 1);
      this.savePlanning();
      Swal.fire(
        'Deleted!',
        'The task has been deleted.',
        'success'
      );
    }
  });
}


saveTask() {
  if (this.taskForm.invalid) return;

  const taskData = this.taskForm.value;

  if (this.editingTaskIndex !== null) {
    // Update existing task
    this.selectedAudit.planningTasks[this.editingTaskIndex] = taskData;
    this.editingTaskIndex = null;
  } else {
    if (!this.selectedAudit.planningTasks) this.selectedAudit.planningTasks = [];
    this.selectedAudit.planningTasks.push(taskData);
  }

  // this.savePlanning();
  this.taskForm.reset();
  this.isTaskModalVisible = false;
}


onDocumentsSelected(event: any, tab: string) {
  const files: FileList = event.target.files;
  if (!this.selectedAudit.documents) this.selectedAudit.documents = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedAudit.documents.push({
        name: file.name,
        size: file.size,
        type: file.type,
        tab: tab, // categorize based on active tab
        content: e.target.result // base64 string
      });
    };
    reader.readAsDataURL(file);
  }
}


handleFileUpload(event: any, type: string) {
  if (!this.selectedAudit.documents) this.selectedAudit.documents = [];

  const files: FileList = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.selectedAudit.documents.push({
        name: file.name,
        type: file.type,
        content: e.target.result, // base64 content
        tab: type // track which tab this came from
      });
    };
    reader.readAsDataURL(file);
  }

  event.target.value = '';
}

getDocsByTab(tab: string) {
  if (!this.selectedAudit || !this.selectedAudit.documents) return [];
  return this.selectedAudit.documents.filter((d: { tab: string; }) => d.tab === tab);
}

savePlanning() {
  if (!this.selectedAudit) return;

  if (this.selectedAudit.planningMeetingDate && this.isMeetingDateInvalid()) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Meeting Date',
      text: 'Meeting date cannot be in the past. Please select a future date and time.',
      confirmButtonText: 'OK'
    });
    return;
  }

    const planningData = {
    ...this.selectedAudit,
      scheduleConfirmed: this.selectedAudit.scheduleConfirmed,
      team: this.selectedAudit.team || [],
      riskSummary: this.selectedAudit.riskSummary,
      documents: this.selectedAudit.documents || [],
      planningMeetingDate: this.selectedAudit.planningMeetingDate,
      planningAgenda: this.selectedAudit.planningAgenda,
      planningTasks: this.selectedAudit.planningTasks || []
    };
  
  this.http.put(`http://localhost:3000/audits/${this.selectedAudit.id}`, planningData)
    .subscribe({
      next: (res) => {
        console.log('Planning saved successfully', res);
        Swal.fire({
          icon: 'success',
          title: 'Saved!',
          text: 'Planning saved successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        this.closePlanningModal();
        this.loadAudits(); // Refresh table
      },
      error: (err) => {
        console.error('Error saving planning', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save planning',
        });
      }
    });
}

updateAuditDocuments() {
  this.http.put(`${this.apiUrl}/${this.selectedAudit.id}`, this.selectedAudit)
    .subscribe({
      next: () => console.log('Documents updated'),
      error: (err) => console.log(err)
    });
}

removeDocument(doc: any) {
  Swal.fire({
    title: 'Are you sure?',
    text: `Delete "${doc.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel'
  }).then(result => {
    if (result.isConfirmed) {

      const index = this.selectedAudit.documents.indexOf(doc);
      if (index > -1) this.selectedAudit.documents.splice(index, 1);

      this.updateAuditDocuments(); // save to backend

      Swal.fire('Deleted!', 'Document removed successfully.', 'success');
    }
  });
}


getFormErrors(): string[] {
    const errors: string[] = [];
  
    Object.keys(this.addAuditForm.controls).forEach(key => {
      const control = this.addAuditForm.get(key);
  
      if (control && control.errors) {
        if (control.errors['required']) {
          errors.push(`${key} is required`);
        }
        if (control.errors['invalidYear']) {
          errors.push(`${key} must be between ${this.currentYear} and 2030`);
        }
        // Add more if you need
      }
    });
  
    return errors;
  }
  
  
  addInterview() {
    this.interviewSchedule.push({ name: '', department: '', date: '', notes: '' });
  }
  
  removeInterview(index: number) {
    this.interviewSchedule.splice(index, 1);
  }
  
  saveInterviewSchedule() {
    console.log('Saved Interview Schedule:', this.interviewSchedule);
    this.closeInterviewModal();
  }
  newLogisticsItem: string = '';
  
  addLogisticsItem() {
    if (this.newLogisticsItem?.trim()) {
      this.logisticsChecklist.push({ name: this.newLogisticsItem.trim(), completed: false });
      this.newLogisticsItem = ''; // reset input
    }
  }

  
    loadMoreAudits(): void {
      this.recordsToShow += 20;
      this.visibleAudits = this.filteredAudits.slice(0, this.recordsToShow);
    }
  
    showAuditDetails(audit: any): void {
      if (this.selectedAudit && this.selectedAudit.id === audit.id) {
        this.hideAuditDetails();
        return;
      }
  
      this.selectedAudit = { ...audit };
      this.isDetailsPanelVisible = true;
    }
  
    hideAuditDetails(): void {
      this.isDetailsPanelVisible = false;
      this.selectedAudit = null;
    }
   
    closeAddAuditModal(): void {
      this.isAddAuditModalVisible = false;
    }
  
    openEditAuditModal(audit: any): void {
      this.addAuditForm.patchValue(audit);
      this.isAddAuditModalVisible = true;
      this.selectedAudit = audit;
  
      this.addAuditForm.get('status')?.disable();
    }
  
    onCriteriaFilesSelected(event: any) {
      this.criteriaFiles = Array.from(event.target.files);
    }
  
    onExternalFilesSelected(event: any) {
      this.externalFiles = Array.from(event.target.files);
    }

isPlanningModalVisible: boolean = false;
tab: string = 'schedule';

teamMember: string = '';
teamRole: string = '';

openPlanningModal() {
  this.isPlanningModalVisible = true;
}

closePlanningModal() {
  this.isPlanningModalVisible = false;
}

openPlanningPanel(audit: any): void {
  this.selectedAudit = audit;
  this.isPlanningModalVisible = true;
}

onInternalFilesSelected(event: any) {
      this.internalFiles = Array.from(event.target.files);
    }
  
    onRcmFileSelected(event: any) {
      this.rcmFile = event.target.files[0] || null;
    }
  
    saveAudit(): void {
  
      if (this.addAuditForm.invalid) {
      this.addAuditForm.markAllAsTouched();
      this.formErrors = this.getFormErrors();
  
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Form',
        html: `
          <div style="text-align:left">
            <p><strong>Please correct the following errors:</strong></p>
            <ul>
              ${this.formErrors.map(err => `<li>${err}</li>`).join('')}
            </ul>
          </div>
        `,
        confirmButtonText: 'OK',
      });
  
      return;
    }
      const formData = {
        ...this.addAuditForm.getRawValue(),
        interviewSchedule: this.interviewSchedule,
        logisticsChecklist: this.logisticsChecklist,
        externalFiles: this.externalFiles,
        internalFiles: this.internalFiles,
        criteriaFiles: this.criteriaFiles,
        rcmFile: this.rcmFile
      };
  
      if (this.selectedAudit) {
        
        const auditId = this.selectedAudit.id;
        this.http.put(`${this.apiUrl}/${auditId}`, { ...formData, id: auditId })
          .subscribe({
            next: () => {
              Swal.fire('Updated', 'Audit updated successfully!', 'success');
              this.loadAudits();
              this.closeAddAuditModal();
              this.hideAuditDetails();
              this.globalService.notifyAuditsChanged();
  
              this.http.get<any[]>(`http://localhost:3000/workflows?auditId=${auditId}`).subscribe({
                next: (workflows) => {
                  if (workflows.length > 0) {
                    const wf = workflows[0];
                    const updatedWf = {
                      ...wf,
                      title: formData.title.includes("Workflow")
                        ? formData.title
                        : `${formData.title} Workflow`,
                      scope: formData.scope,
                      department: formData.department,
                      status: formData.status === 'Planned' ? 'Not Started' : formData.status,
                      startDate: formData.startDate,
                      dueDate: formData.endDate,
                      auditLead: formData.auditLead,
                      auditMembers: formData.auditMembers,
                      thirdPartyFirm: formData.thirdPartyFirm,
                      thirdPartyContact: formData.thirdPartyContact,
                      riskRating: formData.riskRating,
                      riskRationale: formData.riskRationale,
                      riskSummary: formData.riskSummary,
                      kickoffDate: formData.kickoffDate,
                      planningMemo: formData.planningMemo
                    };
                    this.http.put(`http://localhost:3000/workflows/${wf.id}`, updatedWf).subscribe({
                      next: () => this.globalService.notifyWorkflowsChanged(),
                      error: (err) => console.error('Workflow sync failed:', err)
                    });
                  }
                },
                error: (err) => console.error('Failed to fetch workflow for sync:', err)
              });
            },
            error: () => this.toastr.error('Failed to update audit')
          });
  
      } else {
        
        this.http.post<any>(this.apiUrl, formData).subscribe({
          next: (createdAudit) => {
            Swal.fire('Created', 'Audit added successfully!', 'success');
            this.loadAudits();
            this.closeAddAuditModal();
            this.hideAuditDetails();
            this.globalService.notifyAuditsChanged();
  
            const newInboxItem = {
              role: "Auditor",
              type: "assignment",
              title: "New Audit Assigned",
              from: "System (via CIA)",
              summary: `You have been assigned to the new audit: "${createdAudit.title}".`,
              isRead: false,
              timestamp: new Date().toISOString(),
              details: {
                subject: `New Assignment: ${createdAudit.title}`,
                auditId: createdAudit.id, 
                auditUnit: createdAudit.department,
                startDate: createdAudit.startDate,
                dueDate: createdAudit.endDate,
                status: createdAudit.status
              }
            };
  
            this.http.post('http://localhost:3000/inboxItems', newInboxItem).subscribe({
              next: () => console.log('%cSUCCESS: New assignment notification created in inbox.', 'color: green; font-weight: bold;'),
              error: (err) => console.error('Failed to create inbox notification:', err)
            });
  
            const workflowPayload = {
              id: createdAudit.id,
              auditId: createdAudit.id,
              title: `${createdAudit.title} Workflow`,
              scope: createdAudit.scope,
              department: createdAudit.department,
              assignedTo: '',
              status: createdAudit.status === 'Planned' ? 'Not Started' : createdAudit.status,
              startDate: createdAudit.startDate,
              dueDate: createdAudit.endDate,
              tasks: [],
              miniFindings: []
            };
  
            this.http.post(`http://localhost:3000/workflows`, workflowPayload).subscribe({
              next: () => this.globalService.notifyWorkflowsChanged(),
              error: (err) => console.error('Workflow create failed:', err)
            });
          },
          error: () => this.toastr.error('Failed to create audit')
        });
      }
    }
    
    deleteAudit(id: number): void {
      Swal.fire({
        title: 'Are you sure?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      }).then(result => {
        if (result.isConfirmed) {
          this.http.delete(`${this.apiUrl}/${id}`).subscribe({
            next: () => {
              Swal.fire('Deleted!', 'Audit has been deleted.', 'success');
              this.loadAudits();
              this.hideAuditDetails();
  
              this.http.delete(`http://localhost:3000/workflows/${id}`).subscribe();
              this.globalService.notifyAuditsChanged();
            },
            error: () => {
              Swal.fire('Error', 'Could not delete audit.', 'error');
            }
          });
        }
      });
    }
  
    openObservations(audit: any): void {
      this.router.navigate(['/eclectics/audit_management/audits/observation', audit.id]);
    }
  
    exportAsExcel(): void {
      // const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.allAudits);
      // const workbook: XLSX.WorkBook = { Sheets: { 'Audits': worksheet }, SheetNames: ['Audits'] };
      // const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      // const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      // saveAs(data, 'audits.xlsx');
    }
  
    exportAsCSV(): void {
      const header = ['Title', 'Department', 'Status', 'Start Date', 'End Date'];
      const rows = this.allAudits.map(a =>
        [a.title, a.department, a.status, a.startDate, a.endDate]
      );
  
      const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'audits.csv');
    }
  
    exportAsPDF(): void {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
  
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Audit Report", pageWidth / 2, 15, { align: "center" });
  
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const generatedOn = new Date().toLocaleString();
      doc.text(`Generated on: ${generatedOn}`, pageWidth / 2, 22, { align: "center" });
  
      (doc as any).autoTable({
        startY: 30,
        head: [['Title', 'Department', 'Status', 'Start Date', 'End Date']],
        body: this.allAudits.map(a => [
          a.title,
          a.department,
          a.status,
          a.startDate,
          a.endDate
        ]),
        didDrawPage: (data: any) => {
          const pageCount = doc.getNumberOfPages();
          const currentPage = data.pageNumber;
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: "center" }
          );
        }
      });
  
      doc.save('audits.pdf');
    }
  
    exportAsXML(): void {
      let xmlData = '<?xml version="1.0" encoding="UTF-8"?>\n<audits>\n';
      this.allAudits.forEach(audit => {
        xmlData += `  <audit>
      <title>${audit.title}</title>
      <department>${audit.department}</department>
      <status>${audit.status}</status>
      <startDate>${audit.startDate}</startDate>
      <endDate>${audit.endDate}</endDate>
    </audit>\n`;
      });
      xmlData += '</audits>';
      const blob = new Blob([xmlData], { type: 'application/xml' });
      saveAs(blob, 'audits.xml');
    }
}