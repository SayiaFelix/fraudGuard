import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { Router } from '@angular/router';
import { GlobalService } from 'src/app/shared/services/global.service';
import * as saveAs from 'file-saver';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {environment} from 'src/environments/environment';

export enum AuditStage {
  SCOPING = 'scoping',
  PLANNING = 'planning',
  FIELDWORK = 'fieldwork',
  REPORTING = 'reporting',
  MONITORING = 'monitoring'
}

@Component({
  selector: 'app-add-customer',
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.scss']
})
export class AddCustomerComponent implements OnInit {
 @Output() auditsChanged = new EventEmitter<void>();
  todayString: string;
  // State
  isDetailsPanelVisible = false;
  selectedAudit: any = null;
  currentAuditStage: AuditStage = AuditStage.SCOPING;
  allAudits: any[] = [];
  filteredAudits: any[] = [];
  visibleAudits: any[] = [];

  recordsToShow = 20;
  isLoading = false;

sortColumn = 'startDate'; 
sortDirection: 'asc' | 'desc' = 'desc'; 


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
 // NEW: Users array for dropdown
  users: any[] = [];
  filteredUsers: any[] = [];
   workflows: any[] = [];

  private apiUrl = `${environment.apiBase}/audits`;
  private usersUrl = `${environment.apiBase}/users`;
  private workflowsUrl = `${environment.apiBase}/workflows`;

  isUsersLoaded = false; 

  criteriaFiles: File[] = [];
  rcmFile: File | null = null;
  interviewSchedule: any[] = [];
  logisticsChecklist: any[] = [];
  riskInterviewSummary: [''];
  scopingNotes: ['']
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

      this.addAuditForm = this.fb.group({
    
        title: ['', Validators.required],
        scope: ['', Validators.required],
        department: ['', Validators.required],
        status: ['Planned', Validators.required],
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
        auditYear: ['',[Validators.required,this.validateAuditYear.bind(this)]],

        auditPeriod: [''],
        auditLead: ['', Validators.required],
        auditMembers: [''],
        thirdPartyFirm: [''],
        thirdPartyContact: [''],
        clientConfirmation: ['Pending'],
        confirmationDate: [''],
        unitOrientation: [''],
        backgroundSummary: [''],
        riskRating: ['Medium'],
        riskRationale: [''],

        riskSummary: [''],

        kickoffDate: [''],
        planningMemo: [''],
        riskInterviewSummary: [''],
});}

ngOnInit(): void {
  const today = new Date();
  this.todayString = today.toISOString().split('T')[0];
  this.loadAudits();
  this.loadUsers();
  this.loadWorkflows()
  
  this.addAuditForm.get('startDate')?.valueChanges.subscribe(start => {
    if (this.addAuditForm.get('endDate')?.value < start) {
      this.addAuditForm.patchValue({ endDate: start });
    }
  });
}

loadUsers(): void {
  this.http.get<any[]>(this.usersUrl).subscribe({
    next: (users) => {
      this.users = users;
      this.filteredUsers = users;
      this.isUsersLoaded = true;
      console.log('Users loaded:', this.users);
    },
    error: (error) => {
      console.error('Error loading users:', error);
      Swal.fire('Error', 'Failed to load users', 'error');
      this.isUsersLoaded = false;
    }
  });
}

updateAuditStage(auditId: number, stage: AuditStage): void {
  const audit = this.allAudits.find(a => a.id === auditId);
  if (audit) {
    audit.stage = stage;
    this.http.patch(`${this.apiUrl}/${auditId}`, { stage }).subscribe({
      next: () => {
        console.log(`Audit ${auditId} stage updated to: ${stage}`);
      },
      error: (err) => {
        console.error('Failed to update audit stage:', err);
      }
    });
  }
}

private updateWorkflowStage(auditId: number, stage: AuditStage): void {
  this.http.get<any[]>(`${this.workflowsUrl}?auditId=${auditId}`).subscribe({
    next: (workflows) => {
      if (workflows.length > 0) {
        const wf = workflows[0];
        this.http.patch(`${this.workflowsUrl}/${wf.id}`, { 
          stage,
          updatedAt: new Date().toISOString()
        }).subscribe({
          next: () => {
            console.log('Workflow stage updated successfully');
            this.globalService.notifyWorkflowsChanged();
          },
          error: (err) => {
            console.error('Failed to update workflow stage:', err);
          }
        });
      }
    },
    error: (err) => {
      console.error('Failed to fetch workflow for stage update:', err);
    }
  });
}

getCompletedLogisticsCount(audit: any): number {
  if (!audit?.logisticsChecklist) return 0;
  return audit.logisticsChecklist.filter((item: any) => item.completed).length;
}

getLogisticsProgress(audit: any): number {
  if (!audit?.logisticsChecklist || audit.logisticsChecklist.length === 0) return 0;
  const completed = this.getCompletedLogisticsCount(audit);
  return Math.round((completed / audit.logisticsChecklist.length) * 100);
}

private updateAuditChecklist(audit: any, updatedChecklist: any[], message?: string): void {
  const updatedAudit = {
    ...audit,
    logisticsChecklist: updatedChecklist
  };

  this.http.put(`${this.apiUrl}/${audit.id}`, updatedAudit).subscribe({
    next: () => {
      const auditIndex = this.allAudits.findIndex(a => a.id === audit.id);
      if (auditIndex > -1) {
        this.allAudits[auditIndex] = updatedAudit;
      }
      
      if (this.selectedAudit?.id === audit.id) {
        this.selectedAudit = updatedAudit;
      }
      
      Swal.fire('Success', message || 'Checklist updated successfully', 'success');
      this.applyFiltersAndPagination();
    },
    error: (error) => {
      Swal.fire('Error', 'Failed to update checklist', 'error');
      console.error('Error updating checklist:', error);
    }
  });
}

loadAudits(): void {
  this.isLoading = true;
  this.http.get<any[]>(this.apiUrl).subscribe({
    next: (audits) => {
      this.allAudits = audits.map(audit => ({
        ...audit,
        sortDate: audit.createdAt || audit.startDate,
        stage: audit.stage || this.determineAuditStage(audit) 
      }));
      this.extractUniqueValues();
      this.applyFiltersAndPagination();
      this.isLoading = false;
    },
    error: () => {
      Swal.fire('Error', 'Could not load audits from backend.', 'error');
      this.isLoading = false;
    }
  });
}

private updateSingleLogisticsItem(audit: any, updatedItem: any, previousStatus: boolean): void {
  const updatedChecklist = audit.logisticsChecklist.map((item: any) => 
    item.name === updatedItem.name ? updatedItem : item
  );

  const updatedAudit = {
    ...audit,
    logisticsChecklist: updatedChecklist
  };

  this.http.put(`${this.apiUrl}/${audit.id}`, updatedAudit).subscribe({
    next: () => {
      const auditIndex = this.allAudits.findIndex(a => a.id === audit.id);
      if (auditIndex > -1) {
        this.allAudits[auditIndex] = updatedAudit;
      }
      
      if (this.selectedAudit?.id === audit.id) {
        this.selectedAudit = updatedAudit;
      }
      
      const action = updatedItem.completed ? 'completed' : 'marked as pending';
      Swal.fire('Success', `"${updatedItem.name}" ${action}`, 'success');
      this.applyFiltersAndPagination();
    },
    error: (error) => {
      updatedItem.completed = previousStatus;
      Swal.fire('Error', 'Failed to update checklist item', 'error');
      console.error('Error updating logistics item:', error);
    }
  });
}

completeAllLogistics(audit: any): void {
  Swal.fire({
    title: 'Complete All Items?',
    text: 'This will mark all logistics items as completed.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, complete all',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.proceedWithCompleteAll(audit);
    }
  });
}

private proceedWithCompleteAll(audit: any): void {
  if (!audit?.logisticsChecklist) return;
  
  const updatedChecklist = audit.logisticsChecklist.map((item: any) => ({
    ...item,
    completed: true
  }));
  
  this.updateAuditChecklist(audit, updatedChecklist, 'All items marked as completed');
}

markAllPending(audit: any): void {
  Swal.fire({
    title: 'Mark All as Pending?',
    text: 'This will reset all items to pending status.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, mark all pending',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.proceedWithMarkAllPending(audit);
    }
  });
}

private proceedWithMarkAllPending(audit: any): void {
  if (!audit?.logisticsChecklist) return;
  
  const updatedChecklist = audit.logisticsChecklist.map((item: any) => ({
    ...item,
    completed: false
  }));
  
  this.updateAuditChecklist(audit, updatedChecklist, 'All items marked as pending');
}

completeByCategory(audit: any, category: string): void {
  if (!audit?.logisticsChecklist) return;
  
  const updatedChecklist = audit.logisticsChecklist.map((item: any) => ({
    ...item,
    completed: item.category === category ? true : item.completed
  }));
  
  this.updateAuditChecklist(audit, updatedChecklist, `${category} items completed`);
}


loadWorkflows(): void {
  this.http.get<any[]>(this.workflowsUrl).subscribe({
    next: (workflows) => {
      this.workflows = workflows;
    },
    error: (err) => {
      console.error('Failed to load workflows:', err);
    }
  });
}

getStageProgress(audit: any): number {
  if (!audit) return 0;
  
  const stage = audit.stage || this.determineAuditStage(audit);
  const workflow = this.getWorkflowByAuditId(audit.id);
  
  switch (stage) {
    case AuditStage.SCOPING:
      const scopingFields = this.getScopingCompletion(audit);
      return Math.min(scopingFields, 25);
      
    case AuditStage.PLANNING:
      const planningProgress = 25 + (this.getLogisticsProgress(audit) * 0.25);
      return Math.min(planningProgress, 50);
      
    case AuditStage.FIELDWORK:
      const fieldworkProgress = 50 + (this.getFieldworkProgress(workflow) * 0.25);
      return Math.min(fieldworkProgress, 75);
      
    case AuditStage.REPORTING:
      return 75;
      
    case AuditStage.MONITORING:
      return 100;
      
    default:
      return 0;
  }
}

getScopingCompletion(audit: any): number {
  const totalFields = 14; 
  const completedFields = this.countCompletedFields(audit);
  return (completedFields / totalFields) * 25;
}

getFieldworkProgress(workflow: any): number {
  if (!workflow?.fieldwork) return 0;
  
  const fieldwork = workflow.fieldwork;
  let progress = 0;
  
  if (fieldwork.evidence?.length > 0) progress += 25;
  if (fieldwork.meetings?.length > 0) progress += 25;
  if (fieldwork.weeklyUpdates?.length > 0) progress += 25;
  if (fieldwork.preClosing?.length > 0) progress += 25;
  
  return progress;
}

countCompletedFields(audit: any): number {
  const fields = ['title', 'scope', 'department', 'status', 'startDate', 'endDate', 
                 'auditYear', 'auditPeriod', 'auditLead', 'auditMembers', 'riskRating', 
                 'riskRationale', 'kickoffDate', 'planningMemo'];
  
  return fields.filter(field => {
    const value = audit[field];
    return value !== null && value !== undefined && value !== '';
  }).length;
}

progressToNextStage(audit: any): void {
  const currentStage = audit.stage || this.determineAuditStage(audit);
  let nextStage: AuditStage = currentStage; // Initialize with current stage
  let canProgress = false;
  let message = '';

  switch (currentStage) {
    case AuditStage.SCOPING:
      if (this.hasAllRequiredFormData(audit)) {
        nextStage = AuditStage.PLANNING;
        canProgress = true;
        message = 'All form data completed. Moving to Planning stage.';
      } else {
        message = 'Cannot progress: Please complete all required form fields first.';
      }
      break;
      
    case AuditStage.PLANNING:
      if (audit.status === 'In Progress' && this.getLogisticsProgress(audit) >= 50) {
        nextStage = AuditStage.FIELDWORK;
        canProgress = true;
        message = 'Status is In Progress and 50% logistics completed. Moving to Fieldwork stage.';
      } else {
        message = 'Cannot progress: Change status to "In Progress" and complete at least 50% of logistics.';
      }
      break;
      
    case AuditStage.FIELDWORK:
      const workflow = this.getWorkflowByAuditId(audit.id);
      if (workflow?.fieldwork?.preClosing?.length > 0) {
        nextStage = AuditStage.REPORTING;
        canProgress = true;
        message = 'Pre-closing data added. Moving to Reporting stage.';
      } else {
        message = 'Cannot progress: Please add pre-closing findings in the Fieldwork section.';
      }
      break;
      
    case AuditStage.REPORTING:
      if (audit.status === 'Completed') {
        nextStage = AuditStage.MONITORING;
        canProgress = true;
        message = 'Audit completed. Moving to Monitoring stage.';
      } else {
        message = 'Cannot progress: Please mark the audit as "Completed" first.';
      }
      break;
      
    case AuditStage.MONITORING:
      Swal.fire('Info', 'Audit is already in the final stage', 'info');
      return;
      
    default:
      nextStage = AuditStage.SCOPING;
  }

  if (!canProgress) {
    Swal.fire('Cannot Progress', message, 'warning');
    return;
  }

  Swal.fire({
    title: 'Progress Audit Stage?',
    html: `Move from <strong>${this.getStageDisplayName(currentStage)}</strong> to <strong>${this.getStageDisplayName(nextStage)}</strong>?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Progress',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.updateAuditStage(audit.id, nextStage);
      Swal.fire('Success', message, 'success');
      
      // Update local state
      if (this.selectedAudit?.id === audit.id) {
        this.selectedAudit.stage = nextStage;
      }

      this.updateWorkflowStage(audit.id, nextStage);
    }
  });
}

determineAuditStage(audit: any): AuditStage {
  if (!audit) return AuditStage.SCOPING;
  if (audit.status === 'Completed') {
    return AuditStage.MONITORING;
  }

  const workflow = this.getWorkflowByAuditId(audit.id);
  const hasAllFormData = this.hasAllRequiredFormData(audit);
  const logisticsProgress = this.getLogisticsProgress(audit);
  const hasPreClosingData = workflow?.fieldwork?.preClosing?.length > 0;

  if (!hasAllFormData) {
    return AuditStage.SCOPING;
  } else if (audit.status === 'Planned') {
    return AuditStage.PLANNING;
  } else if (audit.status === 'In Progress' && logisticsProgress >= 50 && !hasPreClosingData) {
    return AuditStage.FIELDWORK;
  } else if (audit.status === 'In Progress' && hasPreClosingData) {
    return AuditStage.REPORTING;
  } else if (audit.status === 'Completed') {
    return AuditStage.MONITORING;
  }

  return AuditStage.SCOPING;
}

getWorkflowByAuditId(auditId: number): any {
  return this.workflows.find(w => w.auditId === auditId.toString() || w.id === auditId.toString());
}

hasAllRequiredFormData(audit: any): boolean {
  const requiredFields = [
    'title', 'scope', 'department', 'status', 'startDate', 'endDate',
    'auditYear', 'auditPeriod', 'auditLead', 'auditMembers'
  ];
  
  const riskPlanningFields = [
    'riskRating', 'riskRationale', 'kickoffDate', 'planningMemo'
  ];
  
  const hasBasicData = requiredFields.every(field => {
    const value = audit[field];
    return value !== null && value !== undefined && value !== '';
  });
  
  const hasRiskPlanningData = riskPlanningFields.every(field => {
    const value = audit[field];
    return value !== null && value !== undefined && value !== '';
  });

  const hasInterviewSchedule = audit.interviewSchedule && audit.interviewSchedule.length > 0;

  const hasLogisticsChecklist = audit.logisticsChecklist && audit.logisticsChecklist.length > 0;
  
  return hasBasicData && hasRiskPlanningData && hasInterviewSchedule && hasLogisticsChecklist;
}

private createWorkflowWithRetry(audit: any, retryCount = 0): void {

  if (!this.isUsersLoaded && retryCount < 3) {
    setTimeout(() => {
      this.createWorkflowWithRetry(audit, retryCount + 1);
    }, 500);
    return;
  }

  if (!this.isUsersLoaded) {
    Swal.fire('Warning', 'Workflow not created: User data not loaded', 'warning');
    return;
  }

  const auditLeadUser = this.getUserById(audit.auditLead);
  
  if (!auditLeadUser && retryCount < 3) {
    setTimeout(() => {
      this.createWorkflowWithRetry(audit, retryCount + 1);
    }, 500);
    return;
  }

  if (!this.validateWorkflowData(audit)) {
    Swal.fire('Warning', 'Audit saved but workflow not created due to missing required fields', 'warning');
    return;
  }

  const workflowPayload = this.createWorkflowPayload(audit, auditLeadUser);
  
  this.http.post(this.workflowsUrl, workflowPayload).subscribe({
    next: () => {
      this.globalService.notifyWorkflowsChanged();
      console.log('Workflow created successfully for audit:', audit.id);
    },
    error: (err) => {
      console.error('Workflow creation failed after retries:', err);
      Swal.fire('Error', 'Audit saved but workflow creation failed', 'error');
    }
  });
}

private updateWorkflowForAudit(auditId: string, formData: any): void {
  this.http.get<any[]>(`${this.workflowsUrl}?auditId=${auditId}`).subscribe({
    next: (workflows) => {
      if (workflows.length > 0) {
        const wf = workflows[0];
        const auditLeadUser = this.getUserById(formData.auditLead);
        
        const updatedWf = {
          ...wf,
   
          title: formData.title.includes("Workflow") ? formData.title : `${formData.title} Workflow`,
          scope: formData.scope,
          department: formData.department,
          status: formData.status === 'Planned' ? 'Not Started' : formData.status,
          startDate: formData.startDate,
          dueDate: formData.endDate,
          auditYear: formData.auditYear,
          auditPeriod: formData.auditPeriod,
          
          auditLead: formData.auditLead,
          assignedTo: auditLeadUser ? auditLeadUser.username : formData.auditLead,
          assignedToId: formData.auditLead,
          auditLeadId: formData.auditLead,
          auditMembers: formData.auditMembers,
          thirdPartyFirm: formData.thirdPartyFirm,
          thirdPartyContact: formData.thirdPartyContact,
          clientConfirmation: formData.clientConfirmation,
          confirmationDate: formData.confirmationDate,
          
          riskRating: formData.riskRating,
          riskRationale: formData.riskRationale,
          riskSummary: formData.riskSummary,
          kickoffDate: formData.kickoffDate,
          planningMemo: formData.planningMemo,
          unitOrientation: formData.unitOrientation,
          backgroundSummary: formData.backgroundSummary,
          riskInterviewSummary: formData.riskInterviewSummary,
          
          interviewSchedule: formData.interviewSchedule,
          logisticsChecklist: formData.logisticsChecklist,
          
          criteriaFiles: formData.criteriaFiles || wf.criteriaFiles || [],
          rcmFile: formData.rcmFile || wf.rcmFile || '',
          externalFiles: formData.externalFiles || wf.externalFiles || [],
          internalFiles: formData.internalFiles || wf.internalFiles || [],
          
          updatedAt: new Date().toISOString()
        };
        
        this.http.put(`${this.workflowsUrl}/${wf.id}`, updatedWf).subscribe({
          next: () => {
            this.globalService.notifyWorkflowsChanged();
            console.log('Workflow updated successfully for audit:', auditId);
          },
          error: (err) => {
            console.error('Workflow update failed:', err);
            Swal.fire('Warning', 'Audit updated but workflow sync failed', 'warning');
          }
        });
      } else {
        console.warn('No workflow found for audit:', auditId);
        Swal.fire('Warning', 'Audit updated but no workflow found to sync', 'warning');
      }
    },
    error: (err) => {
      console.error('Failed to fetch workflow for sync:', err);
      Swal.fire('Warning', 'Audit updated but workflow sync failed', 'warning');
    }
  });
}


private mergeLogisticsChecklist(): any[] {
  if (!this.selectedAudit) {
    return this.logisticsChecklist;
  }

  const existingLogistics = this.selectedAudit.logisticsChecklist || [];
  const newLogistics = this.logisticsChecklist || [];
  
  const logisticsMap = new Map();
  
  existingLogistics.forEach((item: { name: any; }) => {
    logisticsMap.set(item.name, { ...item });
  });
  
  newLogistics.forEach(newItem => {
    if (logisticsMap.has(newItem.name)) {
      const existingItem = logisticsMap.get(newItem.name);
      logisticsMap.set(newItem.name, {
        ...newItem,
        completed: existingItem.completed
      });
    } else {
      // New item, add it
      logisticsMap.set(newItem.name, { ...newItem });
    }
  });
  
  return Array.from(logisticsMap.values());
}

isAuditInScopingStage(audit: any): boolean {
  const stage = audit?.stage || this.determineAuditStage(audit);
  return stage === AuditStage.SCOPING;
}

canEditAudit(audit: any): boolean {
  return this.isAuditInScopingStage(audit);
}

showEditRestrictionAlert(audit: any): void {
  const currentStage = audit?.stage || this.determineAuditStage(audit);
  const stageName = this.getStageDisplayName(currentStage);
  
  Swal.fire({
    icon: 'warning',
    title: 'Edit Restricted',
    html: `
      <div class="text-start">
        <p>This audit is currently in the <strong>${stageName}</strong> stage and cannot be edited here.</p>
        <p class="mb-0"><small>Current stage: <span class="badge ${this.getStageBadgeClass(currentStage)}">${stageName}</span></small></p>
        <p class="mt-2 text-muted"><small>Please use the appropriate module for ${stageName.toLowerCase()} activities.</small></p>
      </div>
    `,
    confirmButtonText: 'OK',
    confirmButtonColor: '#3085d6'
  });
}

showAuditDetails(audit: any): void {
  if (this.selectedAudit && this.selectedAudit.id === audit.id) {
    this.hideAuditDetails();
    return;
  }

  this.selectedAudit = { ...audit };
  this.isDetailsPanelVisible = true;

  if (!this.canEditAudit(audit)) {
    setTimeout(() => {
      // this.showEditRestrictionAlert(audit);
    }, 300);
  }
}

openEditAuditModal(audit: any): void {
  if (!this.canEditAudit(audit)) {
    this.showEditRestrictionAlert(audit);
    return;
  }

  this.addAuditForm.patchValue(audit);
  this.isAddAuditModalVisible = true;
  this.selectedAudit = audit;
  this.addAuditForm.get('status')?.disable();
}

openLogisticsModal() {
  if (this.selectedAudit?.logisticsChecklist) {
    const existingNames = new Set(this.logisticsChecklist.map(item => item.name));
    const additionalItems = this.selectedAudit.logisticsChecklist.filter(
      (      item: { name: any; }) => !existingNames.has(item.name)
    );
    this.logisticsChecklist = [...this.logisticsChecklist, ...additionalItems];
  }
  
  const modal = document.getElementById('logisticsModal');
  modal?.classList.add('show');
  modal?.setAttribute('style', 'display:block; background: rgba(0,0,0,0.5)');
}

isExistingLogisticsItem(item: any): boolean {
  if (!this.selectedAudit?.logisticsChecklist) return false;
  
  return this.selectedAudit.logisticsChecklist.some(
    (    existingItem: { name: any; }) => existingItem.name === item.name
  );
}

removeLogisticsItem(index: number): void {
  const item = this.logisticsChecklist[index];
  this.logisticsChecklist.splice(index, 1);
  Swal.fire('Info', `"${item.name}" removed from editing session`, 'info');
}

addLogisticsItem() {
  if (this.newLogisticsItem?.trim()) {
    const newItem = { 
      name: this.newLogisticsItem.trim(), 
      completed: false 
    };
    
    const exists = this.logisticsChecklist.some(item => 
      item.name.toLowerCase() === newItem.name.toLowerCase()
    );
    
    if (!exists) {
      this.logisticsChecklist.push(newItem);
      this.newLogisticsItem = '';
    } else {
      Swal.fire('Warning', 'This item already exists in the checklist', 'warning');
    
    }
  }
}

toggleLogisticsItem(audit: any, item: any, event: any): void {
  const previousStatus = item.completed;
  item.completed = event.target.checked;
  this.updateSingleLogisticsItem(audit, item, previousStatus);
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

getStageProgressBarClass(audit: any): string {
  const progress = this.getStageProgress(audit);
  if (progress <= 20) return 'bg-primary';
  if (progress <= 40) return 'bg-info';
  if (progress <= 60) return 'bg-warning';
  if (progress <= 80) return 'bg-secondary';
  return 'bg-success';
}

getStageShortName(stage: string): string {
  const shortNames: { [key: string]: string } = {
    [AuditStage.SCOPING]: 'Scope',
    [AuditStage.PLANNING]: 'Plan',
    [AuditStage.FIELDWORK]: 'Field',
    [AuditStage.REPORTING]: 'Report',
    [AuditStage.MONITORING]: 'Monitor'
  };
  return shortNames[stage] || stage;
}

getStageBadgeClass(stage: AuditStage | string): string {
  const stageClasses: { [key: string]: string } = {
    [AuditStage.SCOPING]: 'bg-primary',
    [AuditStage.PLANNING]: 'bg-info',
    [AuditStage.FIELDWORK]: 'bg-warning text-dark',
    [AuditStage.REPORTING]: 'bg-secondary',
    [AuditStage.MONITORING]: 'bg-success'
  };
  return stageClasses[stage] || 'bg-primary';
}

getStageDisplayName(stage: AuditStage | string): string {
  const stageNames: { [key: string]: string } = {
    [AuditStage.SCOPING]: 'Scoping',
    [AuditStage.PLANNING]: 'Planning',
    [AuditStage.FIELDWORK]: 'Fieldwork',
    [AuditStage.REPORTING]: 'Reporting',
    [AuditStage.MONITORING]: 'Monitoring'
  };
  return stageNames[stage] || 'Scoping';
}


getAllStages(): AuditStage[] {
  return [
    AuditStage.SCOPING,
    AuditStage.PLANNING,
    AuditStage.FIELDWORK,
    AuditStage.REPORTING,
    AuditStage.MONITORING
  ];
}

getStageIconClass(stage: string, audit: any): string {
  if (!audit) return 'text-muted';
  
  const isActive = this.isStageActive(stage, audit);
  const currentStage = audit.stage || this.determineAuditStage(audit);
  const isCurrent = stage === currentStage;
  
  if (isCurrent) {
    return 'text-primary fa-beat';
  } else if (isActive) {
    return 'text-success';
  } else {
    return 'text-muted';
  }
}

isStageActive(stage: string, audit: any): boolean {
  if (!audit) return false;
  
  const currentStage = audit.stage || this.determineAuditStage(audit);
  const stageOrder: string[] = this.getAllStages();
  const currentIndex = stageOrder.indexOf(currentStage);
  const stageIndex = stageOrder.indexOf(stage);
  return stageIndex <= currentIndex;
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

private async uploadFiles(files: File[], auditId: string, fileType: string): Promise<string[]> {
  const fileUrls: string[] = [];
  
  for (const file of files) {
    // Simulate file upload - in real app, upload to server
    const fileName = `${auditId}_${fileType}_${Date.now()}_${file.name}`;
    const fileUrl = `/assets/uploads/${fileName}`;
    fileUrls.push(fileUrl);
    
    console.log(`Uploading ${fileType}: ${file.name} as ${fileName}`);
  }
  
  return fileUrls;
}

private async handleFileUploads(formData: any, auditId: string): Promise<any> {
  const uploadPromises = [];
  
  if (this.criteriaFiles.length > 0) {
    uploadPromises.push(
      this.uploadFiles(this.criteriaFiles, auditId, 'criteria')
        .then(urls => formData.criteriaFiles = urls)
    );
  }
  
  if (this.rcmFile) {
    uploadPromises.push(
      this.uploadFiles([this.rcmFile], auditId, 'rcm')
        .then(urls => formData.rcmFile = urls[0])
    );
  }
  
  if (this.externalFiles.length > 0) {
    uploadPromises.push(
      this.uploadFiles(this.externalFiles, auditId, 'external')
        .then(urls => formData.externalFiles = urls)
    );
  }
  
  if (this.internalFiles.length > 0) {
    uploadPromises.push(
      this.uploadFiles(this.internalFiles, auditId, 'internal')
        .then(urls => formData.internalFiles = urls)
    );
  }
  
  await Promise.all(uploadPromises);
  return formData;
}

private validateWorkflowData(auditData: any): boolean {
  const requiredFields = ['title', 'scope', 'department', 'auditLead'];
  
  for (const field of requiredFields) {
    if (!auditData[field]) {
      console.error(`Missing required field for workflow: ${field}`);
      return false;
    }
  }
  
  return true;
}

private createWorkflowPayload(auditData: any, auditLeadUser: any): any {
  return {
    id: auditData.id,
    auditId: auditData.id,
    
    title: `${auditData.title} Workflow`,
    scope: auditData.scope,
    department: auditData.department,
    status: auditData.status === 'Planned' ? 'Not Started' : auditData.status,
    stage: this.determineAuditStage(auditData),
    startDate: auditData.startDate,
    dueDate: auditData.endDate,
    auditYear: auditData.auditYear,
    auditPeriod: auditData.auditPeriod,

    assignedTo: auditLeadUser ? auditLeadUser.username : auditData.auditLead,
    assignedToId: auditData.auditLead,
    auditLeadId: auditData.auditLead,
    auditMembers: auditData.auditMembers,
    thirdPartyFirm: auditData.thirdPartyFirm,
    thirdPartyContact: auditData.thirdPartyContact,
    clientConfirmation: auditData.clientConfirmation,
    confirmationDate: auditData.confirmationDate,

    riskRating: auditData.riskRating,
    riskRationale: auditData.riskRationale,
    riskSummary: auditData.riskSummary,
    kickoffDate: auditData.kickoffDate,
    planningMemo: auditData.planningMemo,
    unitOrientation: auditData.unitOrientation,
    backgroundSummary: auditData.backgroundSummary,
    riskInterviewSummary: auditData.riskInterviewSummary,
    
    interviewSchedule: auditData.interviewSchedule,
    logisticsChecklist: auditData.logisticsChecklist,

    criteriaFiles: auditData.criteriaFiles || [],
    rcmFile: auditData.rcmFile || '',
    externalFiles: auditData.externalFiles || [],
    internalFiles: auditData.internalFiles || [],

    tasks: [],
    miniFindings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

saveAudit(): void {
  if (!this.isUsersLoaded) {
    Swal.fire({
      title: 'Loading User Data',
      text: 'Please wait while user data loads...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false
    });
    this.loadUsers();
    setTimeout(() => this.saveAudit(), 1000);
    return;
  }

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
    logisticsChecklist: this.mergeLogisticsChecklist(),
    externalFiles: this.externalFiles,
    internalFiles: this.internalFiles,
    criteriaFiles: this.criteriaFiles,
    rcmFile: this.rcmFile,
    createdAt: this.selectedAudit ? this.selectedAudit.createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (this.selectedAudit) {
    const auditId = this.selectedAudit.id;
    
    this.handleFileUploads(formData, auditId.toString()).then(auditWithFiles => {
      this.http.put(`${this.apiUrl}/${auditId}`, { ...auditWithFiles, id: auditId })
        .subscribe({
          next: (updatedAudit) => {
            // Update workflow
            this.updateWorkflowForAudit(auditId, auditWithFiles);
            
            Swal.fire('Success', 'Audit updated successfully!', 'success');
            this.loadAudits();
            this.closeAddAuditModal();
            this.hideAuditDetails();
            this.globalService.notifyAuditsChanged();
          },
          error: () => Swal.fire('Error', 'Failed to update audit', 'error')
        });
    });
  } else {
    this.http.post<any>(this.apiUrl, formData).subscribe({
      next: async (createdAudit) => {
   
        const auditWithFiles = await this.handleFileUploads({...createdAudit}, createdAudit.id.toString());
        this.http.put(`${this.apiUrl}/${createdAudit.id}`, auditWithFiles).subscribe({
          next: () => {
            console.log('Files metadata saved to audit');
            console.log(formData)
            this.createWorkflowWithRetry(auditWithFiles);
            
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

            this.http.post(`${environment.apiBase}/inboxItems`, newInboxItem).subscribe({
              next: () => console.log('SUCCESS: New assignment notification created in inbox.'),
              error: (err) => console.error('Failed to create inbox notification:', err)
            });

            Swal.fire('Success', 'Audit created successfully!', 'success');
            this.loadAudits();
            this.closeAddAuditModal();
            this.hideAuditDetails();
            this.globalService.notifyAuditsChanged();
          },
          error: (fileErr) => {
            console.error('Failed to save file metadata:', fileErr);
            Swal.fire('Warning', 'Audit saved but file metadata failed', 'warning');
          }
        });
      },
      error: () => Swal.fire('Error', 'Failed to create audit', 'error')
    });
  }
}

filterUsers(searchTerm: string): void {
  if (!searchTerm) {
    this.filteredUsers = this.users;
    return;
  }
  
  const search = searchTerm.toLowerCase();
  this.filteredUsers = this.users.filter(user => 
    user.username?.toLowerCase().includes(search) ||
    user.email?.toLowerCase().includes(search) ||
    user.role?.toLowerCase().includes(search)
  );
}

getAuditLeadDisplayName(userId: string): string {
  if (!userId) return 'Not assigned';
  
  const user = this.users.find(u => u.id === userId || u.id === parseInt(userId));
  return user ? `${user.username} (${user.email}) - ${user.role}` : 'Unknown user';
}

getUserById(userId: string): any {
  return this.users.find(u => u.id === userId || u.id === parseInt(userId));
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

closeLogisticsModal() {
  const modal = document.getElementById('logisticsModal');
  modal?.classList.remove('show');
  modal?.setAttribute('style', 'display:none');
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

saveLogisticsChecklist() {
  console.log('Saved Logistics Checklist:', this.logisticsChecklist);
  this.closeLogisticsModal();
}

  loadMoreAudits(): void {
    this.recordsToShow += 20;
    this.visibleAudits = this.filteredAudits.slice(0, this.recordsToShow);
  }

  hideAuditDetails(): void {
    this.isDetailsPanelVisible = false;
    this.selectedAudit = null;
  }
 
  closeAddAuditModal(): void {
    this.isAddAuditModalVisible = false;
  }

  openAddAuditModal(): void {
    this.addAuditForm.reset({
      status: 'Planned',
      startDate: this.todayString, 
      kickoffDate: this.todayString, 
      endDate: ''                  
    });
    this.hideAuditDetails();
    this.interviewSchedule = [];
    this.logisticsChecklist = [];
    this.isAddAuditModalVisible = true;
    this.selectedAudit = null;
    this.addAuditForm.get('status')?.enable();
  }

  onCriteriaFilesSelected(event: any) {
    this.criteriaFiles = Array.from(event.target.files);
  }

  onExternalFilesSelected(event: any) {
    this.externalFiles = Array.from(event.target.files);
  }

  onInternalFilesSelected(event: any) {
    this.internalFiles = Array.from(event.target.files);
  }

  onRcmFileSelected(event: any) {
    this.rcmFile = event.target.files[0] || null;
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

            this.http.delete(`${this.workflowsUrl}/${id}`).subscribe();
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
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.allAudits);
    const workbook: XLSX.WorkBook = { Sheets: { 'Audits': worksheet }, SheetNames: ['Audits'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'audits.xlsx');
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