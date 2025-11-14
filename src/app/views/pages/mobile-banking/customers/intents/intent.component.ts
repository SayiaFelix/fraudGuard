import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, SecurityContext, ViewChild} from '@angular/core';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from '@angular/router'; 
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import * as saveAs from 'file-saver';
import jsPDF from 'jspdf';
import { HttpClient } from '@angular/common/http';

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
  
    // Filters
    searchTerm = '';
    departmentFilter = '';
    statusFilter = '';
  
    // Form & Modal
    addAuditForm: FormGroup;
    isAddAuditModalVisible = false;
  
    private apiUrl = 'http://localhost:3000/audits';
  
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
        endDate: ['', Validators.required]
      });
    }
  
    ngOnInit(): void {
    const today = new Date();
    this.todayString = today.toISOString().split('T')[0];
    this.loadAudits();
  
    
    this.addAuditForm.get('startDate')?.valueChanges.subscribe(start => {
      if (this.addAuditForm.get('endDate')?.value < start) {
        this.addAuditForm.patchValue({ endDate: start }); 
      }
    });
    }
  
    loadAudits(): void {
      this.isLoading = true;
      this.http.get<any[]>(this.apiUrl).subscribe({
        next: (audits: any[]) => {
          this.allAudits = audits;
          this.applyFiltersAndPagination();
          this.isLoading = false;
        },
        error: () => {
          this.toastr.error('Could not load audits from backend.', 'API Error');
          this.isLoading = false;
        }
      });
    }
  
    applyFiltersAndPagination(): void {
      let audits = [...this.allAudits];
  
      const search = this.searchTerm.trim().toLowerCase();
      if (search) {
        audits = audits.filter(a =>
          a.title.toLowerCase().includes(search) ||
          a.department.toLowerCase().includes(search) ||
          a.status.toLowerCase().includes(search)
        );
      }
  
      if (this.departmentFilter) {
        audits = audits.filter(a =>
          a.department.toLowerCase().includes(this.departmentFilter.toLowerCase())
        );
      }
  
      if (this.statusFilter) {
        audits = audits.filter(a =>
          a.status.toLowerCase().includes(this.statusFilter.toLowerCase())
        );
      }
  
      this.filteredAudits = audits;
      this.visibleAudits = this.filteredAudits.slice(0, this.recordsToShow);
    }
  
    resetFilters(): void {
      this.searchTerm = '';
      this.departmentFilter = '';
      this.statusFilter = '';
      this.applyFiltersAndPagination();
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
        endDate: ''                  
      });
      this.hideAuditDetails();
      this.isAddAuditModalVisible = true;
      this.selectedAudit = null;
      this.addAuditForm.get('status')?.enable();
    }
  
  
    saveAudit(): void {
      if (this.addAuditForm.invalid) {
        this.toastr.warning('Please fill all required fields.', 'Invalid Form');
        return;
      }
  
      const formData = this.addAuditForm.getRawValue();
  
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
                next: (workflows: string | any[]) => {
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
                      dueDate: formData.endDate
                    };
                    this.http.put(`http://localhost:3000/workflows/${wf.id}`, updatedWf).subscribe({
                      next: () => this.globalService.notifyWorkflowsChanged(),
                      error: (err: any) => console.error('Workflow sync failed:', err)
                    });
                  }
                },
                error: (err: any) => console.error('Failed to fetch workflow for sync:', err)
              });
            },
            error: () => this.toastr.error('Failed to update audit')
          });
  
      } else {
        
        this.http.post<any>(this.apiUrl, formData).subscribe({
          next: (createdAudit: { title: any; id: any; department: any; startDate: any; endDate: any; status: string; scope: any; }) => {
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
              error: (err: any) => console.error('Failed to create inbox notification:', err)
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
              error: (err: any) => console.error('Workflow create failed:', err)
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