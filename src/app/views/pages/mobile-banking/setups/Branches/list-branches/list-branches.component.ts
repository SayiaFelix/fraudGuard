// user-management.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';
import { AuthService } from 'src/app/shared/services/auth.service';

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
  
  addUserForm: FormGroup;
  isAddUserModalVisible = false;

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private toastr: ToastrService,
    private authService: AuthService
  ) {
    this.addUserForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.applyFiltersAndPagination();
  }

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

    if (this.roleFilter) {
      users = users.filter(user => user.role === this.roleFilter);
    }

    this.filteredUsers = users;
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
    
    this.updateVisibleUsers();
  }

  updateVisibleUsers(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.visibleUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateVisibleUsers();
    }
  }

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

  getUsersByRole(role: string): any[] {
    return this.allUsers.filter(user => user.role === role);
  }

  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      'admin': 'fa-user-shield',
      'analyst': 'fa-user-check',
      'investigator': 'fa-search',
      'compliance': 'fa-building',
      'viewer': 'fa-eye'
    };
    return icons[role] || 'fa-user';
  }

  getRoleDescription(role: string): string {
    const descriptions: { [key: string]: string } = {
      'admin': 'System Administrator',
      'analyst': 'Risk Analyst',
      'investigator': 'Fraud Investigator',
      'compliance': 'Compliance Officer',
      'viewer': 'Viewer (Read-only)'
    };
    return descriptions[role] || '';
  }

  getRolePermissions(role: string): string[] {
    const permissions: { [key: string]: string[] } = {
      'admin': ['Full system access', 'User management', 'System settings', 'Audit logs', 'All features'],
      'analyst': ['Transaction analysis', 'Risk scoring', 'View reports', 'Generate insights'],
      'investigator': ['Case management', 'Investigation tools', 'Evidence collection', 'Report generation'],
      'compliance': ['Compliance reports', 'Audit trails', 'Regulatory checks', 'Document review'],
      'viewer': ['View dashboards', 'Read reports', 'Basic search']
    };
    return permissions[role] || ['Basic system access'];
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'badge-admin';
      case 'analyst':
        return 'badge-analyst';
      case 'investigator':
        return 'badge-investigator';
      case 'compliance':
        return 'badge-compliance';
      case 'viewer':
        return 'badge-viewer';
      default:
        return '';
    }
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
    this.httpService.userPost(`/admin/users/${user.id}/reset-password`, { type: 'email' }).subscribe({
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
      error: (error: any) => {
        this.handleResetError(user, 'email', error);
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
            ${error.error?.error || 'Please try again or contact system administrator.'}
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
  }

  hideUserDetails(): void {
    this.isDetailsPanelVisible = false;
    this.selectedUser = null;
  }

  openAddUserModal(): void {
    this.addUserForm.reset();
    this.selectedUser = null;
    this.isAddUserModalVisible = true;
  }

  closeAddUserModal(): void {
    this.isAddUserModalVisible = false;
    this.selectedUser = null;
  
  }

  openEditUserModal(user: any): void {
    this.addUserForm.patchValue({
      username: user.username,
      email: user.email,
      role: user.role
    });
    // Don't patch password for edit
    this.addUserForm.get('password')?.clearValidators();
    this.addUserForm.get('password')?.updateValueAndValidity();
    
    this.selectedUser = user;
    this.isAddUserModalVisible = true;
  }

loadUsers(): void {
  this.isLoading = true;
  
  this.httpService.UserGet('/admin/users').subscribe({
    next: (response: any) => {
      if (response.status === 'success' && response.users) {
        this.allUsers = response.users;
        this.currentPage = 1;
        this.applyFiltersAndPagination();
        console.log('Users loaded:', this.allUsers.length);
      } else {
        this.allUsers = [];
      }
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Error loading users:', err);
      if (err.status === 401) {
        this.toastr.error('Session expired. Please login again.', 'Authentication Error');
      } else {
        this.toastr.error(err.error?.message || 'Could not load users from server.', 'API Error');
      }
      this.isLoading = false;
    }
  });
}

saveUser(): void {
  if (this.addUserForm.invalid) {
    this.addUserForm.markAllAsTouched();
    this.toastr.warning('Please fill all required fields.', 'Invalid Form');
    return;
  }

  const formData = this.addUserForm.value;

  if (this.selectedUser) {

    this.httpService.updateUser(this.selectedUser.id, {
      username: formData.username,
      email: formData.email,
      role: formData.role,
      password: formData.password || undefined
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
        Swal.fire('Error', err.error?.error || 'Could not update user.', 'error');
      }
    });
  } else {
 
    this.httpService.adminCreateUser({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      role: formData.role
    }).subscribe({
      next: () => {
        Swal.fire('Success', 'User added successfully!', 'success');
        this.loadUsers();
        this.closeAddUserModal();
      },
      error: (err: any) => {
        console.error('Add user failed:', err);
        Swal.fire('Error', err.error?.error || 'Could not add user.', 'error');
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
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#d33'
  }).then(result => {
    if (result.isConfirmed) {
      this.httpService.userDelete(`/admin/users/${id}`).subscribe({
        next: () => {
          Swal.fire('Deleted!', 'User has been deleted.', 'success');
          this.loadUsers();
          this.hideUserDetails();
        },
        error: (err: any) => {
          console.error('Delete failed:', err);
          Swal.fire('Error', err.error?.error || 'Could not delete user.', 'error');
        }
      });
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
      this.httpService.userPost(`/admin/users/${user.id}/reset-password`, { type: 'temporary' }).subscribe({
        next: (response: any) => {
          Swal.fire({
            title: 'Temporary Password Generated!',
            html: `
              <div class="text-center">
                <i class="fas fa-key fa-3x text-warning mb-3"></i>
                <p>Temporary password has been set for:</p>
                <p class="fw-bold">${user.username}</p>
                <div class="alert alert-success mt-3">
                  <strong>Temporary Password:</strong>
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
              this.toastr.success('Password copied to clipboard');
              return response.temporaryPassword;
            }
          });
        },
        error: (error: any) => {
          this.handleResetError(user, 'temporary', error);
        }
      });
    }
  });
}

enableUser(user: any): void {
  Swal.fire({
    title: 'Enable User?',
    text: `Are you sure you want to enable ${user.username}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, enable!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#28a745'
  }).then(result => {
    if (result.isConfirmed) {
      this.httpService.userPut(`/admin/users/${user.id}/enable`, {}).subscribe({
        next: () => {
          Swal.fire('Enabled', 'User has been enabled.', 'success');
          this.loadUsers();
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.error || 'Could not enable user.', 'error');
        }
      });
    }
  });
}

// Disable user
disableUserAccount(user: any): void {
  Swal.fire({
    title: 'Disable User?',
    text: `Are you sure you want to disable ${user.username}? They will not be able to login.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, disable!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc3545'
  }).then(result => {
    if (result.isConfirmed) {
      this.httpService.userPut(`/admin/users/${user.id}/disable`, {}).subscribe({
        next: () => {
          Swal.fire('Disabled', 'User has been disabled.', 'success');
          this.loadUsers();
        },
        error: (err: any) => {
          Swal.fire('Error', err.error?.error || 'Could not disable user.', 'error');
        }
      });
    }
  });
}

getUserDetails(userId: number): void {
  this.httpService.getUserById(userId).subscribe({
    next: (response: any) => {
      if (response.status === 'success' && response.user) {
        this.selectedUser = response.user;
        this.isDetailsPanelVisible = true;
      }
    },
    error: (err: any) => {
      console.error('Error fetching user details:', err);
      this.toastr.error('Could not load user details');
    }
  });
}
}