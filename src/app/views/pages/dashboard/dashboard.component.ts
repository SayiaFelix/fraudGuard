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
import { FilesizePipe } from '../mobile-banking/customers/list-customers/list-customers.component';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ChartConfiguration, ChartData } from 'chart.js';
import * as saveAs from 'file-saver';

// interface Message {
//   text: string;
//   sender: "user" | "bot";
//   isAttention?: boolean;  
// }
// interface to match the API response

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
  providers: [FilesizePipe, DatePipe],
})
export class DashboardComponent implements OnInit {
  // Filters
  department = '';
  dateFrom?: string;
  dateTo?: string;

  // summary data for charts
  auditsByDept: Record<string, number> = {};
  findingsSeverity: any = {};
  auditsOverTime: Record<string, number> = {};

  // chart data holders (ng2-charts)
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  lineChartData: ChartData<'line'> = { labels: [], datasets: [] };

  isLoading = false;

  constructor(private mis: GlobalService) {}

  ngOnInit(): void {
    this.refresh();
  }

  //   // Bar Chart
  // barChartData: ChartConfiguration<'bar'>['data'] = {
  //   labels: ['Finance', 'IT', 'EBU', 'Market'],
  //   datasets: [
  //     { data: [12, 19, 3, 5], label: 'Audits' }
  //   ]
  // };
   barChartOptions: ChartConfiguration<'bar'>['options'] = { responsive: true };

  // // Pie Chart
  // pieChartData: ChartConfiguration<'pie'>['data'] = {
  //   labels: ['Completed', 'In Progress', 'Planned'],
  //   datasets: [
  //     { data: [5, 3, 2] }
  //   ]
  // };
   pieChartOptions: ChartConfiguration<'pie'>['options'] = { responsive: true };

  // // Line Chart
  // // lineChartData: ChartConfiguration<'line'>['data'] = {
  // //   labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  // //   datasets: [
  // //     { data: [10, 20, 15, 25], label: 'Findings Trend' }
  // //   ]
  // // };
   lineChartOptions: ChartConfiguration<'line'>['options'] = { responsive: true };

  refresh(): void {
    this.isLoading = true;
    this.mis.generateSummary().subscribe(s => {
      this.auditsByDept = s.auditsByDept;
      this.findingsSeverity = s.findingsSeverity;
      this.auditsOverTime = s.auditsOverTime;

      this.buildCharts();
      this.isLoading = false;
    }, () => this.isLoading = false);
  }

  buildCharts() {
    // BAR: audits by department
    this.barChartData = {
      labels: Object.keys(this.auditsByDept),
      datasets: [{ data: Object.values(this.auditsByDept), label: 'Audits' }]
    };

    // PIE: findings by severity
    this.pieChartData = {
      labels: Object.keys(this.findingsSeverity),
      datasets: [{ data: Object.values(this.findingsSeverity) }]
    };

    // LINE: audits over time (sorted keys)
    const labels = Object.keys(this.auditsOverTime).sort();
    const values = labels.map(k => this.auditsOverTime[k]);
    this.lineChartData = {
      labels,
      datasets: [{ data: values, label: 'Audits' }]
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

};
