import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

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
  // Monitoring fields we'll add
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
  // Main data arrays
  workflows: Workflow[] = [];
  correctiveActionPlans: CorrectiveActionPlan[] = [];
  
  // Combined view for display
  monitoringItems: any[] = [];
  
  // UI state
  selectedCAP: CorrectiveActionPlan | null = null;
  expandedItem: any = null;
  isDetailsPanelVisible = false;
  capFilter = 'all';
  
  // API endpoints
  workflowsApiUrl = 'http://localhost:3000/workflows';
  capsApiUrl = 'http://localhost:3000/correctiveActionPlans'; // New endpoint for CAPs

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMonitoringData();
  }

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 5;

  // Filter properties
  statusFilter: string = 'all';
  severityFilter: string = 'all';
  dueDateFilter: string = 'all';
  departmentFilter: string = 'all';
  searchTerm: string = '';

  // Pagination methods
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

  // Filter methods
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

  // Enhanced filtering method
  getFilteredCAPs(): any[] {
    let filtered = this.monitoringItems;

    // Apply status filter
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

    // Apply severity filter
    if (this.severityFilter !== 'all') {
      filtered = filtered.filter((item: any) => {
        const severity = item.finding.severity.toLowerCase();
        return severity === this.severityFilter;
      });
    }

    // Apply due date filter
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

    // Apply department filter
    if (this.departmentFilter !== 'all') {
      filtered = filtered.filter((item: any) => item.department === this.departmentFilter);
    }

    // Apply search filter
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

  // Additional date filter methods
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
    // Load workflows and CAPs
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

  loadCorrectiveActionPlans() {
    this.http.get<CorrectiveActionPlan[]>(this.capsApiUrl).subscribe({
      next: (caps) => {
        this.correctiveActionPlans = caps;
        this.processMonitoringItems();
      },
      error: (error) => {
        console.error('Failed to load CAPs:', error);
        // If CAPs endpoint doesn't exist yet, initialize with empty array
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
          // Find existing CAP for this finding
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
    // Add 30 days to workflow due date for CAP target
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toISOString().split('T')[0];
  }

  getCAPStatus(cap: CorrectiveActionPlan): CorrectiveActionPlan['status'] {
    if (!cap.targetDate) return cap.status;

    const targetDate = new Date(cap.targetDate);
    const today = new Date();
    
    // Check if overdue
    if (targetDate < today && cap.status !== 'Completed' && cap.status !== 'Verified' && cap.status !== 'Closed' && cap.status !== 'Risk Accepted') {
      return 'Overdue';
    }

    return cap.status;
  }

  getProgress(cap: CorrectiveActionPlan): number {
    return cap.progress || 0;
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

  initializeCAP(item: any) {
    Swal.fire({
      title: 'Initialize Corrective Action Plan',
      html: `
        <div class="text-start">
         <hr>
          <label class="form-label fw-bold">Responsible Unit</label>
          <input type="text" class="form-control" id="responsibleUnit" value="${item.department}">
          
          <label class="form-label fw-bold mt-3">Target Completion Date</label>
          <input type="date" class="form-control" id="targetDate" 
                 value="${item.cap.targetDate}" 
                 min="${new Date().toISOString().split('T')[0]}">
          
          <label class="form-label fw-bold mt-3">Detailed Action Plan</label>
          <textarea class="form-control" rows="3" id="detailedPlan">${item.cap.actionPlan}</textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Initialize CAP'
    }).then((result) => {
      if (result.isConfirmed) {
        const responsibleUnit = (document.getElementById('responsibleUnit') as HTMLInputElement).value;
        const targetDate = (document.getElementById('targetDate') as HTMLInputElement).value;
        const detailedPlan = (document.getElementById('detailedPlan') as HTMLTextAreaElement).value;

        const capData: CorrectiveActionPlan = {
          ...item.cap,
          responsibleUnit: responsibleUnit,
          targetDate: targetDate,
          actionPlan: detailedPlan,
          status: 'In Progress',
          progress: 10,
          updatedAt: new Date().toISOString()
        };

        this.saveCAP(capData).then(() => {
          Swal.fire('CAP Initialized', 'Corrective Action Plan has been initialized', 'success');
          this.loadMonitoringData();
        });
      }
    });
  }

  updateCAPProgress(item: any) {
    Swal.fire({
      title: 'Update CAP Progress',
      html: `
        <div class="text-start">
          <label class="form-label fw-bold">Progress Percentage</label>
          <input type="range" class="form-range" min="0" max="100" value="${item.cap.progress}" 
                 id="progressRange">
          <div class="text-center mt-2">
            <span id="progressValue" class="fw-bold">${item.cap.progress}%</span>
          </div>
          
          <label class="form-label fw-bold mt-3">Status</label>
          <select class="form-select" id="statusSelect">
            <option value="Open" ${item.cap.status === 'Open' ? 'selected' : ''}>Open</option>
            <option value="In Progress" ${item.cap.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Completed" ${item.cap.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option value="Verified" ${item.cap.status === 'Verified' ? 'selected' : ''}>Verified</option>
          </select>
          
          <label class="form-label fw-bold mt-3">Progress Remarks</label>
          <textarea class="form-control" rows="3" id="progressRemarks" 
                    placeholder="Add progress remarks...">${item.cap.remarks || ''}</textarea>
        <hr>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Progress',
      didOpen: () => {
        const range = document.getElementById('progressRange') as HTMLInputElement;
        const value = document.getElementById('progressValue') as HTMLSpanElement;
        
        range.addEventListener('input', () => {
          value.textContent = `${range.value}%`;
        });
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const range = document.getElementById('progressRange') as HTMLInputElement;
        const statusSelect = document.getElementById('statusSelect') as HTMLSelectElement;
        const remarks = document.getElementById('progressRemarks') as HTMLTextAreaElement;

        const capData: CorrectiveActionPlan = {
          ...item.cap,
          progress: parseInt(range.value),
          status: statusSelect.value as CorrectiveActionPlan['status'],
          remarks: remarks.value,
          lastFollowUpDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.saveCAP(capData).then(() => {
          Swal.fire('Success', 'CAP progress updated successfully', 'success');
          this.loadMonitoringData();
        });
      }
    });
  }

  sendReminder(item: any) {
    Swal.fire({
      title: 'Send Reminder',
      html: `Send reminder to <strong>${item.cap.responsibleUnit}</strong> for CAP: <em>${item.cap.description}</em>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Send Reminder'
    }).then((result) => {
      if (result.isConfirmed) {
        // Update last follow-up date
        const capData: CorrectiveActionPlan = {
          ...item.cap,
          lastFollowUpDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.saveCAP(capData).then(() => {
          Swal.fire('Reminder Sent', `Reminder sent to ${item.cap.responsibleUnit}`, 'success');
        });
      }
    });
  }

  scheduleFollowUpForCAP(item: any) {
    Swal.fire({
      title: 'Schedule Follow-up',
      html: `
        <div class="text-start">
          <hr>
          <label class="form-label fw-bold">Follow-up Date</label>
          <input type="date" class="form-control" id="followUpDate" 
                 min="${new Date().toISOString().split('T')[0]}"
                 value="${item.cap.nextFollowUpDate || ''}">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Schedule Follow-up'
    }).then((result) => {
      if (result.isConfirmed) {
        const followUpDate = (document.getElementById('followUpDate') as HTMLInputElement).value;
        
        const capData: CorrectiveActionPlan = {
          ...item.cap,
          nextFollowUpDate: followUpDate,
          updatedAt: new Date().toISOString()
        };

        this.saveCAP(capData).then(() => {
          Swal.fire('Scheduled', `Follow-up scheduled for ${followUpDate}`, 'success');
          this.loadMonitoringData();
        });
      }
    });
  }

  requestRiskAcceptance(item: any) {
    Swal.fire({
      title: 'Request Risk Acceptance',
      html: `
        <div class="text-start">
          <hr>
          <label class="form-label fw-bold">Reason for Risk Acceptance</label>
          <textarea class="form-control" rows="4" id="riskReason" 
                    placeholder="Explain why this risk should be accepted...">${item.cap.riskAcceptanceReason || ''}</textarea>
          
          <label class="form-label fw-bold mt-3">Accepted By</label>
          <input type="text" class="form-control" id="acceptedBy" 
                 placeholder="Name of person accepting risk"
                 value="${item.cap.riskAcceptedBy || ''}">
          <hr>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Submit Risk Acceptance'
    }).then((result) => {
      if (result.isConfirmed) {
        const riskReason = (document.getElementById('riskReason') as HTMLTextAreaElement).value;
        const acceptedBy = (document.getElementById('acceptedBy') as HTMLInputElement).value;

        if (!riskReason || !acceptedBy) {
          Swal.fire('Error', 'Please provide both reason and acceptor name', 'error');
          return;
        }

        const capData: CorrectiveActionPlan = {
          ...item.cap,
          status: 'Risk Accepted',
          progress: 100,
          riskAcceptanceReason: riskReason,
          riskAcceptedBy: acceptedBy,
          riskAcceptedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.saveCAP(capData).then(() => {
          Swal.fire('Risk Accepted', 'Risk acceptance has been recorded', 'success');
          this.loadMonitoringData();
        });
      }
    });
  }

  private async saveCAP(capData: CorrectiveActionPlan): Promise<void> {
    // Check if CAP already exists
    const existingIndex = this.correctiveActionPlans.findIndex(cap => cap.id === capData.id);
    
    if (existingIndex >= 0) {
      // Update existing CAP
      return this.http.put(`${this.capsApiUrl}/${capData.id}`, capData).toPromise()
        .then(() => {
          this.correctiveActionPlans[existingIndex] = capData;
          this.processMonitoringItems(); // Refresh the view
        })
        .catch(error => {
          console.error('Failed to update CAP:', error);
          throw error;
        });
    } else {
      // Create new CAP
      return this.http.post(this.capsApiUrl, capData).toPromise()
        .then(() => {
          this.correctiveActionPlans.push(capData);
          this.processMonitoringItems(); // Refresh the view
        })
        .catch(error => {
          console.error('Failed to create CAP:', error);
          throw error;
        });
    }
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
          <p><strong>Monitoring Report Summary</strong></p>
          <p>Total CAPs: ${reportData.totalCAPs}</p>
          <p>New Findings: ${reportData.newFindings}</p>
          <p>Overdue: ${reportData.overdue}</p>
          <p>In Progress: ${reportData.inProgress}</p>
          <p>Completed: ${reportData.completed}</p>
          <p>Risk Accepted: ${reportData.riskAccepted}</p>
          <hr>
          <small class="text-muted">Generated: ${new Date().toLocaleString()}</small>
        </div>
      `,
      icon: 'success'
    });
  }

  scheduleFollowUp() {
    Swal.fire('Info', 'Bulk follow-up scheduling feature will be implemented here', 'info');
  }

  exportCAPReport() {
    // Create CSV content
    const headers = ['Workflow', 'Department', 'Finding', 'Severity', 'Responsible Unit', 'Target Date', 'Status', 'Progress'];
    const csvData = this.monitoringItems.map(item => [
      item.workflowTitle,
      item.department,
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

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CAP-Report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    Swal.fire('Success', 'CAP report exported successfully', 'success');
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