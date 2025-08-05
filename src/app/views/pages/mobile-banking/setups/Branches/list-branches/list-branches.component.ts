import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-list-branches',
  templateUrl: './list-branches.component.html',
  styleUrls: ['./list-branches.component.scss']
})
export class ListBranchesComponent implements OnInit {
  // --- Master Data Store ---
  allPeople: any[] = []; // The original, unfiltered list of all people

  // --- Filtered & Displayed Data ---
  filteredPeople: any[] = []; // The list of people after all filters are applied
  visiblePeople: any[] = [];  // The paginated portion of `filteredPeople` shown to the user

  // --- Counters and Pagination ---
  recordsToShow = 20; // How many records to show per "page" or "load more"

  get totalRecords(): number {
    return this.filteredPeople.length;
  }

  // --- Details Side Panel Properties ---
  isDetailsPanelVisible = false;
  selectedPerson: any = null;

  // --- "Add Person" Modal Properties ---
  @ViewChild('addPersonModal') addPersonModal: ElementRef;
  private modalRef: NgbModalRef;
  addPersonForm: FormGroup;
  isSubmitted = false;

  // --- Filter Properties ---
  searchTerm: string = '';
  nameFilter: string = '';
  idFilter: string = '';
  emailFilter: string = '';
  locationFilter: string = '';

  constructor(
    private modalService: NgbModal,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loadInitialData();
    this.applyFiltersAndPagination();

    this.addPersonForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      location: [''],
      role: ['User', Validators.required]
    });
  }

  loadInitialData() {
    this.allPeople = [
        { name: '-', id: '01K1G5BY34KAYFEY44D8AE8PAW', email: '-', location: '-', ipAddress: '-', country: '-', phone: '-', notes: [] },
        { name: 'Purity Jangaya', id: '01JSKX0FRZTM2G1DV1TW9K9XCR', email: 'purity.j@example.com', location: 'Nairobi', ipAddress: '41.90.101.26', country: 'Kenya', phone: '+2547...', notes: [] },
        { name: 'Chris Theuri', id: '01JSKQM6EK9EDCJS2VFY4HSW39', email: 'chris.t@example.com', location: 'Mombasa', ipAddress: '192.168.1.10', country: 'Kenya', phone: '+2547...', notes: ['First note created.'] },
        { name: 'John Doe', id: '01JXYZABCDEF1234567890ABCD', email: 'john.d@example.com', location: 'New York', ipAddress: '10.0.0.1', country: 'USA', phone: '+1234567890', notes: [] },
        { name: 'Jane Smith', id: '01ABCDEFGH1234567890UVWXYZ', email: 'jane.s@example.com', location: 'London', ipAddress: '172.16.0.1', country: 'UK', phone: '+4412345678', notes: [] },
    ];
  }

  // NEW FUNCTION: Clears all filter inputs and refreshes the list
  resetFilters() {
    this.searchTerm = '';
    this.nameFilter = '';
    this.idFilter = '';
    this.emailFilter = '';
    this.locationFilter = '';
    this.applyFiltersAndPagination();
  }

  loadMorePeople() {
    this.recordsToShow += 20;
    this.visiblePeople = this.filteredPeople.slice(0, this.recordsToShow);
  }

  showPersonDetails(person: any) {
    this.selectedPerson = person;
    this.isDetailsPanelVisible = true;
  }

  hidePersonDetails() {
    this.isDetailsPanelVisible = false;
    this.selectedPerson = null;
  }

  get formControls() {
    return this.addPersonForm.controls;
  }

  openAddPersonModal() {
    this.isSubmitted = false;
    this.addPersonForm.reset({ role: 'User' });
    this.modalRef = this.modalService.open(this.addPersonModal, {
      centered: true,
      windowClass: 'dark-theme-modal',
      backdropClass: 'dark-theme-backdrop'
    });
  }

  savePerson() {
    this.isSubmitted = true;
    if (this.addPersonForm.invalid) {
      return;
    }
    const newPersonData = this.addPersonForm.value;
    const newPerson = {
        ...newPersonData,
        id: 'GENERATED_ID_' + Date.now(),
        location: newPersonData.location || '-',
        ipAddress: '-',
        country: '-',
        notes: []
    };

    this.allPeople.unshift(newPerson);
    this.applyFiltersAndPagination();
    this.modalRef.close();
  }

  applyFiltersAndPagination(resetPagination: boolean = true) {
    if (resetPagination) {
      this.recordsToShow = 20;
    }

    let people = [...this.allPeople];

    const lowercasedTerm = this.searchTerm.trim().toLowerCase();
    if (lowercasedTerm) {
      people = people.filter(p =>
        (p.name?.toLowerCase().includes(lowercasedTerm)) ||
        (p.id?.toLowerCase().includes(lowercasedTerm)) ||
        (p.email?.toLowerCase().includes(lowercasedTerm)) ||
        (p.location?.toLowerCase().includes(lowercasedTerm))
      );
    }

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

    this.filteredPeople = people;
    this.visiblePeople = this.filteredPeople.slice(0, this.recordsToShow);
  }
}