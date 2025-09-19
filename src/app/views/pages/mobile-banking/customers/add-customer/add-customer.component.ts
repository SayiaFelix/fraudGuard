import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";

@Component({
  selector: 'app-add-customer',
  templateUrl: './add-customer.component.html',
  styleUrls: ['./add-customer.component.scss']
})
export class AddCustomerComponent implements OnInit {

  audits: any[] = [];
  selectedAudit: any = null;
  isDetailsPanelVisible = false;
  searchTerm = '';

  addAuditForm!: FormGroup;
  isAddModalVisible = false;
  isEditMode = false;

  private apiUrl = 'http://localhost:3000/audits';

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadAudits();

    this.addAuditForm = this.fb.group({
      title: ['', Validators.required],
      scope: ['', Validators.required],
      department: ['', Validators.required],
      status: ['Planned', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required]
    });
  }

  // Load all audits
  loadAudits(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => (this.audits = data),
      error: () => this.toastr.error('Failed to load audits')
    });
  }

  // Show details
  showAuditDetails(audit: any): void {
    if (this.selectedAudit && this.selectedAudit.id === audit.id) {
      this.hideAuditDetails();
    } else {
      this.selectedAudit = audit;
      this.isDetailsPanelVisible = true;
    }
  }

  hideAuditDetails(): void {
    this.isDetailsPanelVisible = false;
    this.selectedAudit = null;
  }

  // Open Add Modal
  openAddAuditModal(): void {
    this.isEditMode = false;
    this.addAuditForm.reset({ status: 'Planned' });
    this.isAddModalVisible = true;
  }

  // Open Edit Modal
  editAudit(audit: any): void {
    this.isEditMode = true;
    this.addAuditForm.patchValue(audit);
    this.selectedAudit = audit;
    this.isAddModalVisible = true;
  }

  // Save (Add or Update)
  saveAudit(): void {
    if (this.addAuditForm.invalid) {
      this.toastr.warning('Fill all fields');
      return;
    }

    const payload = this.addAuditForm.value;

    if (this.isEditMode && this.selectedAudit) {
      // Update
      this.http.put(`${this.apiUrl}/${this.selectedAudit.id}`, payload).subscribe({
        next: () => {
          Swal.fire('Updated', 'Audit updated successfully', 'success');
          this.loadAudits();
          this.closeModal();
        },
        error: () => this.toastr.error('Failed to update audit')
      });
    } else {
      // Create
      const newAudit = { ...payload, id: Date.now() };
      this.http.post(this.apiUrl, newAudit).subscribe({
        next: () => {
          Swal.fire('Created', 'Audit created successfully', 'success');
          this.loadAudits();
          this.closeModal();
        },
        error: () => this.toastr.error('Failed to create audit')
      });
    }
  }

  // Delete
  deleteAudit(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This audit will be deleted permanently!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${id}`).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Audit removed successfully', 'success');
            this.loadAudits();
            this.hideAuditDetails();
          },
          error: () => this.toastr.error('Delete failed')
        });
      }
    });
  }

  // Close modal
  closeModal(): void {
    this.isAddModalVisible = false;
    this.addAuditForm.reset({ status: 'Planned' });
  }

  // Navigation placeholder
  openObservations(audit: any): void {
    this.toastr.info(`Opening observations for: ${audit.title}`);
  }

  // Search filter
  applyFilters(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (res) => {
        this.audits = res.filter(
          (a) =>
            a.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
            a.department.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      },
    });
  }
}
