import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

interface Audit {
  id: string;
  title: string;
  endDate: string;
   department: string;
}

interface Finding {
  id: string;
  description: string;
  status: string;
  impact: 'High' | 'Medium' | 'Low' | string;
}

interface Observation {
  id: string;
  auditId: string;
  auditTitle?: string;
  auditEndDate?: string;
  description: string;
  recommendation?: string;
  responsibleUnit?: string;
  targetDate?: string;
  status: string;
  remarks?: string;

  // ✅ Add these fields
  severity?: 'High' | 'Medium' | 'Low' | string;
  createdAt?: string;
  findings?: Finding[];
}

@Component({
  selector: 'app-list-customers',
  templateUrl: './list-customers.component.html',
  styleUrls: ['./list-customers.component.scss']
})
export class ListCustomersComponent implements OnInit {
  observations: Observation[] = [];
  audits: Audit[] = [];
  selectedObservation: Observation | null = null;

  pendingCount = 0;
  submittedCount = 0;
  closedCount = 0;

  observationsApiUrl = 'http://localhost:3000/observations'; // observations API
  auditsApiUrl = 'http://localhost:3000/audits'; // audits API

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAuditsAndObservations();
  }

  expandedObservation: Observation | null = null;

deleteObservation(obs: Observation|null) {
  if (!obs) return;
  Swal.fire({
    title: 'Delete this observation?',
    text: 'This action cannot be undone',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete'
  }).then(result => {
    if (result.isConfirmed) {
      this.http.delete(`${this.observationsApiUrl}/${obs.id}`).subscribe(() => {
        Swal.fire('Deleted ✅', 'Observation removed', 'success');
        this.loadAuditsAndObservations();
        this.expandedObservation = null;
      });
    }
  });
}

isDetailsPanelVisible = false;

toggleDetails(obs: Observation) {
  if (this.expandedObservation && this.expandedObservation.id === obs.id) {
    // collapse if clicked again
    this.expandedObservation = null;
    this.isDetailsPanelVisible = false;
  } else {
    this.expandedObservation = obs;
    this.isDetailsPanelVisible = true;
  }
}

hideDetails() {
  this.expandedObservation = null;
  this.isDetailsPanelVisible = false;
}


  loadAuditsAndObservations() {
    // First, fetch audits
    this.http.get<Audit[]>(this.auditsApiUrl).subscribe({
      next: (auditRes) => {
        this.audits = auditRes;
   
         const auditMap = this.audits.reduce((map, audit) => {
            map[audit.id] = { 
              title: audit.title, 
              endDate: audit.endDate,
              department: audit.department 
            };
            return map;
          }, {} as Record<string, { title: string; endDate: string; department: string }>);

        // Now fetch observations
        this.http.get<Observation[]>(this.observationsApiUrl).subscribe({
          next: (obsRes) => {
            this.observations = obsRes.map(obs => ({
              ...obs,
              auditTitle: auditMap[obs.auditId]?.title || 'Unknown Audit',
              auditEndDate: auditMap[obs.auditId]?.endDate || 'N/A',
              targetDate: obs.targetDate || 'N/A',
              responsibleUnit: auditMap[obs.auditId]?.department || 'Unknown Unit',
            }));
            // KPI counts
            this.pendingCount = this.observations.filter(o => o.status === 'Open' || o.status === 'Pending').length;
            this.submittedCount = this.observations.filter(o => o.status === 'Submitted').length;
            this.closedCount = this.observations.filter(o =>
              o.status === 'In Progress' || o.status === 'Verified' || o.status === 'Closed'
            ).length;
          },
          error: () => Swal.fire('Error', 'Failed to load observations', 'error')
        });
      },
      error: () => Swal.fire('Error', 'Failed to load audits', 'error')
    });
  }

  openAddModal(observation?: Observation | null) {
    if (!observation) return;
    this.selectedObservation = observation ? { ...observation } : {
      id: '',
      auditId: '',
      auditTitle: '',
      auditEndDate: '',
      description: '',
      recommendation: '',
      responsibleUnit: '',
      targetDate: '',
      status: 'Open',
      remarks: ''
    };
  }

  saveObservation() {
  if (!this.selectedObservation) return;

  if (this.selectedObservation.id) {
    // ✅ Update only remarks (PATCH instead of full PUT)
    this.http.patch(`${this.observationsApiUrl}/${this.selectedObservation.id}`, {
      remarks: this.selectedObservation.remarks
    }).subscribe(() => {
      Swal.fire('Updated ✅', 'Remark saved successfully', 'success');
      this.loadAuditsAndObservations();
      this.selectedObservation = null;
    });
  } else {
    // Creating from compliance doesn’t make sense (since observation is born in Audit/Observation module)
    Swal.fire('Error ❌', 'New observations can only be created in the Observation module.', 'error');
  }
}

  remindUnit(item: Observation | null) {
    if (!item) return;
    Swal.fire('Reminder Sent 📩', `Reminder sent to ${item.responsibleUnit || 'Unit'} for observation ${item.id}`, 'info');
  }

  closeModal() {
    this.selectedObservation = null;
  }
}
