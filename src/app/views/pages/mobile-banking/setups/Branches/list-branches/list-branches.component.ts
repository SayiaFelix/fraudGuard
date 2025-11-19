import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-management',
  templateUrl: './list-branches.component.html',
  styleUrls: ['./list-branches.component.scss']
})
export class ListBranchesComponent implements OnInit {
  isDetailsPanelVisible = false;
  selectedUser: any = null;
  visibleUsers: any[] = [];
  allUsers: any[] = [];
  filteredUsers: any[] = [];
  isLoading = false;
  showPassword = false;

  recordsToShow = 20;
  user: any;

  get totalRecords(): number {
    return this.filteredUsers.length;
  }

  searchTerm = '';
  idFilter = '';
  emailFilter = '';
  roleFilter = '';
  usernameFilter = '';

    currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  
  // Add these filtering properties if not already present
  // searchTerm = '';
  // roleFilter = '';
  // filteredUsers: any[] = [];
  // allUsers: any[] = [];

  addUserForm: FormGroup;
  isAddUserModalVisible = false;

  private apiUrl = 'http://localhost:3000/users';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private toastr: ToastrService
  ) {
    this.addUserForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.applyFiltersAndPagination();
  }

// Apply filters and pagination
applyFiltersAndPagination(): void {
  let users = [...this.allUsers];

  const search = this.searchTerm.trim().toLowerCase();
  if (search) {
    users = users.filter(user =>
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search)
    );
  }

  // Apply role filter
  if (this.roleFilter) {
    users = users.filter(user => user.role === this.roleFilter);
  }

  this.filteredUsers = users;
  this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
  
  // Ensure current page is valid
  if (this.currentPage > this.totalPages && this.totalPages > 0) {
    this.currentPage = 1;
  }
  
  this.updateVisibleUsers();
}

// Update visible users based on current page
updateVisibleUsers(): void {
  const startIndex = (this.currentPage - 1) * this.pageSize;
  const endIndex = startIndex + this.pageSize;
  this.visibleUsers = this.filteredUsers.slice(startIndex, endIndex);
}

// Navigate to specific page
goToPage(page: number): void {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page;
    this.updateVisibleUsers();
  }
}

// Calculate end index for display
getEndIndex(): number {
  return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
}

resetFilters(): void {
  this.searchTerm = '';
  this.usernameFilter = '';
  this.idFilter = '';
  this.emailFilter = '';
  this.roleFilter = '';
  this.currentPage = 1; 
  this.applyFiltersAndPagination();
}

loadUsers(): void {
  this.isLoading = true;
  this.http.get<any[]>(this.apiUrl).subscribe({
    next: (users: any[]) => {
      this.allUsers = users || [];
      this.currentPage = 1; // Reset to first page when data loads
      this.applyFiltersAndPagination();
      this.isLoading = false;
    },
    error: (err: any) => {
      this.toastr.error('Could not load users from mock backend.', 'API Error');
      this.isLoading = false;
    }
  });
}

  // applyFiltersAndPagination(): void {
  //   let users = [...this.allUsers];

  //   const search = this.searchTerm.trim().toLowerCase();
  //   if (search) {
  //     users = users.filter(user =>
  //       user.username?.toLowerCase().includes(search) ||
  //       user.email?.toLowerCase().includes(search) ||
  //       user.role?.toLowerCase().includes(search)
  //     );
  //   }

  //   // Apply role filter
  //   if (this.roleFilter) {
  //     users = users.filter(user => user.role === this.roleFilter);
  //   }

  //   this.filteredUsers = users;
  //   this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
  //   this.updateVisibleUsers();
  // }

  // updateVisibleUsers(): void {
  //   const startIndex = (this.currentPage - 1) * this.pageSize;
  //   const endIndex = startIndex + this.pageSize;
  //   this.visibleUsers = this.filteredUsers.slice(startIndex, endIndex);
  // }

  // goToPage(page: number): void {
  //   if (page >= 1 && page <= this.totalPages) {
  //     this.currentPage = page;
  //     this.updateVisibleUsers();
  //   }
  // }

  // getEndIndex(): number {
  //   return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  // }


//  resetFilters(): void {
//     this.searchTerm = '';
//     this.usernameFilter = '';
//     this.idFilter = '';
//     this.emailFilter = '';
//     this.roleFilter = '';
//     this.applyFiltersAndPagination();
//   }


  // Helper methods for enhanced functionality

  getUsersByRole(role: string): any[] {
  return this.allUsers.filter(user => user.role === role);
}

getRoleIcon(role: string): string {
  const icons: { [key: string]: string } = {
    'CIA': 'fa-user-shield',
    'Auditor': 'fa-user-check',
    'AuditUnit': 'fa-building',
    'Director': 'fa-user-tie',
    'External': 'fa-user-plus'
  };
  return icons[role] || 'fa-user';
}

getRoleDescription(role: string): string {
  const descriptions: { [key: string]: string } = {
    'CIA': 'Chief Internal Auditor',
    'Auditor': 'Internal Auditor',
    'AuditUnit': 'Audit Unit Member',
    'Director': 'Director of Internal Audit',
    'External': 'External Auditor'
  };
  return descriptions[role] || '';
}

getRolePermissions(role: string): string[] {
  const permissions: { [key: string]: string[] } = {
    'CIA': ['Full system access', 'User management', 'Audit oversight', 'Report generation'],
    'Auditor': ['Create audits', 'Manage observations', 'Task management', 'Report viewing'],
    'AuditUnit': ['View assigned audits', 'Submit responses', 'Track progress'],
    'Director': ['Audit approval', 'Team management', 'Performance monitoring'],
    'External': ['Limited audit access', 'Document review', 'Report submission']
  };
  return permissions[role] || ['Basic system access'];
}

sendResetPassword(user: any): void {
  Swal.fire({
    title: 'Password Reset Options',
    html: `
      <div class="text-start">
        <p>Choose how to reset password for <strong>${user.username}</strong>:</p>
        <div class="form-check mb-2">
          <input class="form-check-input" type="radio" name="resetOption" id="emailReset" value="email" checked>
          <label class="form-check-label" for="emailReset">
            <i class="fas fa-envelope text-primary me-2"></i>
            Send reset link to email
          </label>
          <small class="text-muted d-block ms-4">${user.email}</small>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="resetOption" id="temporaryPassword" value="temporary">
          <label class="form-check-label" for="temporaryPassword">
            <i class="fas fa-key text-warning me-2"></i>
            Generate temporary password
          </label>
        </div>
      </div>
    `,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Proceed',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#6c757d',
    customClass: {
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-secondary',
      popup: 'text-start'
    },
    buttonsStyling: false,
    reverseButtons: true,
    preConfirm: () => {
      const selectedOption = document.querySelector('input[name="resetOption"]:checked') as HTMLInputElement;
      return selectedOption?.value || 'email';
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const resetOption = result.value;
      
      if (resetOption === 'email') {
        this.sendPasswordResetEmail(user);
      } else if (resetOption === 'temporary') {
        this.generateTemporaryPassword(user);
      }
    }
  });
}

private sendPasswordResetEmail(user: any): void {
  this.http.post('http://localhost:3000/auth/reset-password', {
    userId: user.id,
    email: user.email,
    type: 'email'
  }).subscribe({
    next: () => {
      Swal.fire({
        title: 'Reset Link Sent!',
        html: `
          <div class="text-center">
            <i class="fas fa-paper-plane fa-3x text-primary mb-3"></i>
            <p>Password reset instructions have been sent to:</p>
            <p class="fw-bold text-primary">${user.email}</p>
            <div class="alert alert-info mt-3 small">
              <i class="fas fa-info-circle me-1"></i>
              The reset link will expire in 24 hours for security.
            </div>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#28a745',
        customClass: {
          confirmButton: 'btn btn-success',
          popup: 'swal-wide'
        },
        buttonsStyling: false
      });
    },
    error: (error) => {
      this.handleResetError(user, 'email', error);
    }
  });
}

private generateTemporaryPassword(user: any): void {
  Swal.fire({
    title: 'Generate Temporary Password?',
    html: `
      <div class="text-start">
        <p>A temporary password will be generated for <strong>${user.username}</strong>.</p>
        <div class="alert alert-warning small">
          <i class="fas fa-exclamation-triangle me-1"></i>
          The user will be forced to change this password on next login.
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Generate Password',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ffc107',
    cancelButtonColor: '#6c757d',
    customClass: {
      confirmButton: 'btn btn-warning',
      cancelButton: 'btn btn-secondary'
    },
    buttonsStyling: false
  }).then((result) => {
    if (result.isConfirmed) {
      this.http.post('http://localhost:3000/auth/temporary-password', {
        userId: user.id,
        email: user.email,
        type: 'temporary'
      }).subscribe({
        next: (response: any) => {
          Swal.fire({
            title: 'Temporary Password Generated!',
            html: `
              <div class="text-center">
                <i class="fas fa-key fa-3x text-warning mb-3"></i>
                <p>Temporary password has been set for:</p>
                <p class="fw-bold">${user.username}</p>
                <div class="alert alert-success mt-3">
                  <strong>Password will be shown once:</strong>
                  <div class="temporary-password mt-2 p-2 bg-light rounded font-monospace">
                    ${response.temporaryPassword}
                  </div>
                  <small class="text-muted d-block mt-2">User must change this on next login.</small>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'Copy Password',
            confirmButtonColor: '#28a745',
            showCancelButton: true,
            cancelButtonText: 'Close',
            customClass: {
              confirmButton: 'btn btn-success',
              cancelButton: 'btn btn-secondary',
              popup: 'swal-wide'
            },
            buttonsStyling: false,
            preConfirm: () => {
              navigator.clipboard.writeText(response.temporaryPassword);
              return response.temporaryPassword;
            }
          }).then((copyResult) => {
            if (copyResult.isConfirmed) {
              this.toastr.success('Password copied to clipboard');
            }
          });
        },
        error: (error) => {
          this.handleResetError(user, 'temporary', error);
        }
      });
    }
  });
}

private handleResetError(user: any, type: string, error: any): void {
  console.error('Password reset error:', error);
  
  Swal.fire({
    title: 'Reset Failed',
    html: `
      <div class="text-center">
        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
        <p>Failed to ${type === 'email' ? 'send reset email' : 'generate temporary password'} for:</p>
        <p class="fw-bold">${user.username}</p>
        <div class="alert alert-danger mt-3 small">
          <i class="fas fa-bug me-1"></i>
          Please try again or contact system administrator.
        </div>
      </div>
    `,
    icon: 'error',
    confirmButtonText: 'Try Again',
    cancelButtonText: 'Cancel',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary'
    },
    buttonsStyling: false
  }).then((result) => {
    if (result.isConfirmed) {
      this.sendResetPassword(user);
    }
  });
}

  showUserDetails(user: any): void {
    if (this.selectedUser && this.selectedUser.id === user.id) {
      this.hideUserDetails();
      return;
    }

    this.selectedUser = { ...user };
    this.isDetailsPanelVisible = true;

    this.getUserById(user.id).subscribe({
      next: (res: any) => {
        this.selectedUser = { ...this.selectedUser, ...res };
      },
      error: (err: any) => {
        console.error('Error fetching user details:', err);
      }
    });
  }

  // Phase badge helper
  getPhaseBadgeClass(phase: string): string {
    switch (phase) {
      case 'Advanced Scoping':
      case 'Planning':
        return 'badge bg-primary';
      case 'Fieldwork':
        return 'badge bg-warning text-dark';
      case 'Reporting':
        return 'badge bg-info';
      case 'Monitoring':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }

  // Role badge helper (single implementation)
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'CIA':
        return 'badge-cia';
      case 'Auditor':
        return 'badge-auditor';
      case 'AuditUnit':
        return 'badge-unit';
      case 'Director': 
        return 'badge-director';
      case 'External': 
        return 'badge-external';
      default:
        return '';
    }
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // loadUsers(): void {
  //   this.isLoading = true;
  //   this.http.get<any[]>(this.apiUrl).subscribe({
  //     next: (users: any[]) => {
  //       this.allUsers = users || [];
  //       this.applyFiltersAndPagination();
  //       this.isLoading = false;
  //     },
  //     error: (err: any) => {
  //       this.toastr.error('Could not load users from mock backend.', 'API Error');
  //       this.isLoading = false;
  //     }
  //   });
  // }

  // applyFiltersAndPagination(): void {
  //   let users = [...this.allUsers];

  //   const search = (this.searchTerm || '').trim().toLowerCase();
  //   if (search) {
  //     users = users.filter(u =>
  //       (u.username || '').toLowerCase().includes(search) ||
  //       (u.email || '').toLowerCase().includes(search) ||
  //       (u.role || '').toLowerCase().includes(search)
  //     );
  //   }

  //   if (this.usernameFilter) {
  //     users = users.filter(u => (u.username || '').toLowerCase().includes(this.usernameFilter.toLowerCase()));
  //   }
  //   if (this.idFilter) {
  //     users = users.filter(u => u.id?.toString().includes(this.idFilter));
  //   }
  //   if (this.emailFilter) {
  //     users = users.filter(u => (u.email || '').toLowerCase().includes(this.emailFilter.toLowerCase()));
  //   }
  //   if (this.roleFilter) {
  //     users = users.filter(u => (u.role || '').toLowerCase().includes(this.roleFilter.toLowerCase()));
  //   }

  //   this.filteredUsers = users;
  //   this.visibleUsers = this.filteredUsers.slice(0, this.recordsToShow);
  // }

 
  loadMoreUsers(): void {
    this.recordsToShow += 20;
    this.visibleUsers = this.filteredUsers.slice(0, this.recordsToShow);
  }

  hideUserDetails(): void {
    this.isDetailsPanelVisible = false;
    this.selectedUser = null;
  }

  openAddUserModal(): void {
    this.addUserForm.reset();
    this.isAddUserModalVisible = true;
  }

  closeAddUserModal(): void {
    this.isAddUserModalVisible = false;
  }

  openEditUserModal(user: any): void {
    this.addUserForm.patchValue({
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role
    });
    this.isAddUserModalVisible = true;
    this.selectedUser = user;
  }

  saveUser(): void {
    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields.', 'Invalid Form');
      return;
    }

    const formData = this.addUserForm.value;

    if (this.selectedUser) {
      this.http.put(`${this.apiUrl}/${this.selectedUser.id}`, {
        ...formData,
        id: this.selectedUser.id
      }).subscribe({
        next: () => {
          Swal.fire('Updated', 'User updated successfully!', 'success');
          this.loadUsers();
          this.closeAddUserModal();
          this.selectedUser = null;
          this.hideUserDetails();
        },
        error: (err: any) => {
          console.error('Update failed:', err);
          Swal.fire('Error', 'Could not update user.', 'error');
        }
      });
    } else {
      const newUser = { ...formData };
      this.http.post(this.apiUrl, newUser).subscribe({
        next: () => {
          Swal.fire('Success', 'User added successfully!', 'success');
          this.loadUsers();
          this.closeAddUserModal();
        },
        error: (err: any) => {
          console.error('Add user failed:', err);
          Swal.fire('Error', 'Could not add user.', 'error');
        }
      });
    }
  }

  deleteUser(id: number): void {
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
            Swal.fire('Deleted!', 'User has been deleted.', 'success');
            this.loadUsers();
            this.hideUserDetails();
          },
          error: (err: any) => {
            Swal.fire('Error', 'Could not delete user.', 'error');
          }
        });
      }
    });
  }
} 