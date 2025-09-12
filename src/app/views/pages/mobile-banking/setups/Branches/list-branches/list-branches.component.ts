import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from 'src/app/shared/services/http.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { forkJoin, Observable } from 'rxjs'; // Import forkJoin for parallel API calls

@Component({
  selector: 'app-list-branches',
  templateUrl: './list-branches.component.html',
  styleUrls: ['./list-branches.component.scss']
})
export class ListBranchesComponent implements OnInit {

  isDetailsPanelVisible = false;
  selectedPerson: any = null;
  visiblePeople: any[] = [];
  allPeople: any[] = [];
  filteredPeople: any[] = [];
  isLoading = false;

  recordsToShow = 20;

  get totalRecords(): number {
    return this.filteredPeople.length;
  }
  
  searchTerm = '';
  nameFilter = '';
  idFilter = '';
  emailFilter = '';
  locationFilter = ''; // Renamed from 'locationFilter' to 'roleFilter' in concept for HTML below

  addPersonForm: FormGroup;
  isAddPersonModalVisible = false;

  constructor(
    private fb: FormBuilder,
    private httpService: HttpService,
    private toastr: ToastrService
  ) {
    this.addPersonForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['CREATOR', Validators.required], 
      // phone: [''] // REMOVED: Phone control from FormGroup, as per instruction
    });
  }

  ngOnInit(): void {
    this.loadPeopleData();
  }

  private getUserRole(): string {
    const role = localStorage.getItem('user_role');
    return role ? role.toUpperCase() : 'UNKNOWN';
  }

  private mapApiDataToPerson(user: any): any { // Simplified: 'role' now comes directly from 'user' object
    return {
      id: user.id,
      name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(), // Use 'name' if available, otherwise construct
      email: user.email,
      // The API response explicitly has 'role', so map 'location' to 'role' for display compatibility
      location: user.role || 'N/A', 
      country: user.country || 'N/A', // Assuming API might provide these
      ipAddress: user.ip_address || 'N/A', 
      phone: user.phone || 'N/A', // If API ever returns phone, it'll be here. Else N/A.
      selected: false
    };
  }

  // --- Functions for the main page (table, filters, side panel) ---

  // *** UPDATED: loadPeopleData to use the single /auth/admin/users/list API ***
  loadPeopleData(): void {
    this.isLoading = true;
    this.allPeople = []; // Reset the list before loading fresh data
    const userRole = this.getUserRole();
    console.log('Detected user role:', userRole);

    // Assuming the 'auth/admin/users/list' endpoint returns all users an admin/creator can see.
    // The role-specific logic is handled by the backend's authorization.
    if (userRole === 'ADMIN' || userRole === 'CREATOR') {
      this.httpService.mobileBankingGet('auth/admin/users/list', {}).subscribe({
        next: (result: any) => {
          console.log('Users list API result:', result);

          if (result.status === '00' && Array.isArray(result?.data)) {
            // Map the API data to our frontend person object
            this.allPeople = result.data.map((user: any) => this.mapApiDataToPerson(user));
            console.log('Combined people list (API data):', this.allPeople); 
          } else {
            this.allPeople = [];
            console.warn('API did not return an array of data or status not 00:', result);
          }
          
          this.applyFiltersAndPagination();
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Failed to load user data:', err);
          this.toastr.error('Could not load user data from the server.', 'API Error');
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
      this.toastr.warning('You do not have permission to view this page.');
      console.warn('Unknown user role or unauthorized:', userRole);
    }
  }

  applyFiltersAndPagination(): void {
    let people = [...this.allPeople];

    const lowercasedTerm = this.searchTerm.trim().toLowerCase();
    if (lowercasedTerm) {
      people = people.filter(p =>
        Object.values(p).some(val => 
          String(val).toLowerCase().includes(lowercasedTerm)
        )
      );
    }

    const lowercasedNameFilter = this.nameFilter.trim().toLowerCase();
    if (lowercasedNameFilter) {
      people = people.filter(p => p.name?.toLowerCase().includes(lowercasedNameFilter));
    }
    const lowercasedIdFilter = this.idFilter.trim().toLowerCase();
    if (lowercasedIdFilter) {
      people = people.filter(p => p.id?.toString().toLowerCase().includes(lowercasedIdFilter));
    }
    const lowercasedEmailFilter = this.emailFilter.trim().toLowerCase();
    if (lowercasedEmailFilter) {
      people = people.filter(p => p.email?.toLowerCase().includes(lowercasedEmailFilter));
    }
    const lowercasedRoleFilter = this.locationFilter.trim().toLowerCase(); // Using locationFilter for Role
    if (lowercasedRoleFilter) {
      people = people.filter(p => p.location?.toLowerCase().includes(lowercasedRoleFilter));
    }

    this.filteredPeople = people;
    this.visiblePeople = this.filteredPeople.slice(0, this.recordsToShow);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.nameFilter = '';
    this.idFilter = '';
    this.emailFilter = '';
    this.locationFilter = ''; // This now acts as roleFilter
    this.applyFiltersAndPagination();
  }

  loadMorePeople(): void {
    this.recordsToShow += 20;
    this.visiblePeople = this.filteredPeople.slice(0, this.recordsToShow);
  }

  showPersonDetails(person: any): void {
    this.selectedPerson = person;
    this.isDetailsPanelVisible = true;
  }

  hidePersonDetails(): void {
    this.isDetailsPanelVisible = false;
    this.selectedPerson = null;
  }

  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    this.visiblePeople.forEach(person => person.selected = isChecked);
    
    this.allPeople.forEach(person => {
      const visiblePerson = this.visiblePeople.find(vp => vp.id === person.id);
      if (visiblePerson) {
        person.selected = isChecked;
      }
    });
    
    this.filteredPeople.forEach(person => {
      const visiblePerson = this.visiblePeople.find(vp => vp.id === person.id);
      if (visiblePerson) {
        person.selected = isChecked;
      }
    });
  }

  togglePersonSelection(person: any, event: any): void {
    const isChecked = event.target.checked;
    person.selected = isChecked;
    
    const allPersonIndex = this.allPeople.findIndex(p => p.id === person.id);
    if (allPersonIndex !== -1) {
      this.allPeople[allPersonIndex].selected = isChecked;
    }
    
    const filteredPersonIndex = this.filteredPeople.findIndex(p => p.id === person.id);
    if (filteredPersonIndex !== -1) {
      this.filteredPeople[filteredPersonIndex].selected = isChecked;
    }
  }

  areAllSelected(): boolean {
    return this.visiblePeople.length > 0 && this.visiblePeople.every(person => person.selected);
  }

  areSomeSelected(): boolean {
    return this.visiblePeople.some(person => person.selected) && !this.areAllSelected();
  }

  getSelectedPeople(): any[] {
    return this.allPeople.filter(person => person.selected);
  }

  clearAllSelections(): void {
    this.allPeople.forEach(person => person.selected = false);
    this.filteredPeople.forEach(person => person.selected = false);
    this.visiblePeople.forEach(person => person.selected = false);
  }

  openAddPersonModal(): void {
    this.addPersonForm.reset({ role: 'CREATOR' }); // Default to CREATOR as per select options
    this.isAddPersonModalVisible = true; 
  }

  closeAddPersonModal(): void {
    this.isAddPersonModalVisible = false;
  }

  savePerson(): void {
    if (this.addPersonForm.invalid) {
      this.addPersonForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields correctly.', 'Invalid Form');
      return;
    }
    
    const formData = this.addPersonForm.value;
    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      role: formData.role,
      // phone: formData.phone // REMOVED: 'phone' from the API payload
    };

    console.log('Sending payload to register-user:', payload); 
    this.httpService.mobileBankingPost('auth/admin/register-user', payload).subscribe({
      next: (result: any) => {
        if (result.status === '00' || result.message === "Creator registered successfully.") {
          
          Swal.fire('Success', result.message || 'Person added successfully!', 'success');
          
          // CRITICAL: Re-fetch all data from the API after a successful add
          this.loadPeopleData(); 

          this.closeAddPersonModal();
        } else {
          Swal.fire('Error', result.message || 'An unexpected error occurred.', 'error');
        }
      },
      error: (err: any) => {
        console.error('API call failed:', err);
        let errorMessage = 'Could not connect to the server. Please try again.';

        if (err.error && typeof err.error === 'object' && err.error.message) {
            errorMessage = err.error.message;
        } else if (err.status) { // Check for status only if err.status exists
            errorMessage = `Server returned code ${err.status}: ${err.statusText || 'Unknown error'}`;
        } else if (err.message) {
            errorMessage = err.message;
        }
        
        Swal.fire('Request Failed', errorMessage, 'error');
      }
    });
  }

}