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

  private apiUrl = 'http://localhost:3000/audits';
  private usersUrl = 'http://localhost:3000/users';

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

  // NEW FIELD
  // scopingProgress: [''],
});}

ngOnInit(): void {
  const today = new Date();
  this.todayString = today.toISOString().split('T')[0];
  this.loadAudits();
  this.loadUsers();
  
  this.addAuditForm.get('startDate')?.valueChanges.subscribe(start => {
    if (this.addAuditForm.get('endDate')?.value < start) {
      this.addAuditForm.patchValue({ endDate: start });
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

loadUsers(): void {
  this.http.get<any[]>(this.usersUrl).subscribe({
    next: (users) => {
      this.users = users;
      this.filteredUsers = users;
      console.log('Users loaded:', this.users);
    },
    error: (error) => {
      console.error('Error loading users:', error);
      this.toastr.error('Failed to load users');
    }
  });
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

openLogisticsModal() {
  const modal = document.getElementById('logisticsModal');
  modal?.classList.add('show');
  modal?.setAttribute('style', 'display:block; background: rgba(0,0,0,0.5)');
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

addLogisticsItem() {
  if (this.newLogisticsItem?.trim()) {
    this.logisticsChecklist.push({ name: this.newLogisticsItem.trim(), completed: false });
    this.newLogisticsItem = ''; // reset input
  }
}

saveLogisticsChecklist() {
  console.log('Saved Logistics Checklist:', this.logisticsChecklist);
  this.closeLogisticsModal();
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
    // const formData = this.addAuditForm.getRawValue();
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

          const auditLeadUser = this.getUserById(createdAudit.auditLead);
          const workflowPayload = {
            id: createdAudit.id,
            auditId: createdAudit.id,
            title: `${createdAudit.title} Workflow`,
            scope: createdAudit.scope,
            department: createdAudit.department,
            assignedTo: auditLeadUser ? auditLeadUser.username : createdAudit.auditLead,
            assignedToId: createdAudit.auditLead, 
            auditLeadId: createdAudit.auditLead, // Store user ID
            auditMembers: createdAudit.auditMembers,
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