import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { map, Observable } from 'rxjs';

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
  }

  showUserDetails(user: any): void {

    if (this.selectedUser && this.selectedUser.id === user.id) {
      this.hideUserDetails();
      return;
    }

  this.selectedUser = { ...user };
  this.isDetailsPanelVisible = true;
  
  console.log('Fetching details for user id:', user.id);

  this.getUserById(user.id).subscribe({
    next: (res) => {
      this.selectedUser = { ...this.selectedUser, ...res };
      console.log('Fetched user details:', this.selectedUser);
    },
    error: (err) => {
      console.error('Error fetching user details:', err);
    }
  });
}

getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'Auditor': return 'bg-info';
    case 'CIA': return 'bg-success';
    case 'AuditUnit': return 'bg-warning text-dark';
    default: return 'bg-secondary';
  }
}

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }


  loadUsers(): void {
    this.isLoading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (users) => {
        this.allUsers = users;
        this.applyFiltersAndPagination();
        this.isLoading = false;
      },
      error: (err) => {
        this.toastr.error('Could not load users from mock backend.', 'API Error');
        this.isLoading = false;
      }
    });
  }

  applyFiltersAndPagination(): void {
    let users = [...this.allUsers];

    const search = this.searchTerm.trim().toLowerCase();
    if (search) {
      users = users.filter(u =>
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.role.toLowerCase().includes(search)
      );
    }

    if (this.usernameFilter) {
      users = users.filter(u => u.username.toLowerCase().includes(this.usernameFilter.toLowerCase()));
    }
    if (this.idFilter) {
      users = users.filter(u => u.id.toString().includes(this.idFilter));
    }
    if (this.emailFilter) {
      users = users.filter(u => u.email.toLowerCase().includes(this.emailFilter.toLowerCase()));
    }
    if (this.roleFilter) {
      users = users.filter(u => u.role.toLowerCase().includes(this.roleFilter.toLowerCase()));
    }

    this.filteredUsers = users;
    this.visibleUsers = this.filteredUsers.slice(0, this.recordsToShow);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.usernameFilter = '';
    this.idFilter = '';
    this.emailFilter = '';
    this.roleFilter = '';
    this.applyFiltersAndPagination();
  }

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
  this.selectedUser = user; // keep track for update
}

saveUser(): void {
  if (this.addUserForm.invalid) {
    this.addUserForm.markAllAsTouched();
    this.toastr.warning('Please fill all required fields.', 'Invalid Form');
    return;
  }

  const formData = this.addUserForm.value;

  if (this.selectedUser) {
    // 🟢 Update existing user
    this.http.put(`${this.apiUrl}/${this.selectedUser.id}`, {
      ...formData,
      id: this.selectedUser.id
    }).subscribe({
      next: () => {
        Swal.fire('Updated', 'User updated successfully!', 'success');
        this.loadUsers();
        this.closeAddUserModal();
        this.selectedUser = null; // clear selection
        this.hideUserDetails();
        
      },
      error: (err) => {
        console.error('Update failed:', err);
        Swal.fire('Error', 'Could not update user.', 'error');
      }
    });
  } else {
    const newUser = {
      ...formData,
      // id: Date.now()
    };
    this.http.post(this.apiUrl, newUser).subscribe({
      next: () => {
        Swal.fire('Success', 'User added successfully!', 'success');
        this.loadUsers();
        this.closeAddUserModal();
      },
      error: (err) => {
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
        error: (err) => {
          Swal.fire('Error', 'Could not delete user.', 'error');
        }
      });
    }
  });
}
}
