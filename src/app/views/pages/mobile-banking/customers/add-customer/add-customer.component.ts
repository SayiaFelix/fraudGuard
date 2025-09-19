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
   this.todayString = today.toISOString().split('T')[0]; // "2025-09-18" format
    this.loadAudits();
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

  // Modal Controls
  openAddAuditModal(): void {
    this.addAuditForm.reset({ status: 'Planned' });
    this.hideAuditDetails();
    this.isAddAuditModalVisible = true;
    this.selectedAudit = null;
  }

  openEditAuditModal(audit: any): void {
    this.addAuditForm.patchValue(audit);
    this.isAddAuditModalVisible = true;
    this.selectedAudit = audit;
  }

  closeAddAuditModal(): void {
    this.isAddAuditModalVisible = false;
  }
  
  saveAudit(): void {
  if (this.addAuditForm.invalid) {
    this.toastr.warning('Please fill all required fields.', 'Invalid Form');
    return;
  }

  const formData = this.addAuditForm.value;

  if (this.selectedAudit) {
    this.http.put(`${this.apiUrl}/${this.selectedAudit.id}`, {
      ...formData,
      id: this.selectedAudit.id
    }).subscribe({
      next: () => {
        Swal.fire('Updated', 'Audit updated successfully!', 'success');
        this.loadAudits();
        this.closeAddAuditModal();
          this.hideAuditDetails();
        this.globalService.notifyAuditsChanged();  // 🔔 notify parent
      }
    });
  } else {
    this.http.post(this.apiUrl, formData).subscribe({
      next: () => {
        Swal.fire('Created', 'Audit added successfully!', 'success');
        this.loadAudits();
        this.closeAddAuditModal();
        this.hideAuditDetails();
        this.globalService.notifyAuditsChanged();  // 🔔 notify parent
      }
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

  // Title (centered)
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Audit Report", pageWidth / 2, 15, { align: "center" });

  // Generated Date (centered below title)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const generatedOn = new Date().toLocaleString();
  doc.text(`Generated on: ${generatedOn}`, pageWidth / 2, 22, { align: "center" });

  // Add Table
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
      // Footer
      const pageCount = doc.getNumberOfPages();
      const currentPage = data.pageNumber; // autoTable gives this
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
