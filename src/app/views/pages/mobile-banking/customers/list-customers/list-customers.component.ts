import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {environment} from 'src/environments/environment';

interface ModalData {
  item: any;
  type: 'initialize' | 'progress' | 'followup' | 'risk' | 'reminder';
}

interface Workflow {
  id: string;
  auditId: string;
  title: string;
  department: string;
  status: string;
  startDate: string;
  dueDate: string;
  fieldwork?: {
    preClosing: PreClosingFinding[];
    evidence: any[];
    meetings: any[];
    weeklyUpdates: any[];
    documents: any[];
  };
  tasks?: any[];
  miniFindings?: any[];
}

interface PreClosingFinding {
  id: string;
  title: string;
  details: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation: string;
  status: string;
  correctiveActionPlan?: CorrectiveActionPlan;
}

interface CorrectiveActionPlan {
  id: string;
  workflowId: string;
  findingId: string;
  description: string;
  actionPlan: string;
  responsibleUnit: string;
  targetDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Verified' | 'Closed' | 'Risk Accepted' | 'Overdue';
  progress: number;
  remarks?: string;
  lastFollowUpDate?: string;
  nextFollowUpDate?: string;
  riskAcceptanceReason?: string;
  riskAcceptedBy?: string;
  riskAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-list-customers',
  templateUrl: './list-customers.component.html',
  styleUrls: ['./list-customers.component.scss']
})
export class ListCustomersComponent implements OnInit {
  workflows: Workflow[] = [];
  correctiveActionPlans: CorrectiveActionPlan[] = [];
  initializeForm: FormGroup;
  progressForm: FormGroup;
  followupForm: FormGroup;
  riskForm: FormGroup;
  monitoringItems: any[] = [];
   selectedItem: any = null;
  selectedCAP: CorrectiveActionPlan | null = null;
  expandedItem: any = null;
  isDetailsPanelVisible = false;
  capFilter = 'all';
  workflowsApiUrl = `${environment.apiBase}/workflows`;
  capsApiUrl = `${environment.apiBase}/correctiveActionPlans`; 
  private bootstrapModals: any = {};
  currentPage: number = 1;
  pageSize: number = 5;
  statusFilter: string = 'all';
  severityFilter: string = 'all';
  dueDateFilter: string = 'all';
  departmentFilter: string = 'all';
  searchTerm: string = '';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
  this.loadMonitoringData();
  this.initializeBootstrapModals();
}

 private initializeBootstrapModals(): void {
    setTimeout(() => {
      this.ensureBootstrapLoaded().then(() => {
        const modalIds = [
          'initializeCAPModal', 'updateProgressModal', 'scheduleFollowupModal', 
          'riskAcceptanceModal', 'reminderModal'
        ];

        modalIds.forEach(modalId => {
          const modalElement = document.getElementById(modalId);
          if (modalElement) {
  
            const existingModal = (window as any).bootstrap.Modal.getInstance(modalElement);
            if (existingModal) {
              existingModal.dispose();
            }

            this.bootstrapModals[modalId] = new (window as any).bootstrap.Modal(modalElement, {
              backdrop: true,
              keyboard: true,
              focus: true
            });
            console.log(`✅ Modal initialized: ${modalId}`);
          }
        });
      });
    }, 300);
  }

  private ensureBootstrapLoaded(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if Bootstrap is already loaded
      if (typeof (window as any).bootstrap !== 'undefined' && (window as any).bootstrap.Modal) {
        resolve();
        return;
      }

      const maxWaitTime = 3000;
      const startTime = Date.now();
      
      const checkBootstrap = setInterval(() => {
        if (typeof (window as any).bootstrap !== 'undefined' && (window as any).bootstrap.Modal) {
          clearInterval(checkBootstrap);
          resolve();
        } else if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkBootstrap);
          reject(new Error('Bootstrap failed to load within 3 seconds'));
        }
      }, 100);
    });
  }

  openInitializeModal(item: any): void {
    this.selectedItem = item;
    const today = new Date().toISOString().split('T')[0];
    
    this.initializeForm.patchValue({
      responsibleUnit: item.department,
      targetDate: today,
      detailedPlan: item.cap.actionPlan
    });
    
    this.showModal('initializeCAPModal');
  }

  openProgressModal(item: any): void {
    this.selectedItem = item;
    const initialProgress = this.getProgress(item.cap);
    
    this.progressForm.patchValue({
      progress: initialProgress,
      status: item.cap.status,
      remarks: item.cap.remarks || ''
    });
    
    this.showModal('updateProgressModal');
  }

  openFollowupModal(item: any): void {
    this.selectedItem = item;
    const today = new Date().toISOString().split('T')[0];
    
    this.followupForm.patchValue({
      followUpDate: item.cap.nextFollowUpDate || today
    });
    
    this.showModal('scheduleFollowupModal');
  }

  openRiskModal(item: any): void {
    this.selectedItem = item;
    this.riskForm.patchValue({
      riskReason: item.cap.riskAcceptanceReason || '',
      acceptedBy: item.cap.riskAcceptedBy || ''
    });
    
    this.showModal('riskAcceptanceModal');
  }

  openReminderModal(item: any): void {
    this.selectedItem = item;
    this.showModal('reminderModal');
  }

  private showModal(modalId: string): void {
    const modal = this.bootstrapModals[modalId];
    if (modal) {
      modal.show();
    } else {
      console.error(`Modal not found: ${modalId}`);
      // Fallback: try to initialize on the fly
      this.initializeSingleModal(modalId);
    }
  }

  private initializeSingleModal(modalId: string): void {
    const modalElement = document.getElementById(modalId);
    if (modalElement) {
      this.bootstrapModals[modalId] = new (window as any).bootstrap.Modal(modalElement);
      this.bootstrapModals[modalId].show();
    }
  }

  private hideModal(modalId: string): void {
    const modal = this.bootstrapModals[modalId];
    if (modal) {
      modal.hide();
    }
  }


private handleModalError(error: any, modalName: string) {
  console.error(`Failed to open ${modalName}:`, error);
  // Fallback: Show a SweetAlert if modal fails
  Swal.fire({
    icon: 'error',
    title: 'Modal Error',
    text: `Failed to open ${modalName}. Please refresh the page and try again.`,
    confirmButtonText: 'OK'
  });
}

onProgressRangeChange(event: any) {
  console.log('Progress changed to:', event.target.value);
}

getPaginatedCAPs(): any[] {
    const filtered = this.getFilteredCAPs();
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return filtered.slice(startIndex, startIndex + this.pageSize);
  }

getTotalPages(): number {
    return Math.ceil(this.getFilteredCAPs().length / this.pageSize);
  }

getVisiblePages(): number[] {
    const totalPages = this.getTotalPages();
    const visiblePages = 5;
    const pages: number[] = [];
    
    let start = Math.max(1, this.currentPage - Math.floor(visiblePages / 2));
    let end = Math.min(totalPages, start + visiblePages - 1);
    
    start = Math.max(1, end - visiblePages + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

onPageSizeChange(): void {
    this.currentPage = 1;
  }

getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.getFilteredCAPs().length);
  }

getUniqueDepartments(): string[] {
    const departments = new Set(this.monitoringItems?.map((item: any) => item.department) || []);
    return Array.from(departments).filter(dept => dept) as string[];
  }

clearSearch(): void {
    this.searchTerm = '';
    this.applyCAPFilter();
  }

clearAllFilters(): void {
    this.statusFilter = 'all';
    this.severityFilter = 'all';
    this.dueDateFilter = 'all';
    this.departmentFilter = 'all';
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyCAPFilter();
  }

applyCAPFilter(): void {
    this.currentPage = 1;
    // Filter logic is handled in getFilteredCAPs() method
  }

private initializeForms() {
    const today = new Date().toISOString().split('T')[0];

    this.initializeForm = this.fb.group({
      responsibleUnit: ['', Validators.required],
      targetDate: ['', [Validators.required, this.futureDateValidator()]],
      detailedPlan: ['', Validators.required]
    });

    this.progressForm = this.fb.group({
      progress: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      status: ['Open', Validators.required],
      remarks: ['']
    });

    this.followupForm = this.fb.group({
      followUpDate: ['', [Validators.required, this.futureDateValidator()]]
    });

    this.riskForm = this.fb.group({
      riskReason: ['', Validators.required],
      acceptedBy: ['', Validators.required]
    });
  }

getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

private markFormGroupTouched(formGroup: FormGroup) {
  Object.keys(formGroup.controls).forEach(key => {
    const control = formGroup.get(key);
    if (control instanceof FormGroup) {
      this.markFormGroupTouched(control);
    } else {
      control?.markAsTouched();
    }
  });
}

private futureDateValidator() {
  return (control: any) => {
    if (!control.value) {
      return { required: true };
    }
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    if (selectedDateOnly < today) {
      return { 
        futureDate: {
          message: 'Date cannot be before today',
          selected: selectedDateOnly.toDateString(),
          today: today.toDateString()
        }
      };
    }
    
    return null;
  };
}

initializeCAP(item: any) {
  this.selectedItem = item;
  const today = new Date().toISOString().split('T')[0];
  
  this.initializeForm.patchValue({
    responsibleUnit: item.department,
    targetDate:  today, 
    detailedPlan: item.cap.actionPlan
  });
  
  const modal = new (window as any).bootstrap.Modal(document.getElementById('initializeCAPModal'));
  modal.show();
  
  setTimeout(() => {
    const dateInput = document.getElementById('targetDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.min = today;
    }
  }, 100);
}

scheduleFollowUpForCAP(item: any) {
  this.selectedItem = item;
  const today = new Date().toISOString().split('T')[0];
  
  this.followupForm.patchValue({
    followUpDate: item.cap.nextFollowUpDate || today 
  });
  
  const modal = new (window as any).bootstrap.Modal(document.getElementById('scheduleFollowupModal'));
  modal.show();
  
  setTimeout(() => {
    const dateInput = document.getElementById('followUpDate') as HTMLInputElement;
    if (dateInput) {
      dateInput.min = today;
    }
  }, 100);
}

  requestRiskAcceptance(item: any) {
    this.selectedItem = item;
    this.riskForm.patchValue({
      riskReason: item.cap.riskAcceptanceReason || '',
      acceptedBy: item.cap.riskAcceptedBy || ''
    });
    
    const modal = new (window as any).bootstrap.Modal(document.getElementById('riskAcceptanceModal'));
    modal.show();
  }

  sendReminder(item: any) {
    this.selectedItem = item;
    const modal = new (window as any).bootstrap.Modal(document.getElementById('reminderModal'));
    modal.show();
  }

async onInitializeSubmit() {
  if (this.initializeForm.valid && this.selectedItem) {
    try {
      const formValue = this.initializeForm.value;
      
      // Double-check date validation
      const selectedDate = new Date(formValue.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Date',
          text: 'Target date cannot be before today',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      const capData: CorrectiveActionPlan = {
        ...this.selectedItem.cap,
        responsibleUnit: formValue.responsibleUnit,
        targetDate: formValue.targetDate,
        actionPlan: formValue.detailedPlan,
        status: 'In Progress',
        progress: 25, 
        updatedAt: new Date().toISOString()
      };

      await this.saveCAP(capData);
      this.hideModal('initializeCAPModal');
      
      Swal.fire({
        icon: 'success',
        title: 'CAP Initialized!',
        text: 'Corrective Action Plan has been initialized successfully',
        timer: 3000,
        showConfirmButton: false
      });
      
      this.loadMonitoringData();
      
    } catch (error) {
      this.showErrorAlert('Failed to initialize CAP');
    }
  }
}

async onRiskSubmit() {
  if (this.riskForm.valid && this.selectedItem) {
    try {
      const formValue = this.riskForm.value;
      
      const capData: CorrectiveActionPlan = {
        ...this.selectedItem.cap,
        status: 'Risk Accepted',
        progress: 100, // Auto-set to 100% for risk acceptance
        riskAcceptanceReason: formValue.riskReason,
        riskAcceptedBy: formValue.acceptedBy,
        riskAcceptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.saveCAP(capData);
      this.hideModal('riskAcceptanceModal');
      
      Swal.fire({
        icon: 'success',
        title: 'Risk Accepted!',
        text: 'Risk acceptance has been recorded successfully',
        timer: 3000,
        showConfirmButton: false
      });
      
      this.loadMonitoringData();
      
    } catch (error) {
      this.showErrorAlert('Failed to submit risk acceptance');
    }
  }
}

updateCAPProgress(item: any) {
  this.selectedItem = item;
  const initialProgress = this.getProgress(item.cap);
  
  this.progressForm.patchValue({
    progress: initialProgress,
    status: item.cap.status,
    remarks: item.cap.remarks || ''
  });
  
  const modal = new (window as any).bootstrap.Modal(document.getElementById('updateProgressModal'));
  modal.show();
}

  async onFollowupSubmit() {
    if (this.followupForm.valid && this.selectedItem) {
      try {
        const formValue = this.followupForm.value;
        
        const capData: CorrectiveActionPlan = {
          ...this.selectedItem.cap,
          nextFollowUpDate: formValue.followUpDate,
          updatedAt: new Date().toISOString()
        };

        await this.saveCAP(capData);
        this.hideModal('scheduleFollowupModal');
        
        Swal.fire({
          icon: 'success',
          title: 'Follow-up Scheduled!',
          text: `Follow-up has been scheduled for ${this.formatDate(formValue.followUpDate)}`,
          timer: 3000,
          showConfirmButton: false
        });
        
        this.loadMonitoringData();
        
      } catch (error) {
        this.showErrorAlert('Failed to schedule follow-up');
      }
    }
  }

  async onReminderSubmit() {
    if (this.selectedItem) {
      try {
        const capData: CorrectiveActionPlan = {
          ...this.selectedItem.cap,
          lastFollowUpDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await this.saveCAP(capData);
        this.hideModal('reminderModal');
        
        Swal.fire({
          icon: 'success',
          title: 'Reminder Sent!',
          text: `Reminder has been sent to ${this.selectedItem.cap.responsibleUnit}`,
          timer: 3000,
          showConfirmButton: false
        });
        
      } catch (error) {
        this.showErrorAlert('Failed to send reminder');
      }
    }
  }

  private showErrorAlert(message: string) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
      confirmButtonText: 'OK'
    });
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private async saveCAP(capData: CorrectiveActionPlan): Promise<void> {
    try {
      console.log('🔄 Saving CAP to backend:', capData);
      
      const existingIndex = this.correctiveActionPlans.findIndex(cap => cap.id === capData.id);
      
      if (existingIndex >= 0) {
        console.log('📝 Updating existing CAP...');
        const response = await this.http.put(`${this.capsApiUrl}/${capData.id}`, capData).toPromise();
        console.log('✅ CAP updated successfully:', response);
        this.correctiveActionPlans[existingIndex] = capData;
      } else {
        console.log('🆕 Creating new CAP...');
        const response = await this.http.post(this.capsApiUrl, capData).toPromise();
        console.log('✅ CAP created successfully:', response);
        this.correctiveActionPlans.push(capData);
      }
      
      this.processMonitoringItems();
      
    } catch (error) {
      console.error('❌ Failed to save CAP:', error);
      throw new Error('Failed to save CAP to server');
    }
  }

  exportCAPReport() {
    try {
      // Create CSV content
      const headers = ['Audit WF', 'Finding', 'Severity', 'Responsible Unit', 'Target Date', 'Status', 'Progress'];
      const csvData = this.monitoringItems.map(item => [
        item.workflowTitle,
        // item.department,
        item.finding.title,
        item.finding.severity,
        item.cap.responsibleUnit,
        item.cap.targetDate,
        item.cap.status,
        `${item.cap.progress}%`
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CAP-Report-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Report Exported!',
        text: 'CAP report has been exported successfully',
        timer: 3000,
        showConfirmButton: false
      });
      
    } catch (error) {
      this.showErrorAlert('Failed to export CAP report');
    }
  }

  generateMonitoringReport() {
    const reportData = {
      totalCAPs: this.getTotalCAPs(),
      overdue: this.getOverdueCAPs(),
      inProgress: this.getInProgressCAPs(),
      completed: this.getCompletedCAPs(),
      riskAccepted: this.getRiskAcceptedCAPs(),
      newFindings: this.getNewFindings(),
      generatedAt: new Date().toISOString()
    };

    Swal.fire({
      title: 'Monitoring Report Generated',
      html: `
        <div class="text-start">
          <p class="fw-bold text-primary">Monitoring Report Summary</p>
          <div class="row">
            <div class="col-6">
              <p><strong>Total CAPs:</strong> ${reportData.totalCAPs}</p>
              <p><strong>New Findings:</strong> ${reportData.newFindings}</p>
              <p><strong>Overdue:</strong> ${reportData.overdue}</p>
            </div>
            <div class="col-6">
              <p><strong>In Progress:</strong> ${reportData.inProgress}</p>
              <p><strong>Completed:</strong> ${reportData.completed}</p>
              <p><strong>Risk Accepted:</strong> ${reportData.riskAccepted}</p>
            </div>
          </div>
          <hr>
          <small class="text-muted">Generated: ${new Date().toLocaleString()}</small>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'OK',
      width: 600
    });
  }


  getFilteredCAPs(): any[] {
    let filtered = this.monitoringItems;

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter((item: any) => {
        switch (this.statusFilter) {
          case 'new': return item.isNew;
          case 'open': return item.cap.status === 'Open';
          case 'in_progress': return item.cap.status === 'In Progress';
          case 'completed': return item.cap.status === 'Completed' || item.cap.status === 'Verified' || item.cap.status === 'Closed';
          case 'verified': return item.cap.status === 'Verified';
          case 'closed': return item.cap.status === 'Closed';
          case 'risk_accepted': return item.cap.status === 'Risk Accepted';
          default: return true;
        }
      });
    }

    if (this.severityFilter !== 'all') {
      filtered = filtered.filter((item: any) => {
        const severity = item.finding.severity.toLowerCase();
        return severity === this.severityFilter;
      });
    }

    if (this.dueDateFilter !== 'all') {
      filtered = filtered.filter((item: any) => {
        switch (this.dueDateFilter) {
          case 'overdue': return this.isOverdue(item);
          case 'due_soon': return this.isDueSoon(item.cap);
          case 'due_month': return this.isDueThisMonth(item.cap);
          case 'future': return this.isFutureDate(item.cap);
          default: return true;
        }
      });
    }

    if (this.departmentFilter !== 'all') {
      filtered = filtered.filter((item: any) => item.department === this.departmentFilter);
    }

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter((item: any) => 
        item.workflowTitle.toLowerCase().includes(searchLower) ||
        item.finding.title.toLowerCase().includes(searchLower) ||
        item.finding.details.toLowerCase().includes(searchLower) ||
        (item.cap.responsibleUnit && item.cap.responsibleUnit.toLowerCase().includes(searchLower)) ||
        (item.cap.actionPlan && item.cap.actionPlan.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }

  isDueThisMonth(cap: CorrectiveActionPlan): boolean {
    if (!cap.targetDate || cap.status === 'Completed' || cap.status === 'Verified' || cap.status === 'Closed' || cap.status === 'Risk Accepted') {
      return false;
    }

    const targetDate = new Date(cap.targetDate);
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return targetDate >= today && targetDate <= endOfMonth;
  }

  isFutureDate(cap: CorrectiveActionPlan): boolean {
    if (!cap.targetDate) return false;
    
    const targetDate = new Date(cap.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return targetDate > today;
  }


  loadMonitoringData() {
    this.http.get<Workflow[]>(this.workflowsApiUrl).subscribe({
      next: (workflows) => {
        this.workflows = workflows;
        this.loadCorrectiveActionPlans();
      },
      error: (error) => {
        console.error('Failed to load workflows:', error);
        Swal.fire('Error', 'Failed to load workflows', 'error');
      }
    });
  }

  getVerifiedCAPs(): number {
    return this.monitoringItems.filter((item: any) => item.cap.status === 'Verified').length;
  }

getFindingStatusText(status: string): string {
  if (!status) return 'Draft';
  
  const statusMap: { [key: string]: string } = {
    'Draft': 'Draft',
    'Open': 'Open',
    'Reviewed': 'Reviewed', 
    'Presented': 'Presented',
    'Confirmed': 'Confirmed',
    'Closed': 'Closed',
    'Resolved': 'Resolved'
  };
  
  return statusMap[status] || status;
}

  loadCorrectiveActionPlans() {
    this.http.get<CorrectiveActionPlan[]>(this.capsApiUrl).subscribe({
      next: (caps) => {
        this.correctiveActionPlans = caps;
        this.processMonitoringItems();
      },
      error: (error) => {
        console.error('Failed to load CAPs:', error);
        this.correctiveActionPlans = [];
        this.processMonitoringItems();
      }
    });
  }

  private processMonitoringItems() {
    this.monitoringItems = [];

    this.workflows.forEach(workflow => {
      // Process preClosing findings as monitoring items
      if (workflow.fieldwork?.preClosing) {
        workflow.fieldwork.preClosing.forEach(finding => {
          const existingCAP = this.correctiveActionPlans.find(cap => 
            cap.workflowId === workflow.id && cap.findingId === finding.id
          );

          const monitoringItem = {
            workflowId: workflow.id,
            workflowTitle: workflow.title,
            department: workflow.department,
            finding: finding,
            cap: existingCAP || this.createNewCAP(workflow, finding),
            isNew: !existingCAP
          };

          this.monitoringItems.push(monitoringItem);
        });
      }
    });

    this.updateKPICounts();
  }

  private createNewCAP(workflow: Workflow, finding: PreClosingFinding): CorrectiveActionPlan {
    return {
      id: `cap-${workflow.id}-${finding.id}`,
      workflowId: workflow.id,
      findingId: finding.id,
      description: finding.title,
      actionPlan: finding.recommendation,
      responsibleUnit: workflow.department,
      targetDate: this.calculateTargetDate(workflow.dueDate),
      status: 'Open',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private calculateTargetDate(workflowDueDate: string): string {
    const dueDate = new Date(workflowDueDate);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString().split('T')[0];
  }

  getCAPStatus(cap: CorrectiveActionPlan): CorrectiveActionPlan['status'] {
    if (!cap.targetDate) return cap.status;

    const targetDate = new Date(cap.targetDate);
    const today = new Date();

    if (targetDate < today && cap.status !== 'Completed' && cap.status !== 'Verified' && cap.status !== 'Closed' && cap.status !== 'Risk Accepted') {
      return 'Overdue';
    }

    return cap.status;
  }

getTotalCAPs(): number {
    return this.monitoringItems.length;
  }

getInProgressCAPs(): number {
    return this.monitoringItems.filter((item: any) => 
      item.cap.status === 'In Progress'
    ).length;
  }

getCompletedCAPs(): number {
    return this.monitoringItems.filter((item: any) => 
      item.cap.status === 'Completed' || item.cap.status === 'Verified' || item.cap.status === 'Closed'
    ).length;
  }

getRiskAcceptedCAPs(): number {
    return this.monitoringItems.filter((item: any) => item.cap.status === 'Risk Accepted').length;
  }

getOverdueCAPs(): number {
    return this.monitoringItems.filter((item: any) => this.getCAPStatus(item.cap) === 'Overdue').length;
  }

getDueThisWeek(): number {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return this.monitoringItems.filter((item: any) => {
      if (!item.cap.targetDate) return false;
      const targetDate = new Date(item.cap.targetDate);
      return targetDate >= today && 
             targetDate <= nextWeek && 
             item.cap.status !== 'Completed' && 
             item.cap.status !== 'Verified' && 
             item.cap.status !== 'Closed' &&
             item.cap.status !== 'Risk Accepted';
    }).length;
  }

getNewFindings(): number {
    return this.monitoringItems.filter((item: any) => item.isNew).length;
  }

onStatusChange(event: any) {
  const status = event.target.value;
  
  const autoProgress = this.getAutoProgress(status);

  this.progressForm.patchValue({
    progress: autoProgress
  });
}

getProgress(cap: CorrectiveActionPlan): number {
  if (cap.progress !== undefined && cap.progress !== null) {
    return cap.progress;
  }
  
  switch (cap.status) {
    case 'Open':
      return 0;
    case 'In Progress':
      return 25;
    case 'Completed':
      return 80;
    case 'Verified':
      return 100;
    case 'Closed':
      return 100;
    case 'Risk Accepted':
      return 100;
    case 'Overdue':
      return cap.progress || 0;
    default:
      return cap.progress || 0;
  }
}

getAutoProgress(status: string): number {
  switch (status) {
    case 'Open': return 0;
    case 'In Progress': return 25;
    case 'Completed': return 80;
    case 'Verified': return 100;
    case 'Closed': return 100;
    case 'Risk Accepted': return 100;
    default: return 0;
  }
}

  async onProgressSubmit() {
  if (this.progressForm.valid && this.selectedItem) {
    try {
      const formValue = this.progressForm.value;
    
      const calculatedProgress = formValue.progress;
      
      const capData: CorrectiveActionPlan = {
        ...this.selectedItem.cap,
        progress: calculatedProgress,
        status: formValue.status,
        remarks: formValue.remarks,
        lastFollowUpDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.saveCAP(capData);
      this.hideModal('updateProgressModal');
      
      Swal.fire({
        icon: 'success',
        title: 'Progress Updated!',
        text: 'CAP progress has been updated successfully',
        timer: 3000,
        showConfirmButton: false
      });
      
      this.loadMonitoringData();
      
    } catch (error) {
      this.showErrorAlert('Failed to update CAP progress');
    }
  }
}


toggleDetails(item: any) {
    if (this.expandedItem && this.expandedItem.cap.id === item.cap.id) {
      this.hideDetails();
    } else {
      this.expandedItem = item;
      this.isDetailsPanelVisible = true;
    }
  }

hideDetails() {
    this.expandedItem = null;
    this.isDetailsPanelVisible = false;
  }

  viewOverdueCAPs() {
    this.capFilter = 'overdue';
    this.applyCAPFilter();
  }

  viewDueThisWeek() {
    this.capFilter = 'due_soon';
    this.applyCAPFilter();
  }

  viewCompletedCAPs() {
    this.capFilter = 'completed';
    this.applyCAPFilter();
  }

  viewRiskAccepted() {
    this.capFilter = 'risk_accepted';
    this.applyCAPFilter();
  }

  viewNewFindings() {
    this.capFilter = 'new';
    this.applyCAPFilter();
  }

  scheduleFollowUp() {
    Swal.fire('Info', 'Bulk follow-up scheduling feature will be implemented here', 'info');
  }

  private updateKPICounts() {
    // KPI counts are now calculated dynamically in getter methods
    // This method can be used for additional KPI updates if needed
  }

  isOverdue(item: any): boolean {
    return this.getCAPStatus(item.cap) === 'Overdue';
  }

  isDueSoon(cap: CorrectiveActionPlan): boolean {
    if (!cap.targetDate || cap.status === 'Completed' || cap.status === 'Verified' || cap.status === 'Closed' || cap.status === 'Risk Accepted') {
      return false;
    }

    const targetDate = new Date(cap.targetDate);
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return targetDate >= today && targetDate <= nextWeek;
  }
}