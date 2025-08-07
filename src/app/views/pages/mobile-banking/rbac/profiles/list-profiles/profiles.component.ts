import {Component, HostListener, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import {HttpService} from "../../../../../../shared/services/http.service";
import Swal from 'sweetalert2';
import { catchError, map, Observable, throwError } from 'rxjs';

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit {

  @ViewChild('createTicketModal') private createTicketModal: TemplateRef<any>;
  private modalRef: NgbModalRef;

  // Component State
  breadCrumbItems: Array<{}>;
  loading: boolean = false;
  ColumnMode = ColumnMode;
  SelectionType = SelectionType;

  rows: any = [
    {
      ShortID: 'Z9YKQEYAG2',
      Person: 'Chris Theuri',
      Status: 'Resolved',
      Subject: 'TESTING TICKETS',
      Tags: '–',
      assigneeInitials: 'CK',
      assigneeFullName: 'Chris Kahiga',
      AssignedTeams: '–'
    },
    
  ];

    // === ADD THIS FUNCTION to close dropdowns when clicking away ===
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // If the click is outside any <details> element, this will close any that are open
    if (!target.closest('details')) {
      document.querySelectorAll('details[open]').forEach(el => el.removeAttribute('open'));
    }
  }

  public statusList = [
    { name: 'Open', color: '#0d6efd' },
    { name: 'Pending', color: '#ffc107', textColor: '#000' },
    { name: 'Overdue', color: '#dc3545' },
    { name: 'Resolved', color: '#28a745' },
    { name: 'Closed', color: '#6c757d' }
  ];

  public assigneeList = [
    // Example: { id: 1, name: 'Chris Theuri' },
    // Example: { id: 2, name: 'Jane Doe' }
  ];
  
  totalRecords: number;

  // Ticket Creation Form
  ticketForm: FormGroup;
  activeRecipientSegment = 'existing'; 

  userList = [
    { id: 1, name: 'Chris Kahiga' },
  ]
  teamList = [
    { id: 1, name: 'Support Tier 1' },
    { id: 2, name: 'Support Tier 2' },
    { id: 3, name: 'Development' },
    { id: 4, name: 'Billing' }
  ];

  public isSidebarOpen: boolean = false;
  public selectedTicket: any = null;

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
  ) {
    this.totalRecords = this.rows.length;
  }


  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Mobile banking', path: '#' }, { label: 'Tickets', active: true }];
    
    // Initialize the form for creating tickets
    this.ticketForm = this.fb.group({
      subject: ['', [Validators.required]],
      fromEmail: ['v3.proto.cx (default)', [Validators.required]],
      assignee: ['', Validators.required],
      assignedTeams: ['', Validators.required],
      recipient: ['', Validators.required]
    });
  }

  openDetailsSidebar(row: any) {
    this.selectedTicket = row;
    this.isSidebarOpen = true;
  }

  closeDetailsSidebar() {
    this.isSidebarOpen = false;
    setTimeout(() => {
      this.selectedTicket = null;
    }, 300); 
  }


  openCreateTicketModal() {
    this.modalRef = this.modalService.open(this.createTicketModal, {
      centered: true,
      size: 'md',
      windowClass: 'create-ticket-modal' 
    });
  }

  submitTicket() {
    if (this.ticketForm.valid) {
      console.log('Form Submitted!', this.ticketForm.value);
      Swal.fire('Success', 'Ticket has been created (check console).', 'success');
      this.modalRef.close();
    } else {
      Swal.fire('Error', 'Please fill out all required fields.', 'error');
    }
  }

  triggerEvent(data: string) {
  
  }
}