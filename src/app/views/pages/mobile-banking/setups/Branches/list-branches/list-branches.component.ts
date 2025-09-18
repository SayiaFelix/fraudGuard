import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

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
    console.log('Hiding details for user:', user);
    this.hideUserDetails();
  } else {
    this.isDetailsPanelVisible = true;
    this.selectedUser = user;
    console.log('Showing details for user:', this.selectedUser); // <-- corrected
  }
}

  loadUsers(): void {
    this.isLoading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (users) => {
        this.allUsers = users;
        console.log('Loaded users:', this.allUsers);
        this.applyFiltersAndPagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load users:', err);
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

  saveUser(): void {
    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields.', 'Invalid Form');
      return;
    }

    const newUser = {
      ...this.addUserForm.value,
      id: Date.now() // simple unique id for mock
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
