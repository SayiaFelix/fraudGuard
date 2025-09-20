import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from "sweetalert2";
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
  observations: any[] = [];
  filteredObservations: any[] = [];
  isLoading = false;

  // Filters
  searchTerm = '';
  severityFilter = '';
  statusFilter = '';

  // Observation Modal
  isAddEditModalVisible = false;
  isEditMode = false;
  selectedObservation: any = null;
  observationForm: FormGroup;

  // Finding Modal
  isFindingModalVisible = false;
  isFindingEditMode = false;
  findingForm: FormGroup;
  targetObservation: any = null;
  selectedFinding: any = null;

  private apiUrl = 'http://localhost:3000/observations';
  private auditsUrl = 'http://localhost:3000/audits';
  private workflowsUrl = 'http://localhost:3000/workflows';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private globalService: GlobalService
  ) {
    this.observationForm = this.fb.group({
      description: ['', Validators.required],
      severity: ['Medium', Validators.required],
      status: ['Open', Validators.required],
      recommendation: ['', Validators.required]
    });

    this.findingForm = this.fb.group({
      description: ['', Validators.required],
      impact: ['Low', Validators.required],
      status: ['Noted', Validators.required]
    });
  }

  ngOnInit(): void {
    this.auditId = this.route.snapshot.paramMap.get('auditId')!;
    this.loadAuditTitle();
    this.loadObservations();
  }
  
isDetailsPanelVisible = false;

showObservationDetails(obs: any): void {
  if (this.selectedObservation && this.selectedObservation.id === obs.id) {
    // clicked the same row again → close
    this.hideDetails();
    return;
  }

  this.selectedObservation = { ...obs };
  this.isDetailsPanelVisible = true;

  // optional: if you want to refresh details from server
  this.http.get<any>(`${this.apiUrl}/${obs.id}`).subscribe({
    next: res => this.selectedObservation = res,
    error: err => console.warn('Could not fetch observation details', err)
  });
}

hideDetails(): void {
  this.isDetailsPanelVisible = false;
  this.selectedObservation = null;
}

  // ---------------- Audit + Observation ----------------
  loadAuditTitle(): void {
    this.http.get<any>(`${this.auditsUrl}/${this.auditId}`).subscribe({
      next: (audit) => {
        this.auditTitle = audit?.title || 'Unknown Audit';
      }
    });
  }

  loadObservations(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${this.apiUrl}?auditId=${this.auditId}`).subscribe({
      next: (data) => {
        this.observations = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load observations');
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let obsList = [...this.observations];
    const search = this.searchTerm.trim().toLowerCase();

    if (search) {
      obsList = obsList.filter(obs =>
        obs.description.toLowerCase().includes(search) ||
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

  resetFilters(): void {
    this.searchTerm = '';
    this.severityFilter = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  openAddObservationModal(): void {
    this.isEditMode = false;
    this.observationForm.reset({ severity: 'Medium', status: 'Open' });
    this.isAddEditModalVisible = true;
    this.selectedObservation = null;
  }

  openEditObservationModal(obs: any): void {
  this.isEditMode = true;
  this.observationForm.patchValue(obs);
  this.isAddEditModalVisible = true;
  this.selectedObservation = obs;
}


toggleObservationDetails(obs: any): void {
  if (this.selectedObservation?.id === obs.id) {
    console.log("Selected Obs:",this.selectedObservation )
    // If same row clicked again → close
    this.selectedObservation = null;
    this.isDetailsPanelVisible = false;
  } else {
    this.selectedObservation = obs;
    this.isDetailsPanelVisible = true;
  }
}


  closeModal(): void {
    this.isAddEditModalVisible = false;
  }

  saveObservation(): void {
  if (this.observationForm.invalid) {
    this.observationForm.markAllAsTouched();
    return;
  }

  const formData = {
    ...this.observationForm.value,
    auditId: this.auditId,
    createdAt: this.isEditMode ? this.selectedObservation.createdAt : new Date().toISOString().slice(0, 10),
    findings: this.selectedObservation?.findings || []
  };

  if (this.isEditMode && this.selectedObservation) {
    this.http.put(`${this.apiUrl}/${this.selectedObservation.id}`, formData).subscribe(() => {
      this.loadObservations();
      this.closeModal();
      this.globalService.notifyAuditsChanged();
    });
  } else {
    this.http.post(this.apiUrl, formData).subscribe(() => {
      this.loadObservations();
      this.closeModal();
    });
  }
}

deleteObservation(id: string): void {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This observation will be deleted permanently!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
        Swal.fire('Deleted!', 'Observation deleted', 'success');
        this.loadObservations();
        this.selectedObservation = null;
        this.isDetailsPanelVisible = false;
      });
    }
  });
}

saveFinding(): void {
  if (!this.targetObservation) return;

  if (this.findingForm.invalid) {
    this.findingForm.markAllAsTouched();
    this.toastr.warning('Please fill all required fields');
    return;
  }

  let updatedFindings: any[];

  if (this.isFindingEditMode && this.selectedFinding) {
    // Update existing finding
    updatedFindings = (this.targetObservation.findings || []).map((f: any) =>
      f.id === this.selectedFinding.id
        ? { ...f, ...this.findingForm.value }
        : f
    );
  } else {
    // Add new finding
    const newFinding = {
      ...this.findingForm.value,
      id: Date.now().toString(), // unique id
      createdAt: new Date().toISOString().split('T')[0]
    };
    updatedFindings = [...(this.targetObservation.findings || []), newFinding];
  }

  const updatedObs = {
    ...this.targetObservation,
    findings: updatedFindings
  };

  this.http.put(`${this.apiUrl}/${this.targetObservation.id}`, updatedObs).subscribe({
    next: () => {
      if (this.isFindingEditMode) {
        this.updateFindingInWorkflow(this.selectedFinding.id, this.findingForm.value, this.targetObservation.auditId);
      } else {
        this.syncFindingToWorkflow(updatedFindings[updatedFindings.length - 1], this.targetObservation.auditId);
      }

      // Refresh observations list
      this.loadObservations();

      // Refresh the selectedObservation details immediately
      this.http.get<any>(`${this.apiUrl}/${this.targetObservation.id}`).subscribe({
        next: obs => {
          this.selectedObservation = obs;
        }
      });

      this.toastr.success('Finding saved successfully');
      this.closeFindingModal();
    },
    error: () => {
      this.toastr.error('Failed to save finding');
    }
  });
}

  openFindingModal(obs: any, finding: any = null): void {
    this.targetObservation = obs;
    this.isFindingEditMode = !!finding;
    this.selectedFinding = finding;

    if (finding) {
      this.findingForm.patchValue(finding);
    } else {
      this.findingForm.reset({ severity: 'Low', status: 'Noted' });
    }

    this.isFindingModalVisible = true;
  }

  closeFindingModal(): void {
    this.isFindingModalVisible = false;
    this.targetObservation = null;
    this.selectedFinding = null;
  }


  deleteFinding(obs: any, findingId: string): void {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This finding will be deleted permanently!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  }).then(result => {
    if (result.isConfirmed) {
      const updatedObs = {
        ...obs,
        findings: (obs.findings || []).filter((f: any) => f.id !== findingId)
      };

      this.http.put(`${this.apiUrl}/${obs.id}`, updatedObs).subscribe({
        next: () => {
          this.removeFindingFromWorkflow(findingId, obs.auditId);

          // Refresh observations list
          this.loadObservations();

          // Refresh the selectedObservation details
          this.http.get<any>(`${this.apiUrl}/${obs.id}`).subscribe({
            next: freshObs => {
              this.selectedObservation = freshObs;
            }
          });

          Swal.fire('Deleted!', 'Finding deleted successfully', 'success');
        },
        error: () => {
          Swal.fire('Error', 'Failed to delete finding', 'error');
        }
      });
    }
  });
}


  private syncFindingToWorkflow(finding: any, auditId: string): void {
    this.http.get<any[]>(`${this.workflowsUrl}?auditId=${auditId}`).subscribe({
      next: (workflows) => {
        workflows.forEach(wf => {
          const updatedWf = {
            ...wf,
            miniFindings: [...(wf.miniFindings || []), finding]
          };
          this.http.put(`${this.workflowsUrl}/${wf.id}`, updatedWf).subscribe();
        });
      }
    });
  }

  private updateFindingInWorkflow(findingId: string, updatedData: any, auditId: string): void {
    this.http.get<any[]>(`${this.workflowsUrl}?auditId=${auditId}`).subscribe({
      next: (workflows) => {
        workflows.forEach(wf => {
          const updatedWf = {
            ...wf,
            miniFindings: (wf.miniFindings || []).map((f: any) =>
              f.id === findingId ? { ...f, ...updatedData } : f
            )
          };
          this.http.put(`${this.workflowsUrl}/${wf.id}`, updatedWf).subscribe();
        });
      }
    });
  }

  private removeFindingFromWorkflow(findingId: string, auditId: string): void {
    this.http.get<any[]>(`${this.workflowsUrl}?auditId=${auditId}`).subscribe({
      next: (workflows) => {
        workflows.forEach(wf => {
          const updatedWf = {
            ...wf,
            miniFindings: (wf.miniFindings || []).filter((f: any) => f.id !== findingId)
          };
          this.http.put(`${this.workflowsUrl}/${wf.id}`, updatedWf).subscribe();
        });
      }
    });
  }
}
