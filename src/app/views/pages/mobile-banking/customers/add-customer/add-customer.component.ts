import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-customer',
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.scss']
})
export class AddCustomerComponent implements OnInit {

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
      private router: Router
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
    this.loadAudits();
  }

  // Load all audits
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

  // Filtering & pagination
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

  // Details Panel
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

  // Save Audit (Add or Update)
  saveAudit(): void {
    if (this.addAuditForm.invalid) {
      this.addAuditForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields.', 'Invalid Form');
      return;
    }

    const formData = this.addAuditForm.value;

    if (this.selectedAudit) {
      // Update
      this.http.put(`${this.apiUrl}/${this.selectedAudit.id}`, {
        ...formData,
        id: this.selectedAudit.id
      }).subscribe({
        next: () => {
          Swal.fire('Updated', 'Audit updated successfully!', 'success');
          this.loadAudits();
          this.closeAddAuditModal();
          this.hideAuditDetails();
          this.selectedAudit = null;
        },
        error: () => {
          Swal.fire('Error', 'Could not update audit.', 'error');
        }
      });
    } else {
      // Create
      const newAudit = {
        ...formData,
        // id: Date.now()
      };
      this.http.post(this.apiUrl, newAudit).subscribe({
        next: () => {
          Swal.fire('Created', 'Audit added successfully!', 'success');
          this.loadAudits();
          this.closeAddAuditModal();
        },
        error: () => {
          Swal.fire('Error', 'Could not add audit.', 'error');
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

}
