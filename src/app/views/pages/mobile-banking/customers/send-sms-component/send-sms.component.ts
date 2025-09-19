import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef 
} from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import { GlobalService } from 'src/app/shared/services/global.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import Swal from "sweetalert2";
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';

interface Trigger {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  training_phrases?: string[]; 
  is_root?: boolean; 
}

@Component({
  selector: 'app-list-mobile-app',
  templateUrl: './send-sms.component.html',
  styleUrls: ['./send-sms.component.scss'],
})
export class SendSmsComponent implements OnInit {
  auditId!: string | null ;
  auditTitle = '';
  observations: any[] = [];
  isLoading = false;

  searchTerm = '';
  filteredObservations: any[] = [];


  isAddEditModalVisible = false;
  isEditMode = false;
  selectedObservation: any = null;
  observationForm: FormGroup;
  severityFilter = '';
  statusFilter = '';

  private apiUrl = 'http://localhost:3000/observations';
  private auditsUrl = 'http://localhost:3000/audits';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.observationForm = this.fb.group({
      description: ['', Validators.required],
      severity: ['Medium', Validators.required],
      status: ['Open', Validators.required],
      recommendation: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.auditId = this.route.snapshot.paramMap.get('auditId')!;
    this.loadAuditTitle();
    this.loadObservations();
  }

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

  // 🔹 Reset everything
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

  closeModal(): void {
    this.isAddEditModalVisible = false;
  }

  saveObservation(): void {
    if (this.observationForm.invalid) {
      this.observationForm.markAllAsTouched();
      this.toastr.warning('Please fill all fields');
      return;
    }

    const formData = {
      ...this.observationForm.value,
      auditId: this.auditId,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    if (this.isEditMode && this.selectedObservation) {
      this.http.put(`${this.apiUrl}/${this.selectedObservation.id}`, {
        ...formData,
        id: this.selectedObservation.id
      }).subscribe({
        next: () => {
          Swal.fire('Updated!', 'Observation updated successfully', 'success');
          this.loadObservations();
          this.closeModal();
        },
        error: () => this.toastr.error('Failed to update observation')
      });
    } else {
      this.http.post(this.apiUrl, formData).subscribe({
        next: () => {
          Swal.fire('Created!', 'Observation added successfully', 'success');
          this.loadObservations();
          this.closeModal();
        },
        error: () => this.toastr.error('Failed to create observation')
      });
    }
  }

  deleteObservation(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This observation will be deleted permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then(result => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Observation deleted', 'success');
            this.loadObservations();
          },
          error: () => this.toastr.error('Failed to delete observation')
        });
      }
    });
  }
}