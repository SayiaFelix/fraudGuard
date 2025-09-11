import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpService } from 'src/app/shared/services/http.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs'; // Import forkJoin for parallel API calls

@Component({
  selector: 'app-list-branches',
  templateUrl: './list-branches.component.html',
  styleUrls: ['./list-branches.component.scss']
})
export class ListBranchesComponent implements OnInit {

  // --- Properties for your main page ---
  isDetailsPanelVisible = false;
  selectedPerson: any = null;
  visiblePeople: any[] = [];
  allPeople: any[] = [];
  filteredPeople: any[] = [];
  isLoading = false;

  // --- Pagination Properties ---
  recordsToShow = 20;

  get totalRecords(): number {
    return this.filteredPeople.length;
  }
  
  // Your filter properties
  searchTerm = '';
  nameFilter = '';
  idFilter = '';
  emailFilter = '';
  locationFilter = '';

  // --- Properties for the "Add Person" Modal ---
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
      role: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadPeopleData();
  }

  private getUserRole(): string {
    const role = localStorage.getItem('user_role');
    return role ? role.toUpperCase() : 'UNKNOWN';
  }

  private mapApiDataToPerson(user: any, role: string): any {
    return {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      location: role,
      country: user.country || 'N/A',
      ipAddress: 'N/A',
      phone: user.phone || 'N/A',
      selected: false
    };
  }

  // THIS IS THE UPDATED METHOD
  loadPeopleData(): void {
    this.isLoading = true;
    this.allPeople = []; // Reset the list before loading
    const userRole = this.getUserRole();
    console.log('Detected user role:', userRole);

    if (userRole === 'ADMIN') {
      const creators$ = this.httpService.mobileBankingGet('auth/admin/creators');
      const admins$ = this.httpService.mobileBankingGet('auth/admin/admins');
      
      forkJoin([creators$, admins$]).subscribe({
        next: (results: any[]) => {
          const creatorsResult = results[0];
          const adminsResult = results[1];
          console.log('Creators API result:', creatorsResult);
          console.log('Admins API result:', adminsResult);

          // Process and map the creators data
          const creators = Array.isArray(creatorsResult?.data)
            ? creatorsResult.data.map((user: any) => this.mapApiDataToPerson(user, 'CREATOR'))
            : [];

          // Process and map the admins data
          const admins = Array.isArray(adminsResult?.data)
            ? adminsResult.data.map((user: any) => this.mapApiDataToPerson(user, 'ADMIN'))
            : [];

          // Combine both lists into the main array
          this.allPeople = [...creators, ...admins];
          console.log('Combined people list:', this.allPeople); 
          
          this.applyFiltersAndPagination();
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Failed to load data for admin:', err);
          this.toastr.error('Could not load user data.', 'API Error');
          this.isLoading = false;
        }
      });
    } else if (userRole === 'CREATOR') {
      this.httpService.mobileBankingGet('auth/admin/creators').subscribe({
        next: (result: any) => {
          console.log('Creators API result for CREATOR role:', result);
          
          // Process and map the creators data
          const creators = Array.isArray(result?.data)
            ? result.data.map((user: any) => this.mapApiDataToPerson(user, 'CREATOR'))
            : [];

          // Assign the creators list to the main array
          this.allPeople = creators;

          this.applyFiltersAndPagination();
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Failed to load creator data:', err);
          this.toastr.error('Could not load user data.', 'API Error');
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
      this.toastr.warning('You do not have permission to view this page.');
      console.warn('Unknown user role:', userRole);
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
    const lowercasedLocationFilter = this.locationFilter.trim().toLowerCase();
    if (lowercasedLocationFilter) {
      people = people.filter(p => p.location?.toLowerCase().includes(lowercasedLocationFilter));
    }
    this.filteredPeople = people;
    this.visiblePeople = this.filteredPeople.slice(0, this.recordsToShow);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.nameFilter = '';
    this.idFilter = '';
    this.emailFilter = '';
    this.locationFilter = '';
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
      if (this.visiblePeople.find(vp => vp.id === person.id)) {
        person.selected = isChecked;
      }
    });
    this.filteredPeople.forEach(person => {
      if (this.visiblePeople.find(vp => vp.id === person.id)) {
        person.selected = isChecked;
      }
    });
  }

  togglePersonSelection(person: any, event: any): void {
    const isChecked = event.target.checked;
    person.selected = isChecked;
    const allPersonIndex = this.allPeople.findIndex(p => p.id === person.id);
    if (allPersonIndex !== -1) this.allPeople[allPersonIndex].selected = isChecked;
    const filteredPersonIndex = this.filteredPeople.findIndex(p => p.id === person.id);
    if (filteredPersonIndex !== -1) this.filteredPeople[filteredPersonIndex].selected = isChecked;
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
    this.addPersonForm.reset({ role: 'CREATOR' });
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
      role: formData.role
    };

    this.httpService.mobileBankingPost('auth/admin/register-user', payload).subscribe({
      next: (result: any) => {
        if (result.status === '00' || result.message === "Creator registered successfully.") {
          
          Swal.fire('Success', result.message || 'Person added successfully!', 'success');
          this.loadMorePeople();
          this.applyFiltersAndPagination(); 
          this.closeAddPersonModal();

        } else {
          Swal.fire('Error', result.message || 'An unexpected error occurred.', 'error');
        }
      },
      error: (err: any) => {
        console.error('API call failed:', err);
        Swal.fire('Request Failed', err.error?.message || 'Could not connect to the server.', 'error');
      }
    });
  }
}