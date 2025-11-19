import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, Observable } from 'rxjs';
import { takeUntil, finalize, map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ChartData } from 'chart.js';
import * as XLSX from 'xlsx';
import * as saveAs from 'file-saver';
import jsPDF from 'jspdf';
import { GlobalService } from 'src/app/shared/services/global.service';
import Swal from 'sweetalert2';
import autoTable from 'jspdf-autotable'; 
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface MISReport {
  id?: string;
  title: string;
  type: 'auto-generated' | 'uploaded' | 'fieldwork';
  source?: 'fieldwork' | 'manual' | 'system';
  createdAt: string;
  summary?: any;
  fileUrl?: string | null;
  uploadedBy?: string;
  fileType?: string;
  description?: string;
  filePath?: any;
  findingsCount?: number;
  evidenceCount?: number;
  fieldworkData?: any; // Store fieldwork findings
  
  draftStatus?: 'under_review' | 'client_review' | 'revised' | 'finalized';
  clientComments?: {
    text: string;
    author: string;
    date: string;
    type: 'comment' | 'question' | 'revision_request';
  }[];
  revisionCount?: number;
  sentToClientAt?: string;
  finalizedAt?: string;

  managementResponses?: {
    hasDateError: string | boolean;
    findingId?: string;
    findingTitle?: string;
    response: string;
    actionPlan: string;
    responsiblePerson: string;
    targetDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  }[];
  managementResponseDueDate?: string;
  managementResponseSubmittedAt?: string;
  managementResponseStatus?: 'pending' | 'submitted' | 'overdue' | 'accepted';
  distributedAt?: string;
  distributedTo?: string[];
}
export interface FieldworkAudit {
  id: string;
  title: string;
  department: string;
  status: string;
  findingsCount: number;
  evidenceCount: number;
  fieldwork?: any;
  preClosing?: any[];
  createdAt?: string;
}

export interface Audit {
  id: string;
  title: string;
  department: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface Workflow {
  id: string;
  auditId?: string;
  title: string;
  department: string;
  status: string;
  tasks?: any[];
  miniFindings?: any[];
}

export interface Observation {
  id: string;
  severity: string;
  status: string;
  createdAt: string;
  findings?: any[];
}
declare var bootstrap: any;

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories-as-cards.component.html',
  styleUrls: ['./product-categories-as-cards.component.scss']
})
export class ProductCategoriesAsCardsComponent implements OnInit, OnDestroy {
  reports: MISReport[] = [];
  fieldworkReports: FieldworkAudit[] = [];
  isLoading = false;
  newTitle = '';
  uploadingFile?: File;
  filteredReports: MISReport[] = [];
  commentForm!: FormGroup;
  filterTitle = '';
  filterType = '';
  filterSource = '';
  filterDate = '';
  currentPage = 1;
  pageSize = 5;
  newCommentType: 'comment' | 'question' | 'revision_request' = 'comment';
  newCommentText = '';
  formSubmitted  = false;
  showCommentModal = false;
  selectedReportForComment?: MISReport;

  kpis = {
    total: 0,
    uploaded: 0,
    auto: 0,
    fieldworkReady: 0,
    criticalFindings: 0,
    latestDate: '',
    totalFindings: 0,
    addressedFindings: 0
  };

  progressData: any = {};

  private destroy$ = new Subject<void>();
  private apiUrl = 'http://localhost:3000';
selectedCommentType: any;
  generatingReports: any;

  constructor(
    private mis: GlobalService,
    private globalService: GlobalService,
    private http: HttpClient,
     private fb: FormBuilder 
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadReports();
    this.loadFieldworkData();
    this.calculateKPIsFromWorkflows(); 
    this.initializeCommentForm();
  this.trackResponseDueDates();
  }


fieldworkCurrentPage = 1;
fieldworkPageSize = 10;
fieldworkSortField = 'title';
fieldworkSortDirection: 'asc' | 'desc' = 'asc';


getFieldworkTotalPages(): number {
  return Math.ceil(this.getFieldworkReportsWithFindings().length / this.fieldworkPageSize);
}

getStartsIndex(): number {
  return (this.fieldworkCurrentPage - 1) * this.fieldworkPageSize;
}

getEndsIndex(): number {
  return Math.min(this.fieldworkCurrentPage * this.fieldworkPageSize, this.getFieldworkReportsWithFindings().length);
}

getFieldworkPageNumbers(): number[] {
  const totalPages = this.getFieldworkTotalPages();
  const pages: number[] = [];
  
  let startPage = Math.max(1, this.fieldworkCurrentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return pages;
}

goToFieldworkPage(page: number): void {
  if (page >= 1 && page <= this.getFieldworkTotalPages()) {
    this.fieldworkCurrentPage = page;
  }
}

previousFieldworkPage(): void {
  if (this.fieldworkCurrentPage > 1) {
    this.fieldworkCurrentPage--;
  }
}

nextFieldworkPage(): void {
  if (this.fieldworkCurrentPage < this.getFieldworkTotalPages()) {
    this.fieldworkCurrentPage++;
  }
}

onFieldworkPageSizeChange(): void {
  this.fieldworkCurrentPage = 1;
}

sortFieldwork(field: string): void {
  if (this.fieldworkSortField === field) {
    this.fieldworkSortDirection = this.fieldworkSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.fieldworkSortField = field;
    this.fieldworkSortDirection = 'asc';
  }
  this.fieldworkCurrentPage = 1;
}

sortFieldworkReports(reports: FieldworkAudit[]): FieldworkAudit[] {
  return [...reports].sort((a, b) => {
    let aValue: any = a[this.fieldworkSortField as keyof FieldworkAudit];
    let bValue: any = b[this.fieldworkSortField as keyof FieldworkAudit];
    
    // Handle nested properties
    if (this.fieldworkSortField === 'findingsCount') {
      aValue = a.findingsCount || 0;
      bValue = b.findingsCount || 0;
    }
    
    // Handle string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';
    
    if (aValue < bValue) {
      return this.fieldworkSortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return this.fieldworkSortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

// Export functionality
exportFieldworkTable(): void {
  const reports = this.getFieldworkReportsWithFindings();
  const worksheet = XLSX.utils.json_to_sheet(
    reports.map(audit => ({
      'Audit Title': audit.title,
      'Department': audit.department,
      'Findings Count': audit.findingsCount,
      'Evidence Count': audit.evidenceCount,
      'Audit Status': this.getAuditStatusText(audit.status || ''),
      'Report Status': this.reportExists(audit) ? 'Generated' : 'Ready to Generate',
      'Has Findings': this.hasFindings(audit) ? 'Yes' : 'No'
    }))
  );
  const workbook = { Sheets: { 'Fieldwork Audits': worksheet }, SheetNames: ['Fieldwork Audits'] };
  XLSX.writeFile(workbook, 'Fieldwork_Audits_Ready_for_Reports.xlsx');
}

private updateReportStatus(report: MISReport, newStatus: 'under_review' | 'client_review' | 'revised' | 'finalized'): void {
  const statusFlow: { [key: string]: string[] } = {
    'under_review': ['client_review', 'revised', 'finalized'],
    'client_review': ['revised', 'finalized'],
    'revised': ['client_review', 'finalized'],
    'finalized': [] // Final state
  };

  const currentStatus = report.draftStatus || 'under_review';
  
  if (!statusFlow[currentStatus]?.includes(newStatus)) {
    Swal.fire('Error', `Invalid status transition from ${currentStatus} to ${newStatus}`, 'error');
    return;
  }

  report.draftStatus = newStatus;
  
  // Set timestamps
  if (newStatus === 'client_review') {
    report.sentToClientAt = new Date().toISOString();
    // Set management response due date (2 weeks from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    report.managementResponseDueDate = dueDate.toISOString();
    report.managementResponseStatus = 'pending';
  } else if (newStatus === 'finalized') {
    report.finalizedAt = new Date().toISOString();
  }
  
  this.updateReportDraftStatus(report);
}

getReportStatus(audit: FieldworkAudit): 'ready' | 'generated' | 'no_findings' | 'generating' {
  if (this.isReportInProgress(audit)) {
    return 'generating';
  }
  if (!this.hasFindings(audit)) {
    return 'no_findings';
  }
  if (this.reportExists(audit)) {
    return 'generated';
  }
  return 'ready';
}

getReportStatusText(audit: FieldworkAudit): string {
  const status = this.getReportStatus(audit);
  const statusMap = {
    'ready': 'Ready to Generate',
    'generated': 'Report Generated',
    'no_findings': 'No Findings',
    'generating': 'Generating...'
  };
  return statusMap[status];
}

getDraftStatus(audit: FieldworkAudit): string {
  const report = this.reports.find(r => 
    r.title === `Fieldwork Report - ${audit.title}` && 
    r.type === 'fieldwork'
  );
  return report?.draftStatus || '';
}

getDraftStatusText(audit: FieldworkAudit): string {
  const draftStatus = this.getDraftStatus(audit);
  const statusMap: { [key: string]: string } = {
    'under_review': 'Under Review',
    'client_review': 'With Client',
    'revised': 'Revised',
    'finalized': 'Finalized',
    '': 'Not Started'
  };
  return statusMap[draftStatus] || 'Draft';
}

getReportGeneratedDate(audit: FieldworkAudit): string {
  const report = this.reports.find(r => 
    r.title === `Fieldwork Report - ${audit.title}` && 
    r.type === 'fieldwork'
  );
  return report?.createdAt || '';
}

openReportManagementByAudit(audit: FieldworkAudit): void {
  const report = this.reports.find(r => 
    r.title === `Fieldwork Report - ${audit.title}` && 
    r.type === 'fieldwork'
  );
  
  if (report) {
    this.openReportManagement(report);
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Report Not Found',
      text: 'Could not find the generated report for this audit.',
      confirmButtonText: 'OK'
    });
  }
}

trackResponseDueDates(): void {
  this.reports.forEach(report => {
    if (report.draftStatus === 'client_review' && report.sentToClientAt) {
      const sentDate = new Date(report.sentToClientAt);
      const dueDate = new Date(sentDate.setDate(sentDate.getDate() + 14));
      
      if (new Date() > dueDate && report.managementResponseStatus !== 'submitted') {
        report.managementResponseStatus = 'overdue';
        this.updateReportDraftStatus(report);
      }
    }
  });
}

hasFindings(audit: FieldworkAudit): boolean {
  const findingsCount = audit.preClosing?.length || audit.findingsCount || 0;
  return findingsCount > 0;
}

getFieldworkReportsWithFindings(): FieldworkAudit[] {
  return this.fieldworkReports.filter(audit => this.hasFindings(audit));
}

openManagementResponseModal(report: MISReport): void {
  // console.log('🔍 DEBUG - Opening Management Response Modal');
  // console.log('Report:', report);
  // console.log('Fieldwork data:', report.fieldworkData);
  // console.log('Findings:', report.fieldworkData?.preClosing);
  
  this.selectedReport = report;
  
  if (!report.managementResponses && report.fieldworkData?.preClosing) {
    console.log('🔄 Initializing management responses from findings');
    report.managementResponses = report.fieldworkData.preClosing.map((finding: any, index: number) => ({
      findingId: finding.id || `finding-${index}`,
      findingTitle: finding.title || `Finding ${index + 1}`,
      response: '',
      actionPlan: '',
      responsiblePerson: '',
      targetDate: '',
      status: 'pending' as const
    }));
    console.log('✅ Created management responses:', report.managementResponses);
  } else {
    console.log('ℹ️ Management responses already exist:', report.managementResponses);
  }
  
  const modal = new bootstrap.Modal(document.getElementById('managementResponseModal')!);
  modal.show();
  
  console.log('🎯 Modal should be visible now');
}

getResponseDueDate(report: MISReport): Date | null {
  if (!report.sentToClientAt) return null;
  const dueDate = new Date(report.sentToClientAt);
  dueDate.setDate(dueDate.getDate() + 14);
  return dueDate;
}

isResponseOverdue(report: MISReport): boolean {
  const dueDate = this.getResponseDueDate(report);
  return dueDate ? new Date() > dueDate : false;
}

generateDraftFinalReport(report: MISReport): void {
  this.isLoading = true;

  Swal.fire({
    title: 'Generate Draft Final Report?',
    text: 'This will create a draft final version for client review',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Generate Draft Final'
  }).then((result) => {
    if (result.isConfirmed) {
      try {
        const doc = new jsPDF();
        
        // Draft Final Report Template
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 128);
        doc.text(`DRAFT FINAL AUDIT REPORT: ${report.title}`, 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Department: ${report.fieldworkData?.department || 'N/A'} | Draft Final Version | ${new Date().toLocaleDateString()}`, 14, 28);

        // Management response section
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text('MANAGEMENT RESPONSE REQUESTED', 14, 45);
        doc.setFontSize(10);
        doc.text('Please provide your formal response to the findings and recommendations below.', 14, 52);
        doc.text('Response due within two weeks of receipt.', 14, 59);

        let currentY = 70;

        // Findings with response sections
        if (report.fieldworkData?.preClosing) {
          report.fieldworkData.preClosing.forEach((finding: any, index: number) => {
            if (currentY > 250) {
              doc.addPage();
              currentY = 20;
            }

            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.text(`Finding ${index + 1}: ${finding.title || 'No Title'}`, 14, currentY);
            
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Severity: ${finding.severity || 'Unknown'} | Status: ${finding.status || 'Open'}`, 14, currentY + 6);
            
            if (finding.recommendation) {
              doc.text(`Recommendation: ${finding.recommendation}`, 14, currentY + 12);
            }
            
            // Response section placeholder
            doc.setTextColor(150);
            doc.text('Management Response: ________________________________', 14, currentY + 20);
            doc.text('Action Plan: ________________________________________', 14, currentY + 26);
            doc.text('Responsible: ________________ Target Date: __________', 14, currentY + 32);
            
            currentY += 45;
          });
        }

        const pdfBase64 = doc.output('datauristring');

        // Update the report
        report.fileUrl = pdfBase64;
        report.title = `Draft Final - ${report.title.replace('Draft Final - ', '')}`;
        this.updateReportStatus(report, 'client_review');
        
      } catch (error) {
        console.error('Error generating draft final report:', error);
        Swal.fire('Error!', 'Failed to generate draft final report', 'error');
      } finally {
        this.isLoading = false;
      }
    }
  });
}

distributeFinalReport(report: MISReport): void {
  Swal.fire({
    title: 'Distribute Final Report?',
    html: `This will distribute the finalized report to:<br>
           • Audit Committee<br>
           • Key Stakeholders<br>
           • Client Department`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Distribute',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      report.distributedAt = new Date().toISOString();
      report.distributedTo = [
        'Audit Committee',
        'Chief Executive Officer', 
        'Department Head',
        'Compliance Officer'
      ];
      
      this.updateReportDraftStatus(report);
      
      Swal.fire({
        title: 'Report Distributed!',
        html: `Final report has been sent to:<br>${report.distributedTo.join('<br>')}`,
        icon: 'success'
      });
    }
  });
}

// submitManagementResponses(): void {
//   if (!this.selectedReport?.managementResponses) return;

//   const incomplete = this.selectedReport.managementResponses.some(response => 
//     !response.response.trim() || !response.actionPlan.trim() || !response.responsiblePerson.trim()
//   );

//   if (incomplete) {
//     Swal.fire('Error', 'Please fill in all management responses, action plans, and responsible persons', 'error');
//     return;
//   }

//   this.selectedReport.managementResponseSubmittedAt = new Date().toISOString();
//   this.selectedReport.managementResponseStatus = 'submitted';
  
//   this.updateReportDraftStatus(this.selectedReport);
  
//   const modal = bootstrap.Modal.getInstance(document.getElementById('managementResponseModal')!);
//   modal?.hide();
  
//   Swal.fire('Success!', 'Management responses submitted successfully', 'success');
// }

openCommentModal(report: MISReport): void {
  this.selectedReportForComment = report;
  this.selectedCommentType = 'comment';
  this.newCommentText = '';
  
  const modal = new bootstrap.Modal(document.getElementById('commentModal')!);
  modal.show();
  
  setTimeout(() => {
    const textarea = document.getElementById('commentTextarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  }, 100);
}

submitComment(): void {
  if (!this.selectedReportForComment || !this.newCommentText?.trim()) {
    Swal.fire('Error', 'Please enter your comment text', 'error');
    return;
  }

  if (this.newCommentText.length < 5) {
    Swal.fire('Error', 'Comment must be at least 5 characters long', 'error');
    return;
  }

  const newComment = {
    text: this.newCommentText.trim(),
    author: 'Client',
    date: new Date().toISOString(),
    type: this.selectedCommentType
  };

  if (!this.selectedReportForComment.clientComments) {
    this.selectedReportForComment.clientComments = [];
  }
  this.selectedReportForComment.clientComments.push(newComment);

  if (this.selectedCommentType === 'revision_request') {
    this.selectedReportForComment.draftStatus = 'revised';
    this.selectedReportForComment.revisionCount = (this.selectedReportForComment.revisionCount || 0) + 1;
  }

  this.updateReportDraftStatus(this.selectedReportForComment);
  const modal = bootstrap.Modal.getInstance(document.getElementById('commentModal')!);
  modal?.hide();

  this.newCommentText = '';
  this.selectedCommentType = 'comment';
  
  Swal.fire(
    'Success!', 
    `${this.getCommentTypeText(this.selectedCommentType)} has been added successfully.`,
    'success'
  );
}

onCommentTypeChange(): void {
  const textarea = document.getElementById('commentTextarea') as HTMLTextAreaElement;
  
  if (textarea) {
    const placeholders: { [key: string]: string } = {
      'comment': 'Share your feedback or observations about this report...',
      'question': 'What would you like to ask or clarify about this report?',
      'revision_request': 'What specific changes or revisions would you like to request?'
    };
    
    textarea.placeholder = placeholders[this.selectedCommentType as string] || 'Type your message here...';
  }
  
  setTimeout(() => {
    if (textarea) {
      textarea.focus();
    }
  }, 50);
 
  // console.log(`Comment type changed to: ${this.selectedCommentType}`);
}

getFieldError(fieldName: string): string {
    const field = this.commentForm.get(fieldName);
    if (!field || !field.errors) return '';
    
    if (field.errors['required']) {
      return 'This field is required';
    }
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    }
    if (field.errors['maxlength']) {
      return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed`;
    }
    return '';
  }

  get isFormValid(): boolean {
    return this.commentForm.valid;
  }

  get f() {
    return this.commentForm.controls;
  }

  get commentTextHasError(): boolean {
    const control = this.commentForm.get('commentText');
    return control ? (control.invalid && (control.dirty || control.touched)) : false;
  }

  get commentTextErrorMessage(): string {
    const control = this.commentForm.get('commentText');
    if (control?.errors?.['required']) {
      return 'Comment text is required';
    }
    if (control?.errors?.['minlength']) {
      return `Minimum ${control.errors?.['minlength'].requiredLength} characters required`;
    }
    if (control?.errors?.['maxlength']) {
      return `Maximum ${control.errors?.['maxlength'].requiredLength} characters allowed`;
    }
    return '';
  }

  private calculateKPIsFromWorkflows(): void {
    const workflowsWithFieldwork = this.fieldworkReports.filter(wf => wf.fieldwork);

    let totalFindings = 0;
    let criticalFindings = 0;
    let highFindings = 0;
    let mediumFindings = 0;
    let lowFindings = 0;
    
    workflowsWithFieldwork.forEach(workflow => {
      if (workflow.fieldwork?.preClosing) {
        totalFindings += workflow.fieldwork.preClosing.length;
        
        workflow.fieldwork.preClosing.forEach((finding: any) => {
          switch (finding.severity?.toLowerCase()) {
            case 'critical':
              criticalFindings++;
              break;
            case 'high':
              highFindings++;
              break;
            case 'medium':
              mediumFindings++;
              break;
            case 'low':
              lowFindings++;
              break;
          }
        });
      }
    });

    this.kpis.fieldworkReady = workflowsWithFieldwork.length;
    this.kpis.criticalFindings = criticalFindings + highFindings; 
  }

  generateQuickSummary(): void {
     const summaryTitle = `Fieldwork Quick Summary - ${new Date().toISOString().slice(0, 10)}`;
  
  // Check if quick summary already exists for today
    const existingSummary = this.reports.find(r => 
      r.title.includes('Fieldwork Quick Summary') && 
      r.type === 'auto-generated' &&
      r.createdAt.includes(new Date().toISOString().slice(0, 10))
    );

    if (existingSummary) {
      Swal.fire({
        icon: 'info',
        title: 'Quick Summary Already Exists',
        text: 'A quick summary report for today already exists.',
        confirmButtonText: 'OK'
      });
      return;
    }
    
    this.isLoading = true;
    
    Swal.fire({
      title: 'Generating Quick Summary...',
      text: 'Creating instant overview report',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {

      const summaryData = this.calculateQuickSummaryData();
      this.generateQuickSummaryPDF(summaryData);
      
    } catch (error) {
      console.error('Error generating quick summary:', error);
      Swal.fire('Error!', 'Failed to generate quick summary', 'error');
      this.isLoading = false;
    }
  }

private initializeCommentForm(): void {
  this.commentForm = this.fb.group({
    commentType: ['comment', Validators.required],
    commentText: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(1000)]]
  });

  // this.commentForm.get('commentText')?.valueChanges.subscribe(() => {
  //   // This will trigger change detection for the character count
  // });
}

closeCommentModal(): void {
  this.showCommentModal = false;
  this.selectedReportForComment = undefined;
}

onCommentModalBackdropClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;
  if (target.classList.contains('modal')) {
    this.closeCommentModal();
  }
}

getCommentTypeText(type: string): string {
  const typeMap: { [key: string]: string } = {
    'comment': 'Comment',
    'question': 'Question',
    'revision_request': 'Revision Request'
  };
  return typeMap[type] || 'Comment';
}

private async generateSingleFieldworkReport(audit: FieldworkAudit): Promise<boolean> {
  const existingReport = this.reports.find(r => 
    r.title === `Fieldwork Report - ${audit.title}` && 
    r.type === 'fieldwork'
  );

  if (existingReport) {
    console.log(`Report already exists for ${audit.title}, skipping`);
    return true; // This might be skipping actual generation
  }

  return new Promise((resolve) => {
    try {
      this.generateFieldworkReportForBatch(audit).then(() => {
        resolve(true);
      }).catch((error) => {
        console.error(`Failed to generate report for ${audit.title}:`, error);
        resolve(false); // This swallows the error!
      });
    } catch (error) {
      console.error(`Failed to generate report for ${audit.title}:`, error);
      resolve(false); // This also swallows the error!
    }
  });
}

private calculateQuickSummaryData(): any {
    const workflowsWithFieldwork = this.fieldworkReports.filter(wf => wf.fieldwork);
    const allFindings = this.getAllFindingsFromWorkflows();
    
    return {
      totalWorkflows: this.fieldworkReports.length,
      workflowsWithFieldwork: workflowsWithFieldwork.length,
      totalFindings: allFindings.total,
      criticalFindings: allFindings.critical,
      highFindings: allFindings.high,
      mediumFindings: allFindings.medium,
      lowFindings: allFindings.low,
      departments: this.getDepartmentsFromWorkflows(),
      statusDistribution: this.getStatusDistribution()
    };
  }

private batchGenerateFieldworkReports(): void {
  this.isLoading = true;
  let completed = 0;
  let successful = 0;
  const total = this.fieldworkReports.length;

  console.log(`🚀 Starting batch generation for ${total} reports`);

  Swal.fire({
    title: 'Generating Reports...',
    html: `Progress: <b>0/${total}</b><br>Successful: <b>0</b>`,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
      
      // Process all reports
      const generationPromises = this.fieldworkReports.map((audit, index) => {
        return new Promise<void>((resolve) => {
          setTimeout(async () => {
            try {
              const success = await this.generateSingleFieldworkReport(audit);
              completed++;
              successful += success ? 1 : 0;
              
              if (Swal.isVisible()) {
                Swal.getHtmlContainer()!.innerHTML = 
                  `Progress: <b>${completed}/${total}</b><br>Successful: <b>${successful}</b>`;
              }
              
              resolve();
            } catch (error) {
              completed++;
              console.error(`Error in batch generation for ${audit.title}:`, error);
              resolve();
            }
          }, index * 500); // Reduced delay
        });
      });

      // Wait for all to complete
      Promise.all(generationPromises).then(() => {
        console.log(`🎉 Batch generation completed: ${successful}/${total} successful`);
        
        // Force refresh the reports list
        this.loadReports();
        
        Swal.fire({
          title: 'Generation Complete!',
          html: `Successfully generated <b>${successful}/${total}</b> fieldwork reports!`,
          icon: successful === total ? 'success' : successful > 0 ? 'warning' : 'error',
          confirmButtonText: 'OK'
        });
        
        this.isLoading = false;
      });
    }
  });
}

private getAllFindingsFromWorkflows(): any {
    const findings = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    
    this.fieldworkReports.forEach(workflow => {
      if (workflow.fieldwork?.preClosing) {
        workflow.fieldwork.preClosing.forEach((finding: any) => {
          findings.total++;
          switch (finding.severity?.toLowerCase()) {
            case 'critical': findings.critical++; break;
            case 'high': findings.high++; break;
            case 'medium': findings.medium++; break;
            case 'low': findings.low++; break;
          }
        });
      }
    });
    
    return findings;
  }

private getDepartmentsFromWorkflows(): string[] {
    const departments = new Set<string>();
    this.fieldworkReports.forEach(workflow => {
      if (workflow.department) {
        departments.add(workflow.department);
      }
    });
    return Array.from(departments);
  }

  private getStatusDistribution(): any {
    const statusCount: any = {};
    this.fieldworkReports.forEach(workflow => {
      const status = workflow.status || 'Unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });
    return statusCount;
  }

private generateQuickSummaryPDF(summaryData: any): void {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 128);
      doc.text('FIELDWORK QUICK SUMMARY REPORT', 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Source: Actual Fieldwork Data`, 14, 28);

      let currentY = 40;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('OVERVIEW', 14, currentY);

      autoTable(doc, {
        startY: currentY + 10,
        head: [['Metric', 'Count']],
        body: [
          ['Total Workflows', summaryData.totalWorkflows],
          ['Workflows with Fieldwork', summaryData.workflowsWithFieldwork],
          ['Departments Involved', summaryData.departments.length],
          ['Total Findings', summaryData.totalFindings]
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });

      // Update Y position
      currentY = (doc as any).lastAutoTable?.finalY + 15 || 70;

      // Findings by Severity
      doc.setFontSize(14);
      doc.text('FINDINGS BY SEVERITY', 14, currentY);

      autoTable(doc, {
        startY: currentY + 10,
        head: [['Severity', 'Count', 'Percentage']],
        body: [
          ['Critical', summaryData.criticalFindings, this.getProgressPercentage(summaryData.criticalFindings, summaryData.totalFindings) + '%'],
          ['High', summaryData.highFindings, this.getProgressPercentage(summaryData.highFindings, summaryData.totalFindings) + '%'],
          ['Medium', summaryData.mediumFindings, this.getProgressPercentage(summaryData.mediumFindings, summaryData.totalFindings) + '%'],
          ['Low', summaryData.lowFindings, this.getProgressPercentage(summaryData.lowFindings, summaryData.totalFindings) + '%']
        ],
        theme: 'grid',
        headStyles: { fillColor: [52, 152, 219] }
      });

      // Update Y position
      currentY = (doc as any).lastAutoTable?.finalY + 15 || 100;

      // Workflow Status
      doc.setFontSize(14);
      doc.text('WORKFLOW STATUS DISTRIBUTION', 14, currentY);

      const statusBody = Object.entries(summaryData.statusDistribution).map(([status, count]) => 
        [status, String(count)]
      );

      autoTable(doc, {
        startY: currentY + 10,
        head: [['Status', 'Count']],
        body: statusBody,
        theme: 'grid',
        headStyles: { fillColor: [155, 89, 182] }
      });

      // Convert to base64 and save
      const pdfBase64 = doc.output('datauristring');

      const payload: MISReport = {
        title: `Fieldwork Quick Summary - ${new Date().toISOString().slice(0, 10)}`,
        type: 'auto-generated',
        source: 'fieldwork',
        createdAt: new Date().toISOString(),
        uploadedBy: 'System',
        fileType: 'application/pdf',
        fileUrl: pdfBase64,
        description: 'Quick summary generated from actual fieldwork data',
        findingsCount: summaryData.totalFindings,
        fieldworkData: summaryData,
        filePath: undefined,
        draftStatus: 'under_review',
        clientComments: [],
        revisionCount: 0
      };

      this.saveReportAndRefresh(payload, 'Quick summary generated successfully from fieldwork data!');
      
    } catch (error) {
      console.error('Error generating quick summary PDF:', error);
      Swal.fire('Error!', 'Failed to generate quick summary PDF', 'error');
      this.isLoading = false;
    }
  }

  generateAnalyticsReport(): void {
    this.isLoading = true;
    
    Swal.fire({
      title: 'Creating Analytics Report...',
      text: 'Generating detailed analytics from fieldwork data',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const analyticsData = this.calculateAnalyticsData();
      this.generateAnalyticsPDF(analyticsData);
      
    } catch (error) {
      console.error('Failed to generate analytics report:', error);
      Swal.fire('Error!', 'Failed to generate analytics report', 'error');
      this.isLoading = false;
    }
  }

  private calculateAnalyticsData(): any {
    const workflowsWithFieldwork = this.fieldworkReports.filter(wf => wf.fieldwork);
    const allFindings = this.getAllFindingsFromWorkflows();
    
    const findingsByDept: any = {};
    const workflowsByDept: any = {};
    
    this.fieldworkReports.forEach(workflow => {
      const dept = workflow.department || 'Unknown';
      
      // Count workflows by department
      workflowsByDept[dept] = (workflowsByDept[dept] || 0) + 1;
      
      // Count findings by department
      if (workflow.fieldwork?.preClosing) {
        findingsByDept[dept] = (findingsByDept[dept] || 0) + workflow.fieldwork.preClosing.length;
      }
    });

    // Calculate findings by status
    const findingsByStatus: any = {};
    this.fieldworkReports.forEach(workflow => {
      if (workflow.fieldwork?.preClosing) {
        workflow.fieldwork.preClosing.forEach((finding: any) => {
          const status = finding.status || 'Unknown';
          findingsByStatus[status] = (findingsByStatus[status] || 0) + 1;
        });
      }
    });

    return {
      totalWorkflows: this.fieldworkReports.length,
      workflowsWithFindings: workflowsWithFieldwork.length,
      findingsBySeverity: allFindings,
      findingsByDepartment: findingsByDept,
      workflowsByDepartment: workflowsByDept,
      findingsByStatus: findingsByStatus,
      departments: Array.from(new Set(this.fieldworkReports.map(wf => wf.department).filter(Boolean)))
    };
  }

createAutoReport() {
  const autoReportTitle = `Auto Report ${new Date().toISOString().slice(0, 10)}`;
  
  const existingAutoReport = this.reports.find(r => 
    r.title.includes('Auto Report') && 
    r.type === 'auto-generated' &&
    r.createdAt.includes(new Date().toISOString().slice(0, 10))
  );

  if (existingAutoReport) {
    Swal.fire({
      icon: 'info',
      title: 'Auto Report Already Exists',
      text: 'An auto report for today already exists.',
      confirmButtonText: 'OK'
    });
    return;
  }

  this.isLoading = true;

  Swal.fire({
    title: 'Generating Auto Report...',
    text: 'Please wait while the report is being generated.',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  this.mis.generateSummary()
    .pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: summary => {
        try {
          const doc = new jsPDF();

          doc.setFontSize(16);
          doc.text('Auto Report', 14, 20);

          // Quick Stats
          doc.setFontSize(12);
          doc.text('Quick Stats', 14, 35);
          const quickStatsTable = autoTable(doc, {
            startY: 40,
            head: [['Total Audits', 'Completed', 'In Progress']],
            body: [[summary.totalAudits, summary.completedAudits, summary.inProgress]]
          });

          // Audits by Department
          const auditsByDeptTable = autoTable(doc, {
            startY: (quickStatsTable as any)?.finalY ? (quickStatsTable as any).finalY + 15 : 55,
            head: [['Department', 'Count']],
            body: Object.entries(summary.auditsByDept)
          });

          // Findings by Severity
          const findingsSeverityTable = autoTable(doc, {
            startY: (auditsByDeptTable as any)?.finalY ? (auditsByDeptTable as any).finalY + 15 : 70,
            head: [['Severity', 'Count']],
            body: Object.entries(summary.findingsSeverity)
          });

          // Audits Over Time
          autoTable(doc, {
            startY: (findingsSeverityTable as any)?.finalY ? (findingsSeverityTable as any).finalY + 15 : 85,
            head: [['Month', 'Count']],
            body: Object.entries(summary.auditsOverTime)
          });

          const pdfBase64 = doc.output('datauristring');

          const payload: MISReport = {
            title: autoReportTitle,
            type: 'auto-generated',
            createdAt: new Date().toISOString(),
            uploadedBy: 'System',
            fileType: 'application/pdf',
            fileUrl: pdfBase64,
            description: 'Auto-generated audit summary',
            summary,
            filePath: undefined,
            draftStatus: 'under_review',
            clientComments: [],
            revisionCount: 0,
            source: 'system'
          };

          this.mis.createReport(payload).subscribe({
            next: () => {
              this.load();
              Swal.fire('Success ✅', 'Auto report generated and saved!', 'success');
            },
            error: () => {
              Swal.fire('Error ❌', 'Failed to save the auto report.', 'error');
            }
          });

        } catch (err) {
          console.error(err);
          Swal.fire('Error ❌', 'Could not generate the report.', 'error');
        }
      },
      error: () => {
        Swal.fire('Error ❌', 'Failed to generate auto report summary.', 'error');
      }
    });
}

reportExists(audit: FieldworkAudit): boolean {
  const reportTitle = `Fieldwork Report - ${audit.title}`;
  return this.reports.some(report => 
    report.title === reportTitle && 
    report.type === 'fieldwork'
  );
}

getAuditStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'completed': 'Completed',
    'finalized': 'Finalized',
    'in_progress': 'In Progress',
    'fieldwork': 'Fieldwork',
    'planned': 'Planned',
    'scheduled': 'Scheduled',
    'review': 'Under Review',
    'analysis': 'Analysis',
    'draft': 'Draft',
    'unknown': 'Unknown'
  };
  return statusMap[status || 'unknown'] || 'Unknown';
}

isReportInProgress(audit: FieldworkAudit): boolean {
  // You can track in-progress reports in a separate array
  return this.generatingReports?.includes(audit.id) || false;
}

getReadyToGenerateCount(): number {
  return this.getFieldworkReportsWithFindings().filter(audit => 
    this.hasFindings(audit) && !this.reportExists(audit)
  ).length;
}

previewAuditFindings(audit: FieldworkAudit): void {
  const findings = audit.preClosing || [];
  
  let findingsHtml = '<div class="text-start">';
  
  if (findings.length === 0) {
    findingsHtml += '<p class="text-muted">No findings available.</p>';
  } else {
    findings.forEach((finding: any, index: number) => {
      findingsHtml += `
        <div class="border-bottom pb-2 mb-2">
          <div class="d-flex justify-content-between align-items-start">
            <strong>Finding ${index + 1}: ${finding.title || 'Untitled'}</strong>
            <span class="badge ms-2" style="
              ${finding.severity === 'Critical' ? 'background-color: #dc3545;' : ''}
              ${finding.severity === 'High' ? 'background-color: #fd7e14;' : ''}
              ${finding.severity === 'Medium' ? 'background-color: #ffc107; color: #000;' : ''}
              ${finding.severity === 'Low' ? 'background-color: #28a745;' : ''}
            ">${finding.severity || 'Unknown'}</span>
          </div>
          <p class="mb-1 small">${finding.description || 'No description'}</p>
          <div class="d-flex justify-content-between small text-muted">
            <span>Status: ${finding.status || 'Open'}</span>
            <span>${finding.recommendation ? 'Has recommendation' : 'No recommendation'}</span>
          </div>
        </div>
      `;
    });
  }
  findingsHtml += '</div>';

  Swal.fire({
    title: `Findings: ${audit.title}`,
    html: findingsHtml,
    confirmButtonText: 'Close',
    width: '700px'
  });
}

private generateAnalyticsPDF(analyticsData: any): void {
  try {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 128);
    doc.text('FIELDWORK ANALYTICS REPORT', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Source: Actual Fieldwork Data`, 14, 28);

    let currentY = 40;

    // Executive Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('EXECUTIVE SUMMARY', 14, currentY);

    autoTable(doc, {
      startY: currentY + 10,
      head: [['Category', 'Count']],
      body: [
        ['Total Workflows', analyticsData.totalWorkflows],
        ['Workflows with Findings', analyticsData.workflowsWithFindings],
        ['Total Departments', analyticsData.departments.length],
        ['Total Findings', analyticsData.findingsBySeverity.total]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    currentY = (doc as any).lastAutoTable?.finalY + 20 || 70;

    // Findings by Department
    doc.setFontSize(14);
    doc.text('FINDINGS BY DEPARTMENT', 14, currentY);

    const deptBody = Object.entries(analyticsData.findingsByDepartment).map(([dept, count]) => 
      [dept, (count as number).toString(), analyticsData.workflowsByDepartment[dept]?.toString() || '0']
    );

    autoTable(doc, {
      startY: currentY + 10,
      head: [['Department', 'Findings', 'Workflows']],
      body: deptBody,
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] }
    });

    currentY = (doc as any).lastAutoTable?.finalY + 20 || 120;

    // Findings by Status
    doc.setFontSize(14);
    doc.text('FINDINGS BY STATUS', 14, currentY);

    const statusBody = Object.entries(analyticsData.findingsByStatus).map(([status, count]) => {
      const numCount = typeof count === 'number' ? count : Number(count);
      return [status, String(numCount), this.getProgressPercentage(numCount, analyticsData.findingsBySeverity.total) + '%'];
    });

    autoTable(doc, {
      startY: currentY + 10,
      head: [['Status', 'Count', 'Percentage']],
      body: statusBody,
      theme: 'grid',
      headStyles: { fillColor: [155, 89, 182] }
    });

    const pdfBase64 = doc.output('datauristring');

    const payload: MISReport = {
      title: `Fieldwork Analytics - ${new Date().toISOString().slice(0, 10)}`,
      type: 'auto-generated',
      source: 'fieldwork',
      createdAt: new Date().toISOString(),
      uploadedBy: 'System',
      fileType: 'application/pdf',
      fileUrl: pdfBase64,
      description: 'Detailed analytics generated from actual fieldwork data',
      findingsCount: analyticsData.findingsBySeverity.total,
      fieldworkData: analyticsData,
      filePath: undefined,

      draftStatus: 'under_review',
      clientComments: [],
      revisionCount: 0
    };

    this.saveReportAndRefresh(payload, 'Analytics report generated successfully from fieldwork data!');
    
  } catch (error) {
    console.error('Error generating analytics PDF:', error);
    Swal.fire('Error!', 'Failed to generate analytics PDF', 'error');
    this.isLoading = false;
  }
}

  loadFieldworkData(): void {
    this.http.get<any[]>(`${this.apiUrl}/workflows`).subscribe({
      next: (workflows) => {
        if (!workflows) {
          this.fieldworkReports = [];
          return;
        }
        
        this.fieldworkReports = workflows
          .filter(wf => wf?.fieldwork?.preClosing?.length > 0)
          .map(wf => ({
            id: wf.id || 'unknown',
            title: wf.title || 'Untitled Workflow',
            department: wf.department || 'No Department',
            status: wf.status || 'Unknown',
            findingsCount: wf.fieldwork?.preClosing?.length || 0,
            evidenceCount: wf.fieldwork?.evidence?.length || 0,
            fieldwork: wf.fieldwork,
            preClosing: wf.fieldwork?.preClosing || []
          }));
      
        this.calculateKPIsFromWorkflows();
      },
      error: (error) => {
        console.error('Failed to load fieldwork data:', error);
        this.fieldworkReports = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

selectedReport?: MISReport;
previewContent: string | null = null;

  loadReports(): void {
    this.isLoading = true;
    this.globalService.listReports()
      .pipe(finalize(() => this.isLoading = false), takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => {
          this.reports = reports;
          this.filteredReports = [...this.reports];
          this.updateKPIs();
        },
        // error: () => this.swal.error('Failed to load reports')
      });
  }

generateAllFieldworkReports(): void {
  if (this.fieldworkReports.length === 0) {
    Swal.fire('Info', 'No fieldwork reports available to generate', 'info');
    return;
  }

  Swal.fire({
    title: 'Generate All Fieldwork Reports?',
    text: `This will generate ${this.fieldworkReports.length} individual fieldwork reports`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, generate all!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      this.batchGenerateFieldworkReports();
    }
  });
}

private async generateFieldworkReportForBatch(audit: FieldworkAudit): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      
      // Report Header
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 128);
      doc.text(`AUDIT REPORT: ${audit.title}`, 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Department: ${audit.department} | Generated: ${new Date().toLocaleDateString()}`, 14, 28);

      // Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('EXECUTIVE SUMMARY', 14, 45);

      let startY = 55;

      // Key Findings Summary
      autoTable(doc, {
        startY: startY,
        head: [['Severity', 'Count']],
        body: this.getFindingsBySeverity(audit.preClosing),
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] }
      });

      let currentY = 70;
      if ((doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) {
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }

      // Detailed Findings
      doc.setFontSize(14);
      doc.text('DETAILED FINDINGS', 14, currentY);

      const detailedFindings = (audit.preClosing || []).map((f: any) => [
        f.title || 'No title',
        f.severity || 'Unknown',
        f.status || 'Open',
        f.recommendation || 'No recommendation'
      ]);

      autoTable(doc, {
        startY: currentY + 10,
        head: [['Finding', 'Severity', 'Status', 'Recommendation']],
        body: detailedFindings,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 152, 219] }
      });

      // Convert to base64
      const pdfBase64 = doc.output('datauristring');

      // Create report payload
      const payload: MISReport = {
        title: `Fieldwork Report - ${audit.title}`,
        type: 'fieldwork',
        source: 'fieldwork',
        createdAt: new Date().toISOString(),
        uploadedBy: 'System',
        fileType: 'application/pdf',
        fileUrl: pdfBase64,
        description: `Fieldwork report generated from ${audit.title}`,
        findingsCount: audit.findingsCount,
        evidenceCount: audit.evidenceCount,
        fieldworkData: audit.fieldwork,
        draftStatus: 'under_review',
        clientComments: [],
        revisionCount: 0,
        sentToClientAt: undefined,
        finalizedAt: undefined
      };

      this.globalService.createReport(payload).subscribe({
        next: () => {
          resolve();
        },
        error: (error) => {
          console.error(`Failed to save report for ${audit.title}:`, error);
          reject(error);
        }
      });

    } catch (error) {
      console.error(`Error generating report for ${audit.title}:`, error);
      reject(error);
    }
  });
}


getTotalPages(): number {
  return Math.ceil(this.filteredReports.length / this.pageSize);
}

getStartIndex(): number {
  return (this.currentPage - 1) * this.pageSize;
}

getEndIndex(): number {
  return Math.min(this.currentPage * this.pageSize, this.filteredReports.length);
}

getPageNumbers(): number[] {
  const totalPages = this.getTotalPages();
  const pages: number[] = [];
  
  let startPage = Math.max(1, this.currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  return pages;
}

goToPage(page: number): void {
  if (page >= 1 && page <= this.getTotalPages()) {
    this.currentPage = page;
  }
}

previousPage(): void {
  if (this.currentPage > 1) {
    this.currentPage--;
  }
}

nextPage(): void {
  if (this.currentPage < this.getTotalPages()) {
    this.currentPage++;
  }
}

onPageSizeChange(): void {
  this.currentPage = 1; 
}

applyFilter(): void {
  this.filteredReports = this.reports.filter(r => {
    const matchesTitle = this.filterTitle
      ? r.title.toLowerCase().includes(this.filterTitle.toLowerCase())
      : true;

    const matchesType = this.filterType
      ? r.type === this.filterType
      : true;

    const matchesSource = this.filterSource
      ? r.source === this.filterSource
      : true;

    const matchesStatus = this.filterStatus
      ? this.matchesStatusFilter(r, this.filterStatus)
      : true;

    const matchesDate = this.filterDate
      ? new Date(r.createdAt) >= new Date(this.filterDate)
      : true;

    return matchesTitle && matchesType && matchesSource && matchesStatus && matchesDate;
  });

  this.currentPage = 1;
}

clearFilters() {
  this.filterTitle = '';
  this.filterType = '';
  this.filterSource = '';
  this.filterStatus = '';
  this.filterDate = '';
  this.filteredReports = [...this.reports];
  this.currentPage = 1;
}

exportAllReports(): void {
  this.exportAsExcel();
}

getProgressPercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

getOverallProgress(): number {
  const severityCount = this.getFindingsBySeverityLevel();
  const totalCriticalHigh = severityCount.critical + severityCount.high;
  const addressedCriticalHigh = this.getAddressedCriticalFindings();
  
  const scores = [
    this.getProgressPercentage(this.kpis.auto, this.kpis.total),
    this.getProgressPercentage(this.kpis.fieldworkReady, this.getTotalFieldworkOpportunities()),
    totalCriticalHigh > 0 ? this.getProgressPercentage(addressedCriticalHigh, totalCriticalHigh) : 0,
    this.getProgressPercentage(this.getCompletedReports(), this.kpis.total)
  ];

  const validScores = scores.filter(score => score > 0);
  return validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
}

getTotalFieldworkOpportunities(): number {
  return this.fieldworkReports.filter(wf => wf.fieldwork).length;
}

getCompletedReports(): number {
  return this.reports.filter(r => 
    r.type === 'auto-generated' || r.type === 'fieldwork'
  ).length;
}

getPendingReports(): number {
  return this.reports.filter(r => r.type === 'uploaded').length;
}

getDraftsByStatus(status: string): MISReport[] {
  return this.getDraftReports().filter(draft => draft.draftStatus === status);
}

viewComments(draft: MISReport): void {
  const comments = draft.clientComments || [];
  let commentsHtml = '<div class="text-start">';
  
  if (comments.length === 0) {
    commentsHtml += '<p class="text-muted">No comments yet.</p>';
  } else {
    comments.forEach((comment: any) => {
      commentsHtml += `
        <div class="border-bottom pb-2 mb-2">
          <div class="d-flex justify-content-between">
            <strong>${comment.author || 'Client'}</strong>
            <small class="text-muted">${comment.date || 'Recently'}</small>
          </div>
          <p class="mb-1">${comment.text}</p>
          ${comment.type ? `<span class="badge bg-${comment.type === 'question' ? 'info' : 'warning'}">${comment.type}</span>` : ''}
        </div>
      `;
    });
  }
  commentsHtml += '</div>';

  Swal.fire({
    title: 'Client Comments',
    html: commentsHtml,
    confirmButtonText: 'Close',
    width: '600px'
  });
}

previewDraftReport(draft: MISReport): void {
  this.selectedReport = draft;
  this.openPreviewModal(draft);
}


getDraftReports(): MISReport[] {
  return this.reports.filter(report => 
    report.type === 'fieldwork' || report.type === 'auto-generated'
  ).map(report => ({
    ...report,
    draftStatus: report.draftStatus || 'under_review',
    clientComments: report.clientComments || [],
    revisionCount: report.revisionCount || 0
  }));
}

filterStatus = '';

private matchesStatusFilter(report: MISReport, status: string): boolean {
  if (status === 'draft') {
    return this.isDraftReport(report) && report.draftStatus !== 'finalized';
  }
  return report.draftStatus === status;
}

debugReport(report: MISReport): void {
  console.log('Report debug:', {
    title: report.title,
    type: report.type,
    draftStatus: report.draftStatus,
    clientComments: report.clientComments,
    revisionCount: report.revisionCount,
    isDraftReport: this.isDraftReport(report)
  });
}

getAddressedCriticalFindings(): number {
  let addressedCount = 0;
  
  this.fieldworkReports.forEach(workflow => {
    if (workflow.fieldwork?.preClosing) {
      addressedCount += workflow.fieldwork.preClosing.filter((f: any) => 
        (f.severity === 'Critical' || f.severity === 'High') && 
        (f.status === 'Resolved' || f.status === 'Closed' || f.status === 'Implemented' || f.status === 'Reviewed')
      ).length;
    }
  });
  
  return addressedCount;
}

getFindingsDistribution(): any {
  const severityCount = this.getFindingsBySeverityLevel();
  const totalFindings = this.getTotalFindingsCount();
  
  return {
    critical: severityCount.critical,
    high: severityCount.high,
    medium: severityCount.medium,
    low: severityCount.low,
    total: totalFindings,
    criticalPercentage: totalFindings > 0 ? Math.round((severityCount.critical / totalFindings) * 100) : 0,
    highPercentage: totalFindings > 0 ? Math.round((severityCount.high / totalFindings) * 100) : 0
  };
}

getFindingsBySeverityLevel(): { low: number, medium: number, high: number, critical: number } {
  const severityCount = { low: 0, medium: 0, high: 0, critical: 0 };
  
  this.fieldworkReports.forEach(workflow => {
    if (workflow.fieldwork?.preClosing) {
      workflow.fieldwork.preClosing.forEach((finding: any) => {
        switch (finding.severity?.toLowerCase()) {
          case 'critical':
            severityCount.critical++;
            break;
          case 'high':
            severityCount.high++;
            break;
          case 'medium':
            severityCount.medium++;
            break;
          case 'low':
            severityCount.low++;
            break;
          default:
            severityCount.medium++;
            break;
        }
      });
    }
  });
  
  return severityCount;
}

getTotalFindingsCount(): number {
  let total = 0;
  this.fieldworkReports.forEach(workflow => {
    if (workflow.fieldwork?.preClosing) {
      total += workflow.fieldwork.preClosing.length;
    }
  });
  return total;
}

getCriticalFindingsProgressClass(): string {
  const severityCount = this.getFindingsBySeverityLevel();
  const totalCriticalHigh = severityCount.critical + severityCount.high;
  const progress = totalCriticalHigh > 0 ? 
    this.getProgressPercentage(this.getAddressedCriticalFindings(), totalCriticalHigh) : 0;
    
  if (progress >= 70) return 'bg-success';
  if (progress >= 40) return 'bg-warning';
  return 'bg-danger';
}

private updateKPIs(): void {
  this.kpis.total = this.reports.length;
  this.kpis.uploaded = this.reports.filter(r => r.type === 'uploaded').length;
  this.kpis.auto = this.reports.filter(r => r.type === 'auto-generated').length;
  
  this.kpis.fieldworkReady = this.fieldworkReports.filter(wf => wf.fieldwork?.preClosing?.length > 0).length;
  
  const severityCount = this.getFindingsBySeverityLevel();
  this.kpis.criticalFindings = severityCount.critical + severityCount.high;
  
  this.kpis.totalFindings = this.getTotalFindingsCount();
  
  this.kpis.addressedFindings = this.getAddressedCriticalFindings();

  if (this.reports.length > 0) {
    const latest = this.reports
      .map(r => new Date(r.createdAt))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    this.kpis.latestDate = latest.toLocaleDateString();
  } else {
    this.kpis.latestDate = 'N/A';
  }
}

generateFieldworkReport(audit: FieldworkAudit): void {

  const existingReport = this.reports.find(r => 
    r.title === `Fieldwork Report - ${audit.title}` && 
    r.type === 'fieldwork'
  );

  if (existingReport) {
    Swal.fire({
      icon: 'info',
      title: 'Report Already Exists',
      text: `A fieldwork report for "${audit.title}" already exists and will not be regenerated.`,
      confirmButtonText: 'OK'
    });
    return;
  }

   if (!this.hasFindings(audit)) {
    Swal.fire({
      icon: 'warning',
      title: 'No Findings Available',
      text: `Cannot generate report for "${audit.title}" because there are no findings.`,
      confirmButtonText: 'OK'
    });
    return;
  }


  this.isLoading = true;

  Swal.fire({
    title: 'Generating Fieldwork Report...',
    text: `Creating report for ${audit.title}`,
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const doc = new jsPDF();
    
    // Report Header
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 128);
    doc.text(`AUDIT REPORT: ${audit.title}`, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Department: ${audit.department} | Generated: ${new Date().toLocaleDateString()}`, 14, 28);

    // Executive Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('EXECUTIVE SUMMARY', 14, 45);

    let startY = 55;

    // Key Findings Summary
    autoTable(doc, {
      startY: startY,
      head: [['Severity', 'Count']],
      body: this.getFindingsBySeverity(audit.preClosing),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    let currentY = 70; 
    
    if ((doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) {
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Detailed Findings
    doc.setFontSize(14);
    doc.text('DETAILED FINDINGS', 14, currentY);

    const detailedFindings = (audit.preClosing || []).map((f: any) => [
      f.title || 'No title',
      f.severity || 'Unknown',
      f.status || 'Open',
      f.recommendation || 'No recommendation'
    ]);

    autoTable(doc, {
      startY: currentY + 10,
      head: [['Finding', 'Severity', 'Status', 'Recommendation']],
      body: detailedFindings,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] }
    });

    // Convert to base64
    const pdfBase64 = doc.output('datauristring');

    // Create report payload
    const payload: MISReport = {
      title: `Fieldwork Report - ${audit.title}`,
      type: 'fieldwork',
      source: 'fieldwork',
      createdAt: new Date().toISOString(),
      uploadedBy: 'System',
      fileType: 'application/pdf',
      fileUrl: pdfBase64,
      description: `Fieldwork report generated from ${audit.title}`,
      findingsCount: audit.findingsCount,
      evidenceCount: audit.evidenceCount,
      fieldworkData: audit.fieldwork,

      draftStatus: 'under_review',
      clientComments: [],
      revisionCount: 0,
      sentToClientAt: undefined,
      finalizedAt: undefined
    };

    this.globalService.createReport(payload).subscribe({
      next: () => {
        this.loadReports();
        Swal.fire('Success!', 'Fieldwork report generated successfully!', 'success');
      },
      error: () => {
        Swal.fire('Error!', 'Failed to save fieldwork report', 'error');
      }
    });

  } catch (error) {
    console.error('Error generating fieldwork report:', error);
    Swal.fire('Error!', 'Failed to generate report', 'error');
  } finally {
    this.isLoading = false;
  }
}

private getFindingsBySeverity(findings: any[] = []): any[] {
  const severityCount: { [key: string]: number } = {};
  
  if (!findings || findings.length === 0) {
    return [['No findings', 0]];
  }
  
  findings.forEach(finding => {
    const severity = finding?.severity || 'Unknown';
    severityCount[severity] = (severityCount[severity] || 0) + 1;
  });

  return Object.entries(severityCount).map(([severity, count]) => [severity, count]);
}

hasExistingDraft(audit: FieldworkAudit): boolean {
  const draftTitle = `Fieldwork Report - ${audit.title}`;
  return this.reports.some(report => 
    report.title === draftTitle && 
    this.isDraftReport(report) && 
    report.draftStatus !== 'finalized'
  );
}

openDraftManagementModal(audit: FieldworkAudit): void {
  const draftTitle = `Fieldwork Report - ${audit.title}`;
  const draftReport = this.reports.find(report => 
    report.title === draftTitle && this.isDraftReport(report)
  );
  
  if (draftReport) {
    this.selectedDraftReport = draftReport;
    this.openDraftModal();
  }
}

selectedDraftReport?: MISReport;
openDraftModal(): void {
  const modal = new bootstrap.Modal(document.getElementById('draftManagementModal')!);
  modal.show();
}

closeDraftModal(): void {
  const modal = bootstrap.Modal.getInstance(document.getElementById('draftManagementModal')!);
  modal?.hide();
}

openAllDraftsModal(): void {
  this.selectedDraftReport = undefined; 
  this.openDraftModal();
}

selectDraftForManagement(draft: MISReport): void {
  this.selectedDraftReport = draft;
}

openReportManagement(report: MISReport): void {
  this.debugReport(report); 
  this.selectedReport = report;
  const modal = new bootstrap.Modal(document.getElementById('reportManagementModal')!);
  modal.show();
}

generateFromFieldwork(): void {
    if (this.fieldworkReports.length === 0) {
      Swal.fire('Info', 'No fieldwork data available for reporting', 'info');
      return;
    }

    this.generateFieldworkReport(this.fieldworkReports[0]);
  }

refreshData(): void {
    this.loadReports();
    this.loadFieldworkData();
  }

openUploadModal() {
  const modal = new bootstrap.Modal(document.getElementById('uploadModal')!);
  modal.show();
}

openPreviewModal(r: MISReport) {
  this.selectedReport = r;

  if (r.fileUrl?.startsWith('data:')) {
    this.previewContent = r.fileUrl;
  } else if (r.filePath) {
    this.previewContent = r.filePath;
  } else {
    this.previewContent = null;
  }

  const modal = new bootstrap.Modal(document.getElementById('previewModal')!);
  modal.show();
}

previewReport(report: any) {
  this.selectedReport = report;
}

load() {
  this.isLoading = true;
  this.mis.listReports()
    .pipe(finalize(() => this.isLoading = false), takeUntil(this.destroy$))
    .subscribe({
      next: r => {
        this.reports = r;
        this.filteredReports = [...this.reports];
        this.updateKPIs();
      },
      error: () => Swal.fire('Error', 'Failed to load reports', 'error')
    });
}

previewAutoReport() {
  this.isLoading = true;

  Swal.fire({
    title: 'Generating Preview...',
    text: 'Please wait while we build the report preview.',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  this.mis.generateSummary()
    .pipe(finalize(() => this.isLoading = false))
    .subscribe({
      next: summary => {
        try {
          const doc = new jsPDF();

          // Title
          doc.setFontSize(16);
          doc.text('Auto Report Preview', 14, 20);

          // Quick Stats
          doc.setFontSize(12);
          doc.text('Quick Stats', 14, 35);
          const quickStatsTable = autoTable(doc, {
            startY: 40,
            head: [['Total Audits', 'Completed', 'In Progress']],
            body: [[summary.totalAudits, summary.completedAudits, summary.inProgress]]
          });

          const auditsByDeptTable = autoTable(doc, {
            startY: (quickStatsTable as any)?.finalY ? (quickStatsTable as any).finalY + 15 : 55,
            head: [['Department', 'Count']],
            body: Object.entries(summary.auditsByDept)
          });

          // Findings by Severity
          const findingsSeverityTable = autoTable(doc, {
            startY: (auditsByDeptTable as any)?.finalY ? (auditsByDeptTable as any).finalY + 15 : 70,
            head: [['Severity', 'Count']],
            body: Object.entries(summary.findingsSeverity)
          });

          // Audits Over Time
          autoTable(doc, {
            startY: (findingsSeverityTable as any)?.finalY ? (findingsSeverityTable as any).finalY + 15 : 85,
            head: [['Month', 'Count']],
            body: Object.entries(summary.auditsOverTime)
          });

          // Convert PDF to base64
          const pdfBase64 = doc.output('datauristring');
          this.selectedReport = {
            title: `Auto Report Preview - ${new Date().toISOString().slice(0, 10)}`,
            type: 'auto-generated',
            createdAt: new Date().toISOString(),
            uploadedBy: 'System',
            fileType: 'application/pdf',
            fileUrl: pdfBase64,
            description: 'Temporary preview of auto-generated report',
            summary,
            filePath: undefined
          };

          Swal.close();
          this.openPreviewModal(this.selectedReport);

        } catch (err) {
          console.error(err);
          Swal.fire('Error ❌', 'Could not generate the preview.', 'error');
        }
      },
      error: () => {
        Swal.fire('Error ❌', 'Failed to generate report preview.', 'error');
      }
    });
}

isDraftReport(report: MISReport): boolean {
  return (report.type === 'fieldwork' || report.type === 'auto-generated') && 
         report.draftStatus !== undefined && 
         report.draftStatus !== 'finalized';
}

private saveReportAndRefresh(payload: MISReport, successMessage: string): void {
  const completePayload: MISReport = {
    ...payload,
    ...((payload.type === 'auto-generated' || payload.type === 'fieldwork') && {
      draftStatus: 'under_review',
      clientComments: [],
      revisionCount: 0,
      sentToClientAt: undefined,
      finalizedAt: undefined
    })
  };

  this.globalService.createReport(completePayload).subscribe({
    next: () => {
      this.loadReports();
      this.calculateKPIsFromWorkflows();
      this.isLoading = false;
      Swal.fire('Success!', successMessage, 'success');
    },
    error: (error) => {
      console.error('Failed to save report:', error);
      this.isLoading = false;
      Swal.fire('Error!', 'Failed to save report', 'error');
    }
  });
}


handleFileInput(ev: any) {
    this.uploadingFile = ev.target.files?.[0];
  }

  generateAutoReport() {
    this.mis.getDynamicSummary().subscribe(summary => {
      const newReport = {
        id: Date.now().toString(36),
        title: `Auto Report ${new Date().toISOString().split('T')[0]}`,
        type: 'auto-generated',
        createdAt: new Date().toISOString(),
        summary
      };

      // Normally POST to json-server
      fetch('http://localhost:3000/misReports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport)
      }).then(() => {
        Swal.fire('Success', 'Auto Report generated successfully!', 'success');
      });
    });
  }

  finalizeReport(draft: MISReport): void {
  Swal.fire({
    title: 'Finalize Report?',
    text: 'This will mark the report as finalized and complete',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, finalize!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      // Update the existing report instead of creating a new one
      draft.draftStatus = 'finalized';
      draft.finalizedAt = new Date().toISOString();
      
      this.updateReportDraftStatus(draft);
      
      Swal.fire('Finalized!', 'Report has been finalized.', 'success');
    }
  });
}

get commentTextLength(): number {
  return this.commentForm.get('commentText')?.value?.length || 0;
}

onCommentTextInput(): void {
  const commentTextControl = this.commentForm.get('commentText');
  if (commentTextControl) {
    commentTextControl.markAsTouched();
  }
}

private updateReportDraftStatus(draft: MISReport): void {
  if (draft.id) {
    this.globalService.updateReport(draft.id, draft).subscribe({
      next: (updatedReport) => {
      //   console.log('Report updated successfully:', updatedReport);
        this.loadReports(); 
      },
      error: (error) => {
        console.error('Failed to update report status:', error);
        console.log('Full error details:', {
          url: `${this.apiUrl}/misReports/${draft.id}`,
          report: draft,
          error: error
        });
        Swal.fire('Error!', 'Failed to update report status', 'error');
      }
    });
  } else {
    console.warn('Report missing ID, creating new one instead of updating');
    this.globalService.createReport(draft).subscribe({
      next: () => {
        this.loadReports();
      },
      error: (error) => {
        console.error('Failed to create report:', error);
        Swal.fire('Error!', 'Failed to create report', 'error');
      }
    });
  }
}

sendToClient(draft: MISReport): void {
  Swal.fire({
    title: 'Send to Client?',
    text: 'This will send the draft report to the client for review',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, send to client!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      // Update existing report
      draft.draftStatus = 'client_review';
      draft.sentToClientAt = new Date().toISOString();
      this.updateReportDraftStatus(draft);
      
      Swal.fire('Sent!', 'Report has been sent to client for review.', 'success');
    }
  });
}

approveDraft(draft: MISReport): void {
  Swal.fire({
    title: 'Approve Report?',
    text: 'This will mark the report as approved by client',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, approve!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      draft.draftStatus = 'finalized';
      draft.finalizedAt = new Date().toISOString();
      this.updateReportDraftStatus(draft);
      
      Swal.fire('Approved!', 'Report has been approved and finalized.', 'success');
    }
  });
}

shouldShowError(fieldName: string): boolean {
  const field = this.commentForm.get(fieldName);
  return !!(field && field.invalid && (this.formSubmitted || field.touched));
}

requestRevision(draft: MISReport): void {
  Swal.fire({
    title: 'Request Revision',
    input: 'textarea',
    inputLabel: 'Revision request details',
    inputPlaceholder: 'What needs to be revised?',
    showCancelButton: true,
    confirmButtonText: 'Request Revision',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const revisionComment = {
        text: String(result.value),
        author: 'Client',
        date: new Date().toISOString(),
        type: 'revision_request' as const
      };
      
      if (!draft.clientComments) {
        draft.clientComments = [];
      }
      draft.clientComments.push(revisionComment);
      draft.draftStatus = 'revised';
      draft.revisionCount = (draft.revisionCount || 0) + 1;
      this.updateReportDraftStatus(draft);
      
      Swal.fire('Requested!', 'Revision has been requested.', 'success');
    }
  });
}

getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

getPaginatedReports(): MISReport[] {
  const startIndex = (this.currentPage - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  
  const sortedReports = this.filteredReports.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
  
  return sortedReports.slice(startIndex, endIndex);
}

getPaginatedFieldworkReports(): FieldworkAudit[] {
  const reports = this.getFieldworkReportsWithFindings();
  const sorted = reports.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA; 
  });
  
  const startIndex = (this.fieldworkCurrentPage - 1) * this.fieldworkPageSize;
  const endIndex = startIndex + this.fieldworkPageSize;
  return sorted.slice(startIndex, endIndex);
}

validateTargetDate(response: any): void {
  if (response.targetDate) {
    const selectedDate = new Date(response.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    response.hasDateError = selectedDate < today;
  } else {
    response.hasDateError = false;
  }
}

hasInvalidDates(): boolean {
  if (!this.selectedReport?.managementResponses) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.selectedReport.managementResponses.some(response => 
    response.hasDateError || 
    (response.targetDate && new Date(response.targetDate) < today)
  );
}

submitManagementResponses(): void {
  if (!this.selectedReport?.managementResponses) return;

  // Validate all dates first
  this.selectedReport.managementResponses.forEach(response => {
    this.validateTargetDate(response);
  });

  // Check for invalid dates
  if (this.hasInvalidDates()) {
    Swal.fire('Error', 'Please fix all invalid target dates before submitting. Target dates cannot be in the past.', 'error');
    return;
  }

  // Validate all responses are filled
  const incomplete = this.selectedReport.managementResponses.some(response => 
    !response.response?.trim() || 
    !response.actionPlan?.trim() || 
    !response.responsiblePerson?.trim() ||
    !response.targetDate
  );

  if (incomplete) {
    Swal.fire('Error', 'Please fill in all management responses, action plans, responsible persons, and target dates.', 'error');
    return;
  }

  this.selectedReport.managementResponseSubmittedAt = new Date().toISOString();
  this.selectedReport.managementResponseStatus = 'submitted';
  
  this.updateReportDraftStatus(this.selectedReport);
  
  const modal = bootstrap.Modal.getInstance(document.getElementById('managementResponseModal')!);
  modal?.hide();
  
  Swal.fire('Success!', 'Management responses submitted successfully', 'success');
}

 uploadReportMetadata() {
  if (!this.uploadingFile || !this.newTitle) {
    Swal.fire('Missing Data', 'Provide a title and select a file', 'warning');
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const base64 = reader.result as string;
    const payload: MISReport = {
      title: this.newTitle,
      type: 'uploaded',
      createdAt: new Date().toISOString(),
      fileUrl: base64,
      uploadedBy: 'CIA',
      fileType: this.uploadingFile!.type,
      description: `Uploaded file: ${this.uploadingFile!.name}`,
      filePath: undefined
    };

    Swal.fire({
      title: 'Uploading...',
      text: 'Please wait while the report is being uploaded.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.mis.createReport(payload).subscribe({
      next: () => {
        this.newTitle = '';
        this.uploadingFile = undefined;
        (document.querySelector<HTMLInputElement>('#misFile')!).value = '';
        this.load();
        Swal.fire('Success', 'Report uploaded successfully!', 'success');
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to upload the report.', 'error');
      }
    });
  };

  reader.readAsDataURL(this.uploadingFile);
}

  downloadReport(r: MISReport) {
    if (r.fileUrl?.startsWith('data:')) {
      const blob = this.dataURItoBlob(r.fileUrl);
      const ext = r.fileType?.split('/')[1] || 'pdf';
      saveAs(blob, `${r.title}.${ext}`);
    } else if (r.filePath) {
      window.open(r.filePath, '_blank');
    } else {
      Swal.fire('Error', 'No file attached to this report', 'error');
    }
  }

  deleteReport(r: MISReport) {
    if (!r.id) return;

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the report "${r.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.mis.deleteReport(r.id!).subscribe({
          next: () => {
            this.load();
            Swal.fire('Deleted!', 'The report has been deleted.', 'success');
          },
          error: () => Swal.fire('Error!', 'Failed to delete the report.', 'error')
        });
      }
    });
  }


  private dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mimeString });
  }

// Export as PDF
exportAsPDF() {
  const doc = new jsPDF();
  doc.text('MIS Reports', 14, 16);
  autoTable(doc, {
    startY: 20,
    head: [['Title', 'Type', 'Created']],
    body: this.reports.map(r => [
      r.title,
      r.type,
      new Date(r.createdAt).toLocaleString()
    ])
  });
  doc.save('MIS_Reports.pdf');
}

exportAsExcel() {
  const worksheet = XLSX.utils.json_to_sheet(
    this.reports.map(r => ({
      Title: r.title,
      Type: r.type,
      Created: new Date(r.createdAt).toLocaleString()
    }))
  );
  const workbook = { Sheets: { 'Reports': worksheet }, SheetNames: ['Reports'] };
  XLSX.writeFile(workbook, 'MIS_Reports.xlsx');
}
}