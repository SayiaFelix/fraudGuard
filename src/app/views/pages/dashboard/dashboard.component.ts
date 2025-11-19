import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, ViewChild, ElementRef, OnInit, ChangeDetectorRef, Pipe } from '@angular/core';
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

// Interfaces for new features
interface ActivityItem {
  type: 'completed' | 'finding' | 'update' | 'created';
  message: string;
  details: string;
  time: string;
  department?: string;
}

interface PriorityAlert {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium';
  department: string;
  dueDate: string;
  daysLeft: number;
  type: 'audit' | 'finding' | 'cap';
}

interface DeadlineItem {
  id: string;
  title: string;
  type: 'audit' | 'finding' | 'cap' | 'task';
  department: string;
  dueDate: string;
  daysLeft: number;
}

interface DepartmentPerformance {
  name: string;
  auditCount: number;
  findingCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  avgSeverity: string;
  completionRate: number;
  riskScore: number;
}

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
  severityFilter = '';
  statusFilter = '';

  // Enhanced KPI Cards
  kpis: { 
    label: string; 
    value: number | string; 
    icon: string; 
    borderClass: string; 
    textClass: string; 
    trend: string;
    description?: string;
  }[] = [];

  // Summary data
  auditsByDept: Record<string, number> = {};
  findingsSeverity: any = {};
  auditsOverTime: Record<string, number> = {};
  workflowTrends: any;

  // New data structures
  recentActivities: ActivityItem[] = [];
  priorityAlerts: PriorityAlert[] = [];
  upcomingDeadlines: DeadlineItem[] = [];
  departmentPerformance: DepartmentPerformance[] = [];
  overallCapImplementationRate = 0;
  totalRecords = 0;
  lastUpdated = new Date();

  // Chart data holders
  barChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  lineChartData: ChartData<'line'> = { labels: [], datasets: [] };
  workflowChartData: ChartData<'line'> = { labels: [], datasets: [] };
  statusPieChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  capProgressChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  isLoading = false;

  // Chart options
  barChartOptions: ChartConfiguration<'bar'>['options'] = { 
    responsive: true,
    plugins: { 
      title: { display: true, text: 'Audits by Department' },
      legend: { display: false }
    }
  };

  pieChartOptions: ChartConfiguration<'pie'>['options'] = { 
    responsive: true,
    plugins: { 
      title: { display: true, text: 'Findings by Severity' },
    },
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

  capProgressChartOptions: ChartConfiguration<'bar'>['options'] = { 
    responsive: true,
    plugins: { title: { display: true, text: 'CAP Implementation by Department' } }
  };

  constructor(private mis: GlobalService) {}

  ngOnInit(): void {
    this.refresh();
  }

  private processAuditsByDepartment(audits: any[]): void {
    this.auditsByDept = audits.reduce((acc: any, audit: any) => {
      const dept = audit.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
  }

  private processFindingsSeverity(workflows: any[]): void {
    const severityCount: any = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    
    workflows.forEach((workflow: any) => {
      // Count preClosing findings
      if (workflow.fieldwork?.preClosing) {
        workflow.fieldwork.preClosing.forEach((finding: any) => {
          const severity = finding.severity || 'Unknown';
          if (severityCount.hasOwnProperty(severity)) {
            severityCount[severity]++;
          }
        });
      }
      
      // Count miniFindings
      if (workflow.miniFindings) {
        workflow.miniFindings.forEach((finding: any) => {
          const severity = finding.severity || finding.impact || 'Unknown';
          if (severityCount.hasOwnProperty(severity)) {
            severityCount[severity]++;
          }
        });
      }
    });
    
    this.findingsSeverity = severityCount;
  }

  private processAuditsOverTime(audits: any[]): void {
    this.auditsOverTime = audits.reduce((acc: any, audit: any) => {
      if (!audit.startDate) return acc;
      const month = audit.startDate.slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
  }

  private processWorkflowTrends(workflows: any[]): void {
    this.workflowTrends = workflows.reduce((acc: any, workflow: any) => {
      if (!workflow.startDate) return acc;
      const month = workflow.startDate.slice(0, 7);
      const totalTasks = workflow.tasks?.length || 0;
      const completedTasks = workflow.tasks?.filter((task: any) => task.status === 'Done').length || 0;
      const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      acc[month] = acc[month] || [];
      acc[month].push(completionRate);
      return acc;
    }, {});

    // Calculate average per month
    this.workflowTrends = Object.fromEntries(
      Object.entries(this.workflowTrends).map(([month, rates]: [string, any]) => {
        const average = rates.reduce((sum: number, rate: number) => sum + rate, 0) / rates.length;
        return [month, Math.round(average)];
      })
    );
  }

  private processDepartmentPerformance(audits: any[], workflows: any[]): void {
    const departments = new Set([
      ...audits.map((a: any) => a.department),
      ...workflows.map((w: any) => w.department)
    ].filter(dept => dept));

    this.departmentPerformance = Array.from(departments).map((dept: any) => {
      const deptAudits = audits.filter(a => a.department === dept);
      const deptWorkflows = workflows.filter(w => w.department === dept);
      
      // Count findings by severity
      let critical = 0, high = 0, medium = 0, low = 0;
      
      deptWorkflows.forEach((workflow: any) => {
        if (workflow.fieldwork?.preClosing) {
          workflow.fieldwork.preClosing.forEach((finding: any) => {
            switch (finding.severity) {
              case 'Critical': critical++; break;
              case 'High': high++; break;
              case 'Medium': medium++; break;
              case 'Low': low++; break;
            }
          });
        }
        
        if (workflow.miniFindings) {
          workflow.miniFindings.forEach((finding: any) => {
            const severity = finding.severity || finding.impact;
            switch (severity) {
              case 'Critical': critical++; break;
              case 'High': high++; break;
              case 'Medium': medium++; break;
              case 'Low': low++; break;
            }
          });
        }
      });

      const totalFindings = critical + high + medium + low;
      
      // Calculate average severity
      let avgSeverity = 'Low';
      if (critical > 0) avgSeverity = 'Critical';
      else if (high > 0) avgSeverity = 'High';
      else if (medium > 0) avgSeverity = 'Medium';

      // Calculate completion rate (based on audit status)
      const completedAudits = deptAudits.filter(a => a.status === 'Completed').length;
      const completionRate = deptAudits.length ? Math.round((completedAudits / deptAudits.length) * 100) : 0;

      // Calculate risk score (1-10)
      let riskScore = 1;
      if (critical > 0) riskScore = 8 + Math.min(2, critical);
      else if (high > 0) riskScore = 6 + Math.min(2, high);
      else if (medium > 0) riskScore = 4 + Math.min(2, medium);
      else if (low > 0) riskScore = 2 + Math.min(2, low);

      return {
        name: dept,
        auditCount: deptAudits.length,
        findingCount: totalFindings,
        criticalCount: critical,
        highCount: high,
        mediumCount: medium,
        lowCount: low,
        avgSeverity,
        completionRate,
        riskScore: Math.min(10, riskScore)
      };
    });

    // Sort by risk score (highest first)
    this.departmentPerformance.sort((a, b) => b.riskScore - a.riskScore);
  }

  private processRecentActivities(
  audits: any[], 
  workflows: any[], 
  misReports: any[]
): void {
  this.recentActivities = [];
  const now = new Date();

  // 1. Audit Activities - Only include recent ones
  audits.forEach((audit: any) => {
    const auditDate = new Date(audit.updatedAt || audit.startDate);
    
    // Only include audits from the last 30 days
    if ((now.getTime() - auditDate.getTime()) > (30 * 24 * 60 * 60 * 1000)) {
      return; // Skip old audits
    }

    // Audit completions
    if (audit.status === 'Completed') {
      this.recentActivities.push({
        type: 'completed',
        message: `Audit completed: ${audit.title}`,
        details: `Department: ${audit.department}`,
        time: audit.updatedAt || audit.startDate,
        department: audit.department
      });
    }
    
    // Audit starts (only recent ones)
    if (audit.status === 'In Progress' && (now.getTime() - auditDate.getTime()) < (7 * 24 * 60 * 60 * 1000)) {
      this.recentActivities.push({
        type: 'update',
        message: `Audit started: ${audit.title}`,
        details: `Status: In Progress`,
        time: audit.startDate,
        department: audit.department
      });
    }

    // Planning activities (only recent)
    if (audit.planningMeetingDate && (now.getTime() - new Date(audit.planningMeetingDate).getTime()) < (14 * 24 * 60 * 60 * 1000)) {
      this.recentActivities.push({
        type: 'created',
        message: `Planning meeting: ${audit.title}`,
        details: `Scheduled recently`,
        time: audit.planningMeetingDate,
        department: audit.department
      });
    }

    // Risk assessments (only recent and high/medium risk)
    if (audit.riskRating && (audit.riskRating === 'High' || audit.riskRating === 'Medium') && (now.getTime() - auditDate.getTime()) < (7 * 24 * 60 * 60 * 1000)) {
      this.recentActivities.push({
        type: 'finding',
        message: `Risk assessment: ${audit.title}`,
        details: `Risk: ${audit.riskRating}`,
        time: audit.startDate,
        department: audit.department
      });
    }
  });

  // 2. Workflow Activities - Only recent ones
  workflows.forEach((workflow: any) => {
    const workflowDate = new Date(workflow.updatedAt || workflow.startDate);
    
    // Only include workflows from the last 30 days
    if ((now.getTime() - workflowDate.getTime()) > (30 * 24 * 60 * 60 * 1000)) {
      return;
    }

    // Workflow completions
    if (workflow.status === 'Completed') {
      this.recentActivities.push({
        type: 'completed',
        message: `Workflow completed: ${workflow.title}`,
        details: `Department: ${workflow.department}`,
        time: workflow.updatedAt || workflow.startDate,
        department: workflow.department
      });
    }

    // Recent workflow starts
    if (workflow.status === 'In Progress' && (now.getTime() - workflowDate.getTime()) < (7 * 24 * 60 * 60 * 1000)) {
      this.recentActivities.push({
        type: 'update',
        message: `Workflow started: ${workflow.title}`,
        details: `Fieldwork in progress`,
        time: workflow.startDate,
        department: workflow.department
      });
    }
  });

  // CORRECT SORTING: Newest first (most recent dates first)
  // b.time - a.time = puts newer items first
  this.recentActivities.sort((a, b) => {
    const timeA = new Date(a.time).getTime();
    const timeB = new Date(b.time).getTime();
    return timeB - timeA; // Descending order (newest first)
  });

  // Format times for display
  this.recentActivities = this.recentActivities.map(activity => ({
    ...activity,
    time: this.formatRelativeTime(activity.time)
  }));

  // Limit to 8 most recent
  this.recentActivities = this.recentActivities.slice(0, 8);
}

refresh(): void {
  this.isLoading = true;

  // Use only the APIs that actually exist in GlobalService
  forkJoin({
    audits: this.mis.getAudits(),
    workflows: this.mis.getWorkflows(),
    misReports: this.mis.getMISReports ? this.mis.getMISReports() : of([])
  }).subscribe(({ 
    audits, workflows, misReports 
  }) => {
    // Apply filters to audits and workflows
    let filteredAudits = audits as any[];
    let filteredWorkflows = workflows as any[];

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
    }

    if (this.dateTo) {
      filteredAudits = filteredAudits.filter((a: any) => a.startDate <= this.dateTo!);
      filteredWorkflows = filteredWorkflows.filter((wf: any) => wf.startDate <= this.dateTo!);
    }

    // Process all data
    this.processAuditsByDepartment(filteredAudits);
    this.processFindingsSeverity(filteredWorkflows);
    this.processAuditsOverTime(filteredAudits);
    this.processWorkflowTrends(filteredWorkflows);
    this.processDepartmentPerformance(filteredAudits, filteredWorkflows);
    
    // Enhanced activity processing with available data sources
    this.processRecentActivities(
      filteredAudits, 
      filteredWorkflows, 
      misReports as any[]
    );
    
    this.processPriorityAlerts(filteredWorkflows, filteredAudits);
    this.processUpcomingDeadlines(filteredWorkflows, filteredAudits);
    this.processCAPImplementation(filteredWorkflows);

    // Calculate KPIs
    this.calculateKPIs(filteredAudits, filteredWorkflows);

    // Build charts with real audit data
    this.buildCharts(filteredAudits);

    this.isLoading = false;
    this.lastUpdated = new Date();
    this.totalRecords = filteredAudits.length + filteredWorkflows.length;

  }, (error) => {
    console.error('Error loading dashboard data:', error);
    this.isLoading = false;
  });
}

private processPriorityAlerts(workflows: any[], audits: any[]): void {
  this.priorityAlerts = [];
  const today = new Date();

  // Include High severity findings too (not just Critical)
  workflows.forEach((workflow: any) => {
    if (workflow.fieldwork?.preClosing) {
      workflow.fieldwork.preClosing.filter((f: any) => 
        f.severity === 'Critical' || f.severity === 'High'
      ).forEach((finding: any) => {
        this.priorityAlerts.push({
          id: finding.id,
          title: `${finding.severity} Finding: ${finding.title}`,
          severity: finding.severity as any,
          department: workflow.department,
          dueDate: workflow.dueDate || 'Not set',
          daysLeft: 0,
          type: 'finding'
        });
      });
    }
  });

  // If still no alerts, create a sample for demonstration
  if (this.priorityAlerts.length === 0) {
    this.priorityAlerts.push({
      id: 'sample-1',
      title: 'Sample: Review quarterly audit findings',
      severity: 'High',
      department: 'Finance',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      daysLeft: 2,
      type: 'audit'
    });
  }

  this.priorityAlerts.sort((a, b) => {
    const severityOrder: any = { 'Critical': 3, 'High': 2, 'Medium': 1 };
    return severityOrder[b.severity] - severityOrder[a.severity] || a.daysLeft - b.daysLeft;
  });
}

private processUpcomingDeadlines(workflows: any[], audits: any[]): void {
  this.upcomingDeadlines = [];
  const today = new Date();

  console.log('📅 Checking for upcoming deadlines (7-day window)...');

  // FIX: Use endDate for audits instead of dueDate
  const upcomingAudits = audits.filter((a: any) => {
    const deadlineDate = a.endDate || a.dueDate; // ← FIXED: Check both endDate and dueDate
    if (!deadlineDate) return false;
    if (a.status === 'Completed') return false;
    
    const dueDate = new Date(deadlineDate);
    const daysLeft = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Audit: ${a.title}, endDate: ${a.endDate}, daysLeft: ${daysLeft}`);
    
    // ONLY include if due within 7 days (0-7 days)
    return daysLeft >= 0 && daysLeft <= 7;
  });

  console.log('Upcoming audits within 7 days:', upcomingAudits.length);

  upcomingAudits.forEach((audit: any) => {
    const deadlineDate = audit.endDate || audit.dueDate; // ← FIXED
    const dueDate = new Date(deadlineDate);
    const daysLeft = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    this.upcomingDeadlines.push({
      id: audit.id,
      title: audit.title,
      type: 'audit',
      department: audit.department,
      dueDate: deadlineDate, // ← FIXED: Use the actual date field
      daysLeft
    });
  });

  // Workflow tasks remain the same (they use dueDate correctly)
  let upcomingTasksCount = 0;
  workflows.forEach((workflow: any) => {
    if (workflow.tasks) {
      const upcomingTasks = workflow.tasks.filter((t: any) => {
        if (!t.dueDate) return false;
        if (t.status === 'Done') return false;
        
        const dueDate = new Date(t.dueDate);
        const daysLeft = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`Task: ${t.title}, dueDate: ${t.dueDate}, daysLeft: ${daysLeft}`);
        
        // ONLY include if due within 7 days (0-7 days)
        return daysLeft >= 0 && daysLeft <= 7;
      });
      
      upcomingTasksCount += upcomingTasks.length;
      
      upcomingTasks.forEach((task: any) => {
        const dueDate = new Date(task.dueDate);
        const daysLeft = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        this.upcomingDeadlines.push({
          id: task.id,
          title: task.title,
          type: 'task',
          department: workflow.department,
          dueDate: task.dueDate,
          daysLeft
        });
      });
    }
  });

  console.log('Upcoming tasks within 7 days:', upcomingTasksCount);
  console.log('Total upcoming deadlines within 7 days:', this.upcomingDeadlines.length);

  // Sort by days left (closest first)
  this.upcomingDeadlines.sort((a, b) => a.daysLeft - b.daysLeft);
}
private processCAPImplementation(workflows: any[]): void {
    let findingsWithAction = 0;
    let totalFindings = 0;

    workflows.forEach((workflow: any) => {
      if (workflow.fieldwork?.preClosing) {
        totalFindings += workflow.fieldwork.preClosing.length;
        // Consider findings with status other than 'Open' as having some action
        findingsWithAction += workflow.fieldwork.preClosing.filter((f: any) => 
          f.status && f.status !== 'Open' && f.status !== 'Reviewed'
        ).length;
      }
      
      if (workflow.miniFindings) {
        totalFindings += workflow.miniFindings.length;
        findingsWithAction += workflow.miniFindings.filter((f: any) => 
          f.status && f.status !== 'Open' && f.status !== 'Noted'
        ).length;
      }
    });

    this.overallCapImplementationRate = totalFindings ? Math.round((findingsWithAction / totalFindings) * 100) : 0;
  }

  private calculateKPIs(audits: any[], workflows: any[]): void {
    const totalAudits = audits.length;
    const completedAudits = audits.filter((a: any) => a.status === 'Completed').length;
    const openFindingsCount = this.countOpenFindings(workflows);
    
    // Calculate average workflow completion
    const avgWorkflowCompletion = Math.round(
      workflows.reduce((sum: number, wf: any) => {
        const total = wf.tasks?.length || 0;
        const done = wf.tasks?.filter((t: any) => t.status === 'Done').length || 0;
        return sum + (total ? (done / total) * 100 : 0);
      }, 0) / (workflows.length || 1)
    );

    // Calculate risk exposure score
    const riskScore = this.calculateRiskScore(workflows);

    this.kpis = [
      { 
        label: 'Total Audits', 
        value: totalAudits, 
        icon: 'fas fa-clipboard-list', 
        borderClass: 'border-primary', 
        textClass: 'text-primary', 
        trend: totalAudits > 5 ? 'up' : 'down',
        description: 'All audit activities'
      },
      { 
        label: 'Completed Audits', 
        value: completedAudits, 
        icon: 'fas fa-check-circle', 
        borderClass: 'border-success', 
        textClass: 'text-success', 
        trend: completedAudits > 2 ? 'up' : 'flat',
        description: 'Successfully closed audits'
      },
      { 
      label: 'Open Observations', 
      value: openFindingsCount, 
      icon: 'fas fa-exclamation-triangle', 
      borderClass: 'border-warning', 
      textClass: 'text-warning', 
      trend: openFindingsCount > 5 ? 'down' : 'up', 
      description: 'Observations not yet closed' 
    },
      { 
        label: 'Risk Score', 
        value: riskScore + '/10', 
        icon: 'fas fa-radiation', 
        borderClass: 'border-danger', 
        textClass: 'text-danger', 
        trend: riskScore > 7 ? 'up' : 'down',
        description: 'Overall risk exposure'
      }
    ];
  }

  private countOpenFindings(workflows: any[]): number {
    let openCount = 0;
    
    workflows.forEach((workflow: any) => {
      if (workflow.fieldwork?.preClosing) {
        openCount += workflow.fieldwork.preClosing.filter((f: any) => 
          f.status === 'Draft' || f.status === 'Reviewed' ||  f.status === 'Presented'
        ).length;
      }
      
      // if (workflow.miniFindings) {
      //   openCount += workflow.miniFindings.filter((f: any) => 
      //     f.status === 'Open' || f.status === 'Noted' || !f.status
      //   ).length;
      // }
    });
    
    return openCount;
  }

  private calculateRiskScore(workflows: any[]): number {
    let critical = 0, high = 0, medium = 0, low = 0;
    
    workflows.forEach((workflow: any) => {
      if (workflow.fieldwork?.preClosing) {
        workflow.fieldwork.preClosing.forEach((finding: any) => {
          switch (finding.severity) {
            case 'Critical': critical++; break;
            case 'High': high++; break;
            case 'Medium': medium++; break;
            case 'Low': low++; break;
          }
        });
      }
      
      if (workflow.miniFindings) {
        workflow.miniFindings.forEach((finding: any) => {
          const severity = finding.severity || finding.impact;
          switch (severity) {
            case 'Critical': critical++; break;
            case 'High': high++; break;
            case 'Medium': medium++; break;
            case 'Low': low++; break;
          }
        });
      }
    });

    // Weighted risk calculation
    const weightedScore = (critical * 4) + (high * 3) + (medium * 2) + (low * 1);
    const totalFindings = critical + high + medium + low;
    
    if (totalFindings === 0) return 1;
    
    const normalizedScore = (weightedScore / (totalFindings * 4)) * 10;
    return Math.min(10, Math.max(1, Math.round(normalizedScore)));
  }


  buildCharts(audits: any[]): void {
  // Consistent color scheme matching your CAP monitoring
  const severityColors: any = {
    'Critical': '#dc3545', // Red
    'High': '#fd7e14',     // Orange  
    'Medium': '#ffc107',   // Yellow
    'Low': '#28a745'       // Green
  };

  const statusColors: any = {
    'Planned': '#6f42c1',    // Purple
    'In Progress': '#007bff', // Blue
    'Completed': '#28a745'    // Green
  };

  // Bar Chart - Audits by Department
  const deptLabels = Object.keys(this.auditsByDept);
  const deptValues = Object.values(this.auditsByDept);
  this.barChartData = {
    labels: deptLabels,
    datasets: [{
      data: deptValues,
      label: 'Audits',
      backgroundColor: deptLabels.map((_, i) => [
        '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
        '#20c997', '#fd7e14', '#6610f2', '#17a2b8', '#e83e8c'
      ][i % 10])
    }]
  };

  // Pie Chart - Findings by Severity - CONSISTENT COLORS
  const severityLabels = Object.keys(this.findingsSeverity);
  this.pieChartData = {
    labels: severityLabels,
    datasets: [{
      data: Object.values(this.findingsSeverity),
      backgroundColor: severityLabels.map(severity => 
        severityColors[severity] || '#6c757d' // Fallback to gray
      )
    }]
  };

  // Status Pie Chart - REAL DATA with consistent colors
  const auditStatusData = this.processAuditStatus(audits);
  const statusLabels = Object.keys(auditStatusData);
  this.statusPieChartData = {
    labels: statusLabels,
    datasets: [{
      data: Object.values(auditStatusData),
      backgroundColor: statusLabels.map(status => 
        statusColors[status] || '#6c757d' // Fallback to gray
      )
    }]
  };

  // Line Chart - Audits Over Time
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

  // Workflow Completion Trends
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

  // CAP Progress Chart
  this.capProgressChartData = {
    labels: this.departmentPerformance.map(d => d.name),
    datasets: [{
      data: this.departmentPerformance.map(d => Math.round(Math.random() * 100)), // Placeholder
      label: 'CAP Implementation %',
      backgroundColor: '#007bff' // Consistent blue
    }]
  };
}

private formatRelativeTime(dateString: string): string {
  if (!dateString) return 'Unknown time';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Check if date is in the future (data issue)
    if (date > now) {
      // If it's a future date, show the actual date but mark it as future
      return `Future: ${date.toLocaleDateString()}`;
    }
    
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', dateString, error);
    return 'Date error';
  }
}

private processAuditStatus(audits: any[]): any {
  const statusCount: any = { Planned: 0, 'In Progress': 0, Completed: 0 };
  
  audits.forEach((audit: any) => {
    const status = audit.status || 'Planned';
    if (statusCount.hasOwnProperty(status)) {
      statusCount[status]++;
    }
  });
  
  return statusCount;
}

  // Filter methods
  clearFilters(): void {
    this.department = '';
    this.dateFrom = undefined;
    this.dateTo = undefined;
    this.severityFilter = '';
    this.statusFilter = '';
    this.refresh();
  }

  // Export methods
  exportExcel(): void {
    const wb = XLSX.utils.book_new();
    
    // Add multiple sheets
    const auditsData = [['Department', 'Audit Count'], ...Object.entries(this.auditsByDept)];
    const findingsData = [['Severity', 'Count'], ...Object.entries(this.findingsSeverity)];
    const deptPerformanceData = [
      ['Department', 'Audits', 'Findings', 'Critical', 'High', 'Medium', 'Low', 'Avg Severity', 'Completion Rate', 'Risk Score'],
      ...this.departmentPerformance.map(dept => [
        dept.name, dept.auditCount, dept.findingCount, dept.criticalCount, 
        dept.highCount, dept.mediumCount, dept.lowCount, dept.avgSeverity, 
        dept.completionRate + '%', dept.riskScore + '/10'
      ])
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(auditsData), 'AuditsByDept');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(findingsData), 'FindingsBySeverity');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(deptPerformanceData), 'DeptPerformance');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout]), `audit-dashboard-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  exportPDF(): void {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Audit Management Dashboard Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Audits by Department table
    doc.setFontSize(12);
    doc.text('Audits by Department', 14, 45);
    const auditsBody = Object.entries(this.auditsByDept).map(([dept, count]) => [dept, count.toString()]);
    (doc as any).autoTable({
      head: [['Department', 'Count']],
      body: auditsBody,
      startY: 50
    });

    // Department Performance table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Department Performance', 14, finalY);
    const deptBody = this.departmentPerformance.map(dept => [
      dept.name,
      dept.auditCount.toString(),
      dept.findingCount.toString(),
      dept.avgSeverity,
      dept.completionRate + '%',
      dept.riskScore + '/10'
    ]);
    (doc as any).autoTable({
      head: [['Department', 'Audits', 'Findings', 'Avg Severity', 'Completion', 'Risk Score']],
      body: deptBody,
      startY: finalY + 5
    });

    doc.save(`audit-dashboard-${new Date().toISOString().slice(0,10)}.pdf`);
  }

  exportDetailedReport(): void {
    Swal.fire({
      title: 'Generating Detailed Report',
      text: 'Please wait while we compile the comprehensive report...',
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false
    });

    // Simulate report generation
    setTimeout(() => {
      this.exportExcel(); // For now, just export Excel
      Swal.fire({
        title: 'Report Generated!',
        text: 'Your detailed report has been downloaded.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    }, 2000);
  }

  exportChartData(chartType: string): void {
    // Implementation for exporting individual chart data
    console.log(`Exporting chart data: ${chartType}`);
    // Similar to exportExcel but for specific chart
  }

  exportDepartmentMatrix(): void {
    const deptData = this.departmentPerformance.map(dept => ({
      Department: dept.name,
      'Total Audits': dept.auditCount,
      'Total Findings': dept.findingCount,
      'Critical Findings': dept.criticalCount,
      'High Findings': dept.highCount,
      'Medium Findings': dept.mediumCount,
      'Low Findings': dept.lowCount,
      'Average Severity': dept.avgSeverity,
      'Completion Rate': dept.completionRate + '%',
      'Risk Score': dept.riskScore + '/10'
    }));

    const ws = XLSX.utils.json_to_sheet(deptData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Department Performance');
    XLSX.writeFile(wb, `department-performance-${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  // View methods
  viewAlert(alert: PriorityAlert): void {
    Swal.fire({
      title: alert.title,
      html: `
        <div class="text-start">
          <p><strong>Severity:</strong> <span class="badge bg-${alert.severity === 'Critical' ? 'danger' : alert.severity === 'High' ? 'warning' : 'info'}">${alert.severity}</span></p>
          <p><strong>Department:</strong> ${alert.department}</p>
          <p><strong>Due Date:</strong> ${alert.dueDate}</p>
          <p><strong>Days ${alert.daysLeft < 0 ? 'Overdue' : 'Left'}:</strong> ${Math.abs(alert.daysLeft)}</p>
        </div>
      `,
      icon: 'warning',
      confirmButtonText: 'View Details'
    });
  }

  viewDepartmentDetails(department: string): void {
    Swal.fire({
      title: `Department: ${department}`,
      text: `Viewing detailed analytics for ${department}`,
      icon: 'info',
      confirmButtonText: 'OK'
    });
  }

  viewAllCAPs(): void {
    Swal.fire({
      title: 'Corrective Action Plans',
      text: 'Navigating to CAP monitoring dashboard...',
      icon: 'info',
      confirmButtonText: 'Continue'
    });
  }

  generateCAPReport(): void {
    Swal.fire({
      title: 'CAP Analytics Report',
      text: 'Generating comprehensive CAP implementation report...',
      icon: 'info',
      confirmButtonText: 'Generate'
    });
  }
}