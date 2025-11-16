import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { GlobalService } from 'src/app/shared/services/global.service';

@Component({
  selector: 'app-list-observations',
  templateUrl: './send-sms.component.html',
  styleUrls: ['./send-sms.component.scss'],
})
export class SendSmsComponent implements OnInit {
  auditId!: string | null;
  auditTitle = '';
  observations: any[] = []; // This will now store preClosing findings
  filteredObservations: any[] = [];
  isLoading = false;
  currentWorkflow: any = null;

  // Filters
  searchTerm = '';
  severityFilter = '';
  statusFilter = '';

  // View Only - No modals needed
  selectedObservation: any = null;
  isDetailsPanelVisible = false;

  private workflowsUrl = 'http://localhost:3000/workflows';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastr: ToastrService,
    private globalService: GlobalService
  ) {}

  ngOnInit(): void {
    this.auditId = this.route.snapshot.paramMap.get('auditId')!;
    this.loadWorkflowData();
  }

  // ---------------- Load Workflow Data ----------------
  loadWorkflowData(): void {
    this.isLoading = true;
    this.http.get<any>(`${this.workflowsUrl}/${this.auditId}`).subscribe({
      next: (workflow) => {
        this.currentWorkflow = workflow;
        this.auditTitle = workflow?.title || 'Unknown Audit';
        
        // Convert preClosing findings to observations format
        this.observations = this.transformPreClosingToObservations(workflow?.fieldwork?.preClosing || []);
        
        this.applyFilters();
        this.isLoading = false;
        
        // Notify parent component to update risk stats
        this.globalService.notifyObservationsChanged();
      },
      error: (error) => {
        console.error('Error loading workflow:', error);
        this.toastr.error('Failed to load audit data');
        this.isLoading = false;
      }
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.severityFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }

private transformPreClosingToObservations(preClosingFindings: any[]): any[] {
  return preClosingFindings.map(finding => ({
    id: finding.id,
    description: finding.title,
    details: finding.details,
    severity: finding.severity,
    status: finding.status,
    recommendation: finding.recommendation,
    createdAt: finding.createdAt || new Date().toISOString().slice(0, 10)
  }));
}

applyFilters(): void {
  let obsList = [...this.observations];
  const search = this.searchTerm.trim().toLowerCase();

  if (search) {
    obsList = obsList.filter(obs =>
      obs.description.toLowerCase().includes(search) ||
      obs.details.toLowerCase().includes(search) ||
      obs.severity.toLowerCase().includes(search) ||
      obs.status.toLowerCase().includes(search) ||
      obs.recommendation.toLowerCase().includes(search)
    );
  }

  if (this.severityFilter) {
    obsList = obsList.filter(obs =>
      obs.severity.toLowerCase() === this.severityFilter.toLowerCase()
    );
  }

  if (this.statusFilter) {
    obsList = obsList.filter(obs =>
      obs.status.toLowerCase() === this.statusFilter.toLowerCase()
    );
  }

  this.filteredObservations = obsList;
}

  toggleObservationDetails(obs: any): void {
    if (this.selectedObservation?.id === obs.id) {
      this.selectedObservation = null;
      this.isDetailsPanelVisible = false;
    } else {
      this.selectedObservation = obs;
      this.isDetailsPanelVisible = true;
    }
  }

  hideDetails(): void {
    this.isDetailsPanelVisible = false;
    this.selectedObservation = null;
  }
}