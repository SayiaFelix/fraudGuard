import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component,ViewChild,  ElementRef,OnInit,ChangeDetectorRef, Pipe } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NgbDateStruct, NgbCalendar, NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CustomValidators } from 'ngx-custom-validators';
import { Observable, map, of } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { DatePipe, formatDate } from '@angular/common';
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component';
declare var bootstrap: any
import { forkJoin } from 'rxjs';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { AddCustomerComponent } from '../mobile-banking/customers/add-customer/add-customer.component';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ChartConfiguration, ChartData } from 'chart.js';
import * as saveAs from 'file-saver';


interface ConversationMessage {
  sender: 'user' | 'bot';
  text: string;
  type?: 'text' | 'file';
  time: string;
  fileUrl?: string; 
  isFileResponse?: boolean;
  isWelcomeMessage?: boolean;
  isGeneratingReport?: boolean;
  status?: 'sending' | 'delivered' | 'error' | 'received' | 'pending' | 'approved' | 'rejected' | 'loading';
  isLoading?: boolean;
  isError?: boolean;
  formattedText?: string;
  datasetId?: string;
  fileData?: {
    filename: string;
    size: number;
    format?: string;
    downloadUrl?: string;
    mimeType?: string;
    content?: string;
    profile?: {
      overview: any;
      column_types: any;
      missing_data: {
        total_missing: number;
        pct_missing: number;
        columns_with_missing: number;
        missing_value_distribution: {
          columns: { [key: string]: number };
          top_5_columns_with_most_missing: { [key: string]: number };
        };
      };
      sample_data: any[];
    };
    analysis?: string;
    message?: string;
  };
}


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  preserveWhitespaces: true,
  providers: [DatePipe],
})
export class DashboardComponent implements OnInit {
  // Filters
  department = '';
  dateFrom?: string;
  dateTo?: string;
   kpis: { label: string; value: number | string; icon: string; borderClass: string; textClass: string; trend: string }[] = [];
  // summary data
  auditsByDept: Record<string, number> = {};
  findingsSeverity: any = {};
  auditsOverTime: Record<string, number> = {};
  workflowTrends: any;

  // chart data holders
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  workflowChartData: ChartData<'line'> = { labels: [], datasets: [] };
  statusPieChartData: ChartData<'pie'> = { labels: [], datasets: [] };

  isLoading = false;

  constructor(private mis: GlobalService) {}

  ngOnInit(): void {
    this.refresh();
  }

  // Chart options
  barChartOptions: ChartConfiguration<'bar'>['options'] = { 
    responsive: true,
    plugins: { title: { display: true, text: 'Audits by Department' } }
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = { 
    responsive: true,
    plugins: { title: { display: true, text: 'Findings by Severity' }},
   
  };

  statusPieChartOptions: ChartConfiguration<'pie'>['options'] = {
  responsive: true,
  plugins: { title: { display: true, text: 'Audit Status' }}
};

  lineChartOptions: ChartConfiguration<'line'>['options'] = { 
    responsive: true,
    plugins: { title: { display: true, text: 'Audits Over Time' } }
  };

  workflowChartOptions: ChartConfiguration<'line'>['options'] = { 
    responsive: true,
    plugins: { title: { display: true, text: 'Workflow Completion Trends (%)' } }
  };

  
  refresh(): void {
  this.isLoading = true;

  forkJoin({
    audits: this.mis.getAudits(),
    workflows: this.mis.getWorkflows(),
    observations: this.mis.getObservations()
  }).subscribe(({ audits, workflows, observations }) => {
    // ✅ Apply filters
    let filteredAudits = audits;
    let filteredWorkflows = workflows;
    let filteredObservations = observations;

    if (this.department) {
      filteredAudits = filteredAudits.filter((a: any) =>
        a.department?.toLowerCase().includes(this.department.toLowerCase())
      );
      filteredWorkflows = filteredWorkflows.filter((wf: any) =>
        wf.department?.toLowerCase().includes(this.department.toLowerCase())
      );
    }

    if (this.dateFrom) {
      filteredAudits = filteredAudits.filter((a: any) => a.startDate >= this.dateFrom!);
      filteredWorkflows = filteredWorkflows.filter((wf: any) => wf.startDate >= this.dateFrom!);
      filteredObservations = filteredObservations.filter((o: any) => o.createdAt >= this.dateFrom!);
    }

    if (this.dateTo) {
      filteredAudits = filteredAudits.filter((a: any) => a.startDate <= this.dateTo!);
      filteredWorkflows = filteredWorkflows.filter((wf: any) => wf.startDate <= this.dateTo!);
      filteredObservations = filteredObservations.filter((o: any) => o.createdAt <= this.dateTo!);
    }

    // --- Audits by Department ---
    this.auditsByDept = filteredAudits.reduce((acc: any, a: any) => {
      acc[a.department] = (acc[a.department] || 0) + 1;
      return acc;
    }, {});

    // --- Findings Severity ---
    const severityCount: any = { High: 0, Medium: 0, Low: 0 };
    filteredObservations.forEach((obs: any) => {
      severityCount[obs.severity] = (severityCount[obs.severity] || 0) + 1;
    });
    filteredWorkflows.forEach((wf: any) => {
      (wf.miniFindings || []).forEach((f: any) => {
        const sev = f.severity || f.impact || 'Unknown';
        severityCount[sev] = (severityCount[sev] || 0) + 1;
      });
    });
    this.findingsSeverity = severityCount;

    // --- Audits Over Time (YYYY-MM) ---
    this.auditsOverTime = filteredAudits.reduce((acc: any, a: any) => {
      if (!a.startDate) return acc;
      const month = a.startDate.slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    // --- Workflow Completion Trends ---
    this.workflowTrends = filteredWorkflows.reduce((acc: any, wf: any) => {
      if (!wf.startDate) return acc;
      const month = wf.startDate.slice(0, 7);
      const total = (wf.tasks?.length || 0);
      const done = (wf.tasks || []).filter((t: any) => t.status === 'Done').length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      acc[month] = acc[month] || [];
      acc[month].push(pct);
      return acc;
    }, {});
    this.workflowTrends = Object.fromEntries(
      Object.entries(this.workflowTrends).map(([m, arr]: any) => {
        const avg = arr.reduce((a: number, b: number) => a + b, 0) / arr.length;
        return [m, Math.round(avg)];
      })
    );

    // --- Audit Status Counts ---
    const statusCount: any = {};
    filteredAudits.forEach((a: any) => {
      statusCount[a.status] = (statusCount[a.status] || 0) + 1;
    });

    // --- KPIs ---
    const totalAudits = filteredAudits.length;
    const completedAudits = filteredAudits.filter((a: any) => a.status === 'Completed').length;
    const openObservations = filteredObservations.filter((o: any) => o.status === 'Open').length;
    const avgWorkflowCompletion = Math.round(
      filteredWorkflows.reduce((sum: number, wf: any) => {
        const total = wf.tasks?.length || 0;
        const done = (wf.tasks || []).filter((t: any) => t.status === 'Done').length;
        return sum + (total ? (done / total) * 100 : 0);
      }, 0) / (filteredWorkflows.length || 1)
    );

    this.kpis = [
      { label: 'Total Audits', value: totalAudits, icon: 'fas fa-clipboard-list', borderClass: 'border-primary', textClass: 'text-primary', trend: totalAudits > 5 ? 'up' : 'down' },
      { label: 'Completed Audits', value: completedAudits, icon: 'fas fa-check-circle', borderClass: 'border-success', textClass: 'text-success', trend: completedAudits > 2 ? 'up' : 'flat' },
      { label: 'Open Observations', value: openObservations, icon: 'fas fa-exclamation-triangle', borderClass: 'border-warning', textClass: 'text-warning', trend: openObservations > 3 ? 'down' : 'up' },
      { label: 'Workflow Completion', value: avgWorkflowCompletion + '%', icon: 'fas fa-tasks', borderClass: 'border-info', textClass: 'text-info', trend: avgWorkflowCompletion >= 50 ? 'up' : 'down' }
    ];

    // --- Build Charts ---
    this.buildCharts(statusCount);
    this.isLoading = false;
  }, () => this.isLoading = false);
}

buildCharts(statusCount: any) {
  const palette = [
    '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
    '#20c997', '#fd7e14', '#6610f2', '#17a2b8', '#e83e8c'
  ];

  const deptLabels = Object.keys(this.auditsByDept);
  const deptValues = Object.values(this.auditsByDept);

  this.barChartData = {
    labels: deptLabels,
    datasets: [{
      data: deptValues,
      label: 'Audits',
      backgroundColor: deptLabels.map((_, i) => palette[i % palette.length])
    }]
  };

  this.pieChartData = {
    labels: Object.keys(this.findingsSeverity),
    datasets: [{
      data: Object.values(this.findingsSeverity),
      backgroundColor: Object.keys(this.findingsSeverity).map((_, i) => palette[i % palette.length])
    }]
  };

  this.statusPieChartData = {
    labels: Object.keys(statusCount),
    datasets: [{
      data: Object.values(statusCount),
      backgroundColor: Object.keys(statusCount).map((_, i) => palette[i % palette.length])
    }]
  };

  const auditLabels = Object.keys(this.auditsOverTime).sort();
  this.lineChartData = {
    labels: auditLabels,
    datasets: [{
      data: auditLabels.map(k => this.auditsOverTime[k]),
      label: 'Audits',
      borderColor: '#007bff',
      backgroundColor: 'rgba(0,123,255,0.2)',
      fill: true
    }]
  };

  const wfLabels = Object.keys(this.workflowTrends).sort();
  this.workflowChartData = {
    labels: wfLabels,
    datasets: [{
      data: wfLabels.map(k => this.workflowTrends[k]),
      label: 'Avg Completion %',
      borderColor: '#28a745',
      backgroundColor: 'rgba(40,167,69,0.2)',
      fill: true
    }]
  };
}

  // Export helpers
  exportExcel() {
    const wb = XLSX.utils.book_new();
    const data = [
      ['Department', 'Audits'],
      ...Object.entries(this.auditsByDept)
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'AuditsByDept');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout]), `mis-summary-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  exportPDF() {
    const doc = new jsPDF();
    doc.text('MIS — Summary', 14, 20);
    const body = Object.entries(this.auditsByDept).map(([k,v]) => [k, v]);
    (doc as any).autoTable({ head: [['Department', 'Audits']], body, startY: 30 });
    doc.save(`mis-summary-${new Date().toISOString().slice(0,10)}.pdf`);
  }
}
