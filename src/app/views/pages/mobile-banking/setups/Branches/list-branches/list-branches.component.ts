import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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
  allPeople: any[] = []; // Store the full list
  filteredPeople: any[] = []; // Store the filtered list
  
  // --- Pagination Properties ---
  recordsToShow = 20;

  get totalRecords(): number {
    // The total should reflect the count after filtering
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
  isAddPersonModalVisible = false; // This controls the modal's visibility

  constructor(private fb: FormBuilder) {
    // Initialize the form for adding a person
    this.addPersonForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: ['User', Validators.required]
    });
  }

  ngOnInit(): void {
    // Your existing ngOnInit logic to load data, etc.
    this.loadPeopleData();
  }

  // --- Functions for the main page (table, filters, side panel) ---

  loadPeopleData(): void {
    // Dummy data list expanded to 10 people with selected property
    this.allPeople = [
      { id: '1a-jd', name: 'John Doe', email: 'john.doe@example.com', location: 'New York', country: 'USA', ipAddress: '192.168.1.1', phone: '123-456-7890', selected: false },
      { id: '2b-js', name: 'Jane Smith', email: 'jane.smith@example.com', location: 'London', country: 'UK', ipAddress: '192.168.1.2', phone: '987-654-3210', selected: false },
      { id: '3c-as', name: 'Alice Johnson', email: 'alice.j@example.com', location: 'Toronto', country: 'Canada', ipAddress: '172.16.0.5', phone: '555-123-4567', selected: false },
      { id: '4d-bw', name: 'Bob Williams', email: 'bob.w@example.com', location: 'Sydney', country: 'Australia', ipAddress: '10.0.0.10', phone: '444-555-6666', selected: false },
      { id: '5e-cb', name: 'Charlie Brown', email: 'charlie.b@example.com', location: 'Tokyo', country: 'Japan', ipAddress: '203.0.113.15', phone: '333-222-1111', selected: false },
      { id: '6f-dm', name: 'Diana Miller', email: 'diana.m@example.com', location: 'Berlin', country: 'Germany', ipAddress: '198.51.100.20', phone: '222-333-4444', selected: false },
      { id: '7g-eg', name: 'Ethan Garcia', email: 'ethan.g@example.com', location: 'Mexico City', country: 'Mexico', ipAddress: '203.0.113.25', phone: '111-444-5555', selected: false },
      { id: '8h-fh', name: 'Fiona Harris', email: 'fiona.h@example.com', location: 'Paris', country: 'France', ipAddress: '198.51.100.30', phone: '666-777-8888', selected: false },
      { id: '9i-gk', name: 'George King', email: 'george.k@example.com', location: 'Moscow', country: 'Russia', ipAddress: '10.0.0.15', phone: '777-888-9999', selected: false },
      { id: '10j-hl', name: 'Hannah Lee', email: 'hannah.l@example.com', location: 'Seoul', country: 'South Korea', ipAddress: '172.16.0.25', phone: '888-999-0000', selected: false }
    ];
    
    // Initially, the filtered list is the full list
    this.applyFiltersAndPagination();
  }

  applyFiltersAndPagination(): void {
    // Start with the master list of all people
    let people = [...this.allPeople];

    // Apply global search term
    const lowercasedTerm = this.searchTerm.trim().toLowerCase();
    if (lowercasedTerm) {
      people = people.filter(p =>
        Object.values(p).some(val => 
          String(val).toLowerCase().includes(lowercasedTerm)
        )
      );
    }

    // Apply column-specific filters
    const lowercasedNameFilter = this.nameFilter.trim().toLowerCase();
    if (lowercasedNameFilter) {
      people = people.filter(p => p.name?.toLowerCase().includes(lowercasedNameFilter));
    }
    const lowercasedIdFilter = this.idFilter.trim().toLowerCase();
    if (lowercasedIdFilter) {
      people = people.filter(p => p.id?.toLowerCase().includes(lowercasedIdFilter));
    }
    const lowercasedEmailFilter = this.emailFilter.trim().toLowerCase();
    if (lowercasedEmailFilter) {
      people = people.filter(p => p.email?.toLowerCase().includes(lowercasedEmailFilter));
    }
    const lowercasedLocationFilter = this.locationFilter.trim().toLowerCase();
    if (lowercasedLocationFilter) {
      people = people.filter(p => p.location?.toLowerCase().includes(lowercasedLocationFilter));
    }

    // Update the filtered list
    this.filteredPeople = people;

    // Apply pagination to the filtered list to get the visible list
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

  // --- Checkbox Selection Methods ---
  
  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    // Update all visible people
    this.visiblePeople.forEach(person => person.selected = isChecked);
    
    // Also update the corresponding people in the main arrays
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
    
    // Update the corresponding person in all arrays
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

  // Get selected people (useful for bulk operations)
  getSelectedPeople(): any[] {
    return this.allPeople.filter(person => person.selected);
  }

  // Clear all selections
  clearAllSelections(): void {
    this.allPeople.forEach(person => person.selected = false);
    this.filteredPeople.forEach(person => person.selected = false);
    this.visiblePeople.forEach(person => person.selected = false);
  }

  // --- Functions for the "Add Person" Modal ---

  openAddPersonModal(): void {
    this.addPersonForm.reset({ role: 'User' });
    this.isAddPersonModalVisible = true;
  }

  closeAddPersonModal(): void {
    this.isAddPersonModalVisible = false;
  }

  savePerson(): void {
    if (this.addPersonForm.invalid) {
      this.addPersonForm.markAllAsTouched();
      return;
    }
    
    // Create new person object
    const newPersonData = this.addPersonForm.value;
    const newPerson = {
        ...newPersonData,
        id: 'GENERATED_ID_' + Date.now(),
        location: newPersonData.location || '-',
        ipAddress: '-',
        country: '-',
        notes: [],
        selected: false // Initialize selection state
    };
    
    // Add the new person to the top of the master list
    this.allPeople.unshift(newPerson);

    // Re-apply filters and pagination to update the view
    this.applyFiltersAndPagination();

    // After saving, close the modal
    this.closeAddPersonModal();
  }
}