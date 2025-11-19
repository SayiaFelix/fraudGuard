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
 workflows: any[] = [];
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

  constructor(private mis: GlobalService, private router: Router) {}

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
      if (workflow.fieldwork?.preClosing) {
        workflow.fieldwork.preClosing.forEach((finding: any) => {
          const severity = finding.severity || 'Unknown';
          if (severityCount.hasOwnProperty(severity)) {
            severityCount[severity]++;
          }
        });
      }
      
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
      
      let avgSeverity = 'Low';
      if (critical > 0) avgSeverity = 'Critical';
      else if (high > 0) avgSeverity = 'High';
      else if (medium > 0) avgSeverity = 'Medium';

      const completedAudits = deptAudits.filter(a => a.status === 'Completed').length;
      const completionRate = deptAudits.length ? Math.round((completedAudits / deptAudits.length) * 100) : 0;

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

    this.departmentPerformance.sort((a, b) => b.riskScore - a.riskScore);
  }

  private processRecentActivities(
  audits: any[], 
  workflows: any[], 
  misReports: any[]
): void {
  this.recentActivities = [];
  const now = new Date();

  audits.forEach((audit: any) => {
    const auditDate = new Date(audit.updatedAt || audit.startDate);
    
    if ((now.getTime() - auditDate.getTime()) > (30 * 24 * 60 * 60 * 1000)) {
      return; 
    }

    if (audit.status === 'Completed') {
      this.recentActivities.push({
        type: 'completed',
        message: `Audit completed: ${audit.title}`,
        details: `Department: ${audit.department}`,
        time: audit.updatedAt || audit.startDate,
        department: audit.department
      });
    }
    
    if (audit.status === 'In Progress' && (now.getTime() - auditDate.getTime()) < (7 * 24 * 60 * 60 * 1000)) {
      this.recentActivities.push({
        type: 'update',
        message: `Audit started: ${audit.title}`,
        details: `Status: In Progress`,
        time: audit.startDate,
        department: audit.department
      });
    }

    if (audit.planningMeetingDate && (now.getTime() - new Date(audit.planningMeetingDate).getTime()) < (14 * 24 * 60 * 60 * 1000)) {
      this.recentActivities.push({
        type: 'created',
        message: `Planning meeting: ${audit.title}`,
        details: `Scheduled recently`,
        time: audit.planningMeetingDate,
        department: audit.department
      });
    }

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

  workflows.forEach((workflow: any) => {
    const workflowDate = new Date(workflow.updatedAt || workflow.startDate);
    
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

  this.recentActivities.sort((a, b) => {
    const timeA = new Date(a.time).getTime();
    const timeB = new Date(b.time).getTime();
    return timeB - timeA; 
  });

  this.recentActivities = this.recentActivities.map(activity => ({
    ...activity,
    time: this.formatRelativeTime(activity.time)
  }));

  // Limit to 8 most recent
  this.recentActivities = this.recentActivities.slice(0, 8);
}

refresh(): void {
  this.isLoading = true;

  forkJoin({
    audits: this.mis.getAudits(),
    workflows: this.mis.getWorkflows(),
    misReports: this.mis.getMISReports ? this.mis.getMISReports() : of([])
  }).subscribe(({ 
    audits, workflows, misReports 
  }) => {
    this.workflows = workflows as any[]; 
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
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  console.log('🔍 Processing priority alerts...');
  console.log('Today:', today.toISOString().split('T')[0]);

  // Process Critical/High findings from workflows
  workflows.forEach((workflow: any) => {
    if (workflow.fieldwork?.preClosing) {
      workflow.fieldwork.preClosing.filter((f: any) => 
        f.severity === 'Critical' || f.severity === 'High'
      ).forEach((finding: any) => {
        // Calculate actual days left based on workflow due date
        let daysLeft = 0;
        let dueDate = 'Not set';
        
        if (workflow.dueDate) {
          try {
            const due = new Date(workflow.dueDate);
            due.setHours(0, 0, 0, 0);
            daysLeft = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            dueDate = workflow.dueDate;
            
            console.log(`📅 Finding: ${finding.title}, Due: ${dueDate}, Days Left: ${daysLeft}`);
          } catch (error) {
            console.error('Invalid due date:', workflow.dueDate);
          }
        }

        this.priorityAlerts.push({
          id: finding.id,
          title: `${finding.severity} Finding: ${finding.title}`,
          severity: finding.severity as any,
          department: workflow.department,
          dueDate: dueDate,
          daysLeft: daysLeft, // Now calculated properly
          type: 'finding'
        });
      });
    }
  });

  // Add overdue audits as priority alerts
  audits.forEach((audit: any) => {
    const deadlineDate = audit.endDate || audit.dueDate;
    if (!deadlineDate) return;
    
    try {
      const dueDate = new Date(deadlineDate);
      dueDate.setHours(0, 0, 0, 0);
      const daysLeft = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Include overdue audits or audits due within 3 days
      if (daysLeft < 3 && audit.status !== 'Completed') {
        this.priorityAlerts.push({
          id: audit.id,
          title: `Audit Deadline: ${audit.title}`,
          severity: daysLeft < 0 ? 'Critical' : 'High',
          department: audit.department,
          dueDate: deadlineDate,
          daysLeft: daysLeft,
          type: 'audit'
        });
        
        console.log(`⚠️ Audit Alert: ${audit.title}, Due: ${deadlineDate}, Days: ${daysLeft}`);
      }
    } catch (error) {
      console.error('Invalid audit date:', deadlineDate);
    }
  });

  // If still no alerts, create a sample for demonstration
  if (this.priorityAlerts.length === 0) {
    const sampleDueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    this.priorityAlerts.push({
      id: 'sample-1',
      title: 'Sample: Review quarterly audit findings',
      severity: 'High',
      department: 'Finance',
      dueDate: sampleDueDate.toISOString().split('T')[0],
      daysLeft: 2,
      type: 'audit'
    });
  }

  // Sort by severity and days left (most critical first)
  this.priorityAlerts.sort((a, b) => {
    const severityOrder: any = { 'Critical': 3, 'High': 2, 'Medium': 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    
    if (severityDiff !== 0) return severityDiff;
    
    // If same severity, sort by days left (soonest/overdue first)
    return a.daysLeft - b.daysLeft;
  });

  console.log(`📊 Total priority alerts: ${this.priorityAlerts.length}`);
}

// Add this method to your component class
getDisplayDays(daysLeft: number): string {
  if (daysLeft < 0) {
    return Math.abs(daysLeft) + ' days overdue';
  } else {
    return daysLeft + ' days left';
  }
}

private processUpcomingDeadlines(workflows: any[], audits: any[]): void {
  this.upcomingDeadlines = [];
  const today = new Date();

  console.log('📅 Checking for upcoming deadlines (7-day window)...');

  const upcomingAudits = audits.filter((a: any) => {
    const deadlineDate = a.endDate || a.dueDate; 
    if (!deadlineDate) return false;
    if (a.status === 'Completed') return false;
    
    const dueDate = new Date(deadlineDate);
    const daysLeft = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Audit: ${a.title}, endDate: ${a.endDate}, daysLeft: ${daysLeft}`);
    
    return daysLeft >= 0 && daysLeft <= 7;
  });

  console.log('Upcoming audits within 7 days:', upcomingAudits.length);

  upcomingAudits.forEach((audit: any) => {
    const deadlineDate = audit.endDate || audit.dueDate;
    const dueDate = new Date(deadlineDate);
    const daysLeft = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    this.upcomingDeadlines.push({
      id: audit.id,
      title: audit.title,
      type: 'audit',
      department: audit.department,
      dueDate: deadlineDate, 
      daysLeft
    });
  });

  let upcomingTasksCount = 0;
  workflows.forEach((workflow: any) => {
    if (workflow.tasks) {
      const upcomingTasks = workflow.tasks.filter((t: any) => {
        if (!t.dueDate) return false;
        if (t.status === 'Done') return false;
        
        const dueDate = new Date(t.dueDate);
        const daysLeft = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`Task: ${t.title}, dueDate: ${t.dueDate}, daysLeft: ${daysLeft}`);
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
  this.upcomingDeadlines.sort((a, b) => a.daysLeft - b.daysLeft);
}
private processCAPImplementation(workflows: any[]): void {
    let findingsWithAction = 0;
    let totalFindings = 0;

    workflows.forEach((workflow: any) => {
      if (workflow.fieldwork?.preClosing) {
        totalFindings += workflow.fieldwork.preClosing.length;
  
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
    
    const avgWorkflowCompletion = Math.round(
      workflows.reduce((sum: number, wf: any) => {
        const total = wf.tasks?.length || 0;
        const done = wf.tasks?.filter((t: any) => t.status === 'Done').length || 0;
        return sum + (total ? (done / total) * 100 : 0);
      }, 0) / (workflows.length || 1)
    );

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
    
    if (date > now) {
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

  exportExcel(): void {
    const wb = XLSX.utils.book_new();

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

    doc.setFontSize(12);
    doc.text('Audits by Department', 14, 45);
    const auditsBody = Object.entries(this.auditsByDept).map(([dept, count]) => [dept, count.toString()]);
    (doc as any).autoTable({
      head: [['Department', 'Count']],
      body: auditsBody,
      startY: 50
    });

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

  viewAlert(alert: PriorityAlert): void {
    Swal.fire({
      title: alert.title,
      html: `
        <div class="text-start">
          <hr>
          <p><strong>Severity:</strong> <span class="badge bg-${alert.severity === 'Critical' ? 'danger' : alert.severity === 'High' ? 'warning' : 'info'}">${alert.severity}</span></p>
          <p><strong>Department:</strong> ${alert.department}</p>
          <p><strong>Due Date:</strong> ${alert.dueDate}</p>
          <p><strong>Days ${alert.daysLeft < 0 ? 'Overdue' : 'Left'}:</strong> ${Math.abs(alert.daysLeft)}</p>
        </div>
      `,
      icon: 'warning',
      confirmButtonText: 'Close'
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
    text: 'Opening CAP monitoring dashboard...',
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Open CAP',
    cancelButtonText: 'Stay Here',
    showLoaderOnConfirm: true,
    preConfirm: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          try {
            this.router.navigate(['/eclectics/compliance/all']);
            resolve(true);
          } catch (error) {
            console.error('Navigation error:', error);
            resolve(false);
          }
        }, 1000);
      });
    }
  }).then((result) => {
    if (result.isDismissed) {
    } else if (result.value === false) {
      Swal.fire('Error', 'Could not open CAP dashboard', 'error');
    }
  });
}

generateCAPReport(): void {
  Swal.fire({
    title: 'CAP Analytics Report',
    text: 'Generating comprehensive CAP implementation report...',
    icon: 'info',
    showConfirmButton: false,
    allowOutsideClick: false,
    timer: 1500
  });

  setTimeout(() => {
    try {
      this.exportCAPReportToExcel();
      Swal.fire({
        title: 'Report Generated!',
        text: 'CAP analytics report has been downloaded as Excel.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Failed to generate CAP report. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }, 1500);
}

private exportCAPReportToExcel(): void {
  const wb = XLSX.utils.book_new();
  
  // CAP Summary Sheet
  const summaryData = [
    ['CAP Implementation Analytics Report'],
    ['Generated on:', new Date().toLocaleDateString()],
    ['Overall CAP Implementation Rate:', `${this.overallCapImplementationRate}%`],
    [''],
    ['Department', 'Total Audits', 'Total Findings', 'CAP Implemented', 'CAP Rate', 'Risk Score', 'Avg Severity']
  ];
  this.departmentPerformance.forEach(dept => {
    const capRate = this.calculateDepartmentCAPRate(dept.name);
    const capImplemented = Math.round((capRate / 100) * dept.findingCount);
    
    summaryData.push([
      dept.name,
      dept.auditCount.toString(),
      dept.findingCount.toString(),
      capImplemented.toString(),
      `${capRate}%`,
      `${dept.riskScore}/10`,
      dept.avgSeverity
    ]);
  });

  const findingsData = [
    ['CAP Implementation Details'],
    ['Department', 'Finding Type', 'Title/Description', 'Severity', 'Status', 'CAP Status']
  ];

  this.workflows.forEach((workflow: any) => {
    const department = workflow.department || 'Unknown';

    if (workflow.fieldwork?.preClosing) {
      workflow.fieldwork.preClosing.forEach((finding: any) => {
        findingsData.push([
          department,
          'Major Finding',
          finding.title || 'No title',
          finding.severity || 'Unknown',
          finding.status || 'Open',
          this.getCAPStatus(finding)
        ]);
      });
    }

    if (workflow.miniFindings) {
      workflow.miniFindings.forEach((finding: any) => {
        findingsData.push([
          department,
          'Mini Finding',
          finding.description || 'No description',
          finding.severity || finding.impact || 'Unknown',
          finding.status || 'Noted',
          this.getCAPStatus(finding)
        ]);
      });
    }
  });

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'CAP Summary');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(findingsData), 'CAP Details');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([wbout]), `cap-analytics-report-${new Date().toISOString().slice(0,10)}.xlsx`);
}

private calculateDepartmentCAPRate(department: string): number {
  const deptWorkflows = this.workflows.filter((w: any) => w.department === department);
  let totalFindings = 0;
  let findingsWithAction = 0;

  deptWorkflows.forEach((workflow: any) => {
    if (workflow.fieldwork?.preClosing) {
      workflow.fieldwork.preClosing.forEach((finding: any) => {
        totalFindings++;
        if (finding.status && !['Open', 'Reviewed', 'Draft'].includes(finding.status)) {
          findingsWithAction++;
        }
      });
    }
    
    if (workflow.miniFindings) {
      workflow.miniFindings.forEach((finding: any) => {
        totalFindings++;
        if (finding.status && !['Open', 'Noted'].includes(finding.status)) {
          findingsWithAction++;
        }
      });
    }
  });

  return totalFindings ? Math.round((findingsWithAction / totalFindings) * 100) : 0;
}

private getCAPStatus(finding: any): string {
  const status = finding.status || 'Open';
  
  switch (status) {
    case 'Open':
    case 'Reviewed':
    case 'Noted':
    case 'Draft':
      return 'No CAP';
    case 'Presented':
    case 'Confirmed':
      return 'CAP Planned';
    case 'In Progress':
      return 'CAP in Progress';
    case 'Closed':
    case 'Resolved':
      return 'CAP Completed';
    default:
      return 'Unknown';
  }
}
}