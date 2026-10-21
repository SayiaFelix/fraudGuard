
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

import { HttpService } from 'src/app/shared/services/http.service';
import { AuthService } from 'src/app/shared/services/auth.service';

interface ManagedUser {
  id: number | string;
  username: string;
  email: string;
  role: string;
  is_active?: boolean;
  created_at?: string | null;
  last_login?: string | null;
  [key: string]: any;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './list-branches.component.html',
  styleUrls: ['./list-branches.component.scss']
})
export class ListBranchesComponent implements OnInit {

  // User listing
  allUsers: ManagedUser[] = [];
  filteredUsers: ManagedUser[] = [];
  visibleUsers: ManagedUser[] = [];

  selectedUser: ManagedUser | null = null;
  isDetailsPanelVisible = false;

  // Loading states
  isLoading = false;
  isSavingUser = false;
  isResendingInvitation = false;
  isResettingPassword = false;

  // Search and filtering
  searchTerm = '';
  idFilter = '';
  emailFilter = '';
  roleFilter = '';
  usernameFilter = '';

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  recordsToShow = 20;

  // Invite user modal
  addUserForm: FormGroup;
  isAddUserModalVisible = false;

  // Supported backend roles
  roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'analyst', label: 'Risk Analyst' },
    { value: 'investigator', label: 'Fraud Investigator' },
    { value: 'compliance', label: 'Compliance Officer' },
    { value: 'viewer', label: 'Viewer (Read-only)' }
  ];

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private toastr: ToastrService,
    private authService: AuthService
  ) {
    // No password field: backend generates
    // and emails the temporary password.
    this.addUserForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.pattern(/\S/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  get totalRecords(): number {
    return this.filteredUsers.length;
  }

  // =====================================================
  // API ERROR HANDLING
  // =====================================================

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your connection.';
    }

    if (error.status === 401) {
      return 'Your session has expired or is invalid. Please log in again.';
    }

    if (error.status === 403) {
      return 'You do not have permission to perform this operation.';
    }

    if (error.status === 409) {
      return error.error?.error ||
        error.error?.message ||
        'A user with these details already exists.';
    }

    const detail = error.error?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail.map((item: any) =>
        item.msg || item.message || 'Invalid input'
      ).join('; ');
    }

    return error.error?.error ||
      error.error?.message ||
      error.message ||
      'An unexpected error occurred.';
  }

  // =====================================================
  // GET USERS
  // GET /v1/api/admin/users
  // =====================================================

  loadUsers(): void {
    this.isLoading = true;

    this.httpService.UserGet('/admin/users').subscribe({
      next: (response: any) => {

        // Support common response envelopes.
        // The actual backend response must be verified.
        let users: any = null;

        if (Array.isArray(response)) {
          users = response;
        } else if (Array.isArray(response?.users)) {
          users = response.users;
        } else if (Array.isArray(response?.data?.users)) {
          users = response.data.users;
        } else if (Array.isArray(response?.data)) {
          users = response.data;
        }

        if (!Array.isArray(users)) {
          this.isLoading = false;

          this.toastr.error(
            'The server returned an unexpected users response.',
            'Invalid API Response'
          );
          return;
        }

        this.allUsers = users;
        this.currentPage = 1;

        // Refresh selected user if detail panel is open
        if (this.selectedUser) {
          const refreshedUser = this.allUsers.find(
            user => user.id === this.selectedUser?.id
          );

          if (refreshedUser) {
            this.selectedUser = { ...refreshedUser };
          } else {
            this.hideUserDetails();
          }
        }

        this.applyFiltersAndPagination();
        this.isLoading = false;
      },

      error: (error: any) => {
        this.isLoading = false;

        Swal.fire({
          title: 'Unable to Load Users',
          text: this.getErrorMessage(error),
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
      }
    });
  }

  // =====================================================
  // FILTERING
  // =====================================================

  resetFilters(): void {
    this.searchTerm = '';
    this.usernameFilter = '';
    this.idFilter = '';
    this.emailFilter = '';
    this.roleFilter = '';

    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  applyFiltersAndPagination(): void {
    let users = [...this.allUsers];

    const search = this.searchTerm.trim().toLowerCase();

    if (search) {
      users = users.filter(user =>
        (user.username || '').toLowerCase().includes(search) ||
        (user.email || '').toLowerCase().includes(search) ||
        (user.role || '').toLowerCase().includes(search)
      );
    }

    if (this.roleFilter) {
      users = users.filter(
        user => user.role === this.roleFilter
      );
    }

    this.filteredUsers = users;
    this.totalPages = Math.max(
      1,
      Math.ceil(this.filteredUsers.length / this.pageSize)
    );

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.updateVisibleUsers();
  }

  // =====================================================
  // PAGINATION
  // =====================================================

  onPageSizeChange(): void {
    this.pageSize = Number(this.pageSize);
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  updateVisibleUsers(): void {
    const startIndex =
      (this.currentPage - 1) * this.pageSize;

    const endIndex = startIndex + this.pageSize;

    this.visibleUsers = this.filteredUsers.slice(
      startIndex,
      endIndex
    );
  }

  getStartIndex(): number {
    if (this.filteredUsers.length === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredUsers.length
    );
  }

  goToPage(page: number): void {
    if (
      page >= 1 &&
      page <= this.totalPages &&
      page !== this.currentPage
    ) {
      this.currentPage = page;
      this.updateVisibleUsers();
    }
  }

  goToPageNumber(page: number | string): void {
    if (typeof page === 'number') {
      this.goToPage(page);
    }
  }

  getPageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;

    const range: (number | string)[] = [];

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== '...') {
        range.push('...');
      }
    }

    return range;
  }

  // =====================================================
  // USER DETAILS
  // =====================================================

  showUserDetails(user: ManagedUser): void {
    if (
      this.selectedUser &&
      this.selectedUser.id === user.id &&
      this.isDetailsPanelVisible
    ) {
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

  closeDetailsPanel(): void {
    this.hideUserDetails();
  }

  // =====================================================
  // OPEN INVITE USER MODAL
  // =====================================================

  openAddUserModal(): void {
    this.addUserForm.reset({
      username: '',
      email: '',
      role: ''
    });

    this.isAddUserModalVisible = true;
  }

  closeAddUserModal(): void {
    if (this.isSavingUser) {
      return;
    }

    this.isAddUserModalVisible = false;

    this.addUserForm.reset({
      username: '',
      email: '',
      role: ''
    });
  }

  // =====================================================
  // INVITE USER
  // POST /v1/api/admin/users/invite
  // =====================================================

  saveUser(): void {
    if (this.isSavingUser) {
      return;
    }

    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();

      this.toastr.warning(
        'Please provide a valid username, email and role.',
        'Invalid Form'
      );
      return;
    }

    const formData = this.addUserForm.value;

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      role: formData.role
    };

    this.isSavingUser = true;

    this.httpService.userPost(
      '/admin/users/invite',
      payload
    ).subscribe({

      next: () => {
        this.isSavingUser = false;
        this.closeAddUserModal();

        Swal.fire({
          title: 'Invitation Sent!',
          html: `
            <div class="text-center">
              <i class="fas fa-envelope-open-text
                        fa-3x text-success mb-3"></i>

              <p>The user invitation was created successfully.</p>

              <p>
                A temporary password has been sent to
                the user's registered email address.
              </p>

              <div class="alert alert-info mt-3">
                <i class="fas fa-clock me-2"></i>
                <strong>Temporary password validity:</strong>
                10 minutes
              </div>

              <p class="small text-muted">
                The user must log in and set a permanent
                password before accessing the system.
              </p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        });

        this.loadUsers();
      },

      error: (error: any) => {
        this.isSavingUser = false;

        Swal.fire({
          title: 'Invitation Failed',
          text: this.getErrorMessage(error),
          icon: 'error',
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#dc3545'
        });
      }
    });
  }

  // =====================================================
  // RESEND INVITATION
  // POST /v1/api/admin/users/{id}/resend-invitation
  // =====================================================

  resendInvitation(user: ManagedUser): void {
    if (this.isResendingInvitation) {
      return;
    }

    Swal.fire({
      title: 'Resend Invitation?',
      text:
        `A new temporary password will be sent to ${user.email}. ` +
        'Previous temporary credentials and sessions will be invalidated.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Resend Invitation',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d'
    }).then(result => {

      if (!result.isConfirmed) {
        return;
      }

      this.isResendingInvitation = true;

      this.httpService.userPost(
        `/admin/users/${encodeURIComponent(String(user.id))}/resend-invitation`,
        {}
      ).subscribe({

        next: () => {
          this.isResendingInvitation = false;

          Swal.fire({
            title: 'Invitation Resent!',
            text:
              'A fresh temporary password has been emailed. ' +
              'It is valid for 10 minutes.',
            icon: 'success',
            confirmButtonColor: '#28a745'
          });

          this.loadUsers();
        },

        error: (error: any) => {
          this.isResendingInvitation = false;

          Swal.fire({
            title: 'Failed to Resend Invitation',
            text: this.getErrorMessage(error),
            icon: 'error',
            confirmButtonColor: '#dc3545'
          });
        }
      });
    });
  }

  // =====================================================
  // RESET PASSWORD
  // POST /v1/api/admin/users/{id}/reset-password
  // =====================================================

  sendResetPassword(user: ManagedUser): void {
    if (this.isResettingPassword) {
      return;
    }

    Swal.fire({
      title: 'Reset User Password?',
      text:
        `Reset the password for ${user.username}? ` +
        `A new temporary password will be emailed to ${user.email}. ` +
        'Existing sessions will be invalidated.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Reset Password',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then(result => {

      if (!result.isConfirmed) {
        return;
      }

      this.isResettingPassword = true;

      this.httpService.userPost(
        `/admin/users/${encodeURIComponent(String(user.id))}/reset-password`,
        {}
      ).subscribe({

        next: () => {
          this.isResettingPassword = false;

          Swal.fire({
            title: 'Password Reset Successful!',
            text:
              'A new temporary password has been emailed ' +
              'to the user. It is valid for 10 minutes.',
            icon: 'success',
            confirmButtonColor: '#28a745'
          });

          this.loadUsers();
        },

        error: (error: any) => {
          this.isResettingPassword = false;

          Swal.fire({
            title: 'Password Reset Failed',
            text: this.getErrorMessage(error),
            icon: 'error',
            confirmButtonColor: '#dc3545'
          });
        }
      });
    });
  }

  // =====================================================
  // ROLE DISPLAY HELPERS
  // =====================================================

  getAvatarClass(role: string): string {
    const classes: { [key: string]: string } = {
      admin: 'avatar-admin',
      analyst: 'avatar-analyst',
      investigator: 'avatar-investigator',
      compliance: 'avatar-compliance',
      viewer: 'avatar-viewer'
    };

    return classes[role] || 'avatar-default';
  }

  getRoleBadgeClass(role: string): string {
    const classes: { [key: string]: string } = {
      admin: 'bg-danger',
      analyst: 'bg-info',
      investigator: 'bg-warning text-dark',
      compliance: 'bg-success',
      viewer: 'bg-secondary'
    };

    return classes[role] || 'bg-secondary';
  }

  getRoleIcon(role: string): string {
    const icons: { [key: string]: string } = {
      admin: 'fa-user-shield',
      analyst: 'fa-chart-line',
      investigator: 'fa-search',
      compliance: 'fa-gavel',
      viewer: 'fa-eye'
    };

    return icons[role] || 'fa-user';
  }

  getRoleDescription(role: string): string {
    const descriptions: { [key: string]: string } = {
      admin: 'System Administrator',
      analyst: 'Risk Analyst',
      investigator: 'Fraud Investigator',
      compliance: 'Compliance Officer',
      viewer: 'Viewer (Read-only)'
    };

    return descriptions[role] || role;
  }

  getRolePermissions(role: string): string[] {
    // Existing frontend role descriptions.
    // Actual permissions must be enforced by the backend.
    const permissions: { [key: string]: string[] } = {
      admin: [
        'Full system access',
        'User management',
        'System settings & configuration',
        'Audit logs & compliance monitoring',
        'Toggle Sovereign Mode',
        'Toggle National Alert Mode',
        'View all fraud analytics & reports',
        'Model management & retraining'
      ],
      analyst: [
        'Real-time transaction monitoring',
        'Risk scoring & assessment',
        'View fraud analytics dashboard',
        'Generate fraud reports',
        'Transaction search & filtering',
        'Export transaction data',
        'View model performance metrics'
      ],
      investigator: [
        'Advanced fraud case investigation',
        'Transaction relationship mapping',
        'Case management & documentation',
        'Related transaction discovery',
        'Investigation notes & findings',
        'Submit fraud confirmation feedback',
        'Investigation report generation'
      ],
      compliance: [
        'Regulatory compliance reports',
        'Audit trail review',
        'Policy violation detection',
        'Document review & approval',
        'Central bank reporting',
        'Compliance checklists',
        'SAR generation'
      ],
      viewer: [
        'View dashboard analytics',
        'Read fraud reports (read-only)',
        'Basic transaction search',
        'View risk trends',
        'Export reports (limited)',
        'Monitor system status'
      ]
    };

    return permissions[role] || [
      'Basic system access'
    ];
  }

  getRolesWithUsers(): {
    name: string;
    displayName: string;
    count: number;
    color: string;
  }[] {
    const roles = [
      {
        name: 'admin',
        displayName: 'Admins',
        color: 'success'
      },
      {
        name: 'analyst',
        displayName: 'Analysts',
        color: 'info'
      },
      {
        name: 'investigator',
        displayName: 'Investigators',
        color: 'warning'
      },
      {
        name: 'compliance',
        displayName: 'Compliance',
        color: 'secondary'
      },
      {
        name: 'viewer',
        displayName: 'Viewers',
        color: 'muted'
      }
    ];

    return roles.map(role => ({
      ...role,
      count: this.getUsersByRole(role.name).length
    })).filter(role => role.count > 0);
  }

  getRoleColorClass(roleName: string): string {
    const colors: { [key: string]: string } = {
      admin: 'text-success',
      analyst: 'text-info',
      investigator: 'text-warning',
      compliance: 'text-secondary',
      viewer: 'text-muted'
    };

    return colors[roleName] || 'text-primary';
  }

  getUsersByRole(role: string): ManagedUser[] {
    return this.allUsers.filter(
      user => user.role === role
    );
  }
}
