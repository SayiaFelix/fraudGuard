import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, Observable } from 'rxjs';
import { takeUntil, finalize, map } from 'rxjs/operators';
import { forkJoin } from 'rxjs'; // Explicitly import forkJoin
import { HttpClient } from '@angular/common/http';
import { ChartData } from 'chart.js';
import * as XLSX from 'xlsx';
import * as saveAs from 'file-saver';
import jsPDF from 'jspdf';
import { GlobalService } from 'src/app/shared/services/global.service';
import Swal from 'sweetalert2';
import autoTable from 'jspdf-autotable'; // make sure to install jspdf-autotable

export interface MISReport {
uploadedBy: any;
fileType: string;
description: any;
filePath: any;
  id?: string;
  title: string;
  type: 'auto-generated' | 'uploaded';
  createdAt: string;
  summary?: any;
  fileUrl?: string | null;
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

// Add global bootstrap declaration for TypeScript
declare var bootstrap: any;

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories-as-cards.component.html',
  styleUrls: ['./product-categories-as-cards.component.scss']
})
export class ProductCategoriesAsCardsComponent implements OnInit, OnDestroy {
  reports: MISReport[] = [];
  isLoading = false;
  newTitle = '';
  uploadingFile?: File;
  filteredReports: MISReport[] = [];

  // filter fields
  filterTitle = '';
  filterType = '';
  filterDate = '';
  private destroy$ = new Subject<void>();
// Add KPI holders
kpis = {
  total: 0,
  uploaded: 0,
  auto: 0,
  latestDate: ''
};

  constructor(private mis: GlobalService) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectedReport?: MISReport;
previewContent: string | null = null;

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


  applyFilter() {
  this.filteredReports = this.reports.filter(r => {
    // title filter
    const matchesTitle = this.filterTitle
      ? r.title.toLowerCase().includes(this.filterTitle.toLowerCase())
      : true;

    // type filter
    const matchesType = this.filterType
      ? r.type === this.filterType
      : true;

    // date filter
    const matchesDate = this.filterDate
      ? new Date(r.createdAt) >= new Date(this.filterDate)
      : true;

    return matchesTitle && matchesType && matchesDate;
  });
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

updateKPIs() {
  this.kpis.total = this.reports.length;
  this.kpis.uploaded = this.reports.filter(r => r.type === 'uploaded').length;
  this.kpis.auto = this.reports.filter(r => r.type === 'auto-generated').length;

  if (this.reports.length > 0) {
    const latest = this.reports
      .map(r => new Date(r.createdAt))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    this.kpis.latestDate = latest.toLocaleDateString();
  } else {
    this.kpis.latestDate = 'N/A';
  }
}

clearFilters() {
  this.filterTitle = '';
  this.filterType = '';
  this.filterDate = '';
  this.filteredReports = [...this.reports];
}

// 🔹 PREVIEW ONLY (no saving, just show modal)
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
          // Build PDF in memory
          const doc = new jsPDF();
          doc.text('Auto Report Preview', 10, 10);
          doc.text(JSON.stringify(summary, null, 2), 10, 20);
          const pdfBase64 = doc.output('datauristring');

          // Show it in preview modal without saving
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

          Swal.close(); // close loading
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

createAutoReport() {
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
          // Build PDF
          const doc = new jsPDF();
          doc.text('Auto Report', 10, 10);
          doc.text(JSON.stringify(summary, null, 2), 10, 20);
          const pdfBase64 = doc.output('datauristring');

          // Payload
          const payload: MISReport = {
            title: `Auto Report ${new Date().toISOString().slice(0, 10)}`,
            type: 'auto-generated',
            createdAt: new Date().toISOString(),
            uploadedBy: 'System',
            fileType: 'application/pdf',
            fileUrl: pdfBase64,
            description: 'Auto-generated audit summary',
            summary,
            filePath: undefined
          };

          // Save to backend
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

    // Show loading Swal
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

  // -------------------- DELETE REPORT --------------------
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