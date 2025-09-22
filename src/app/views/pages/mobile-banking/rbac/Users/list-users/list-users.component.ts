import { HttpClient } from '@angular/common/http';
import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { GlobalService } from 'src/app/shared/services/global.service';
import Swal from 'sweetalert2';

export interface Task {
  id: number;
  description: string;
  assignee?: string;
  status: string;
  dueDate?: string; 
}

export interface Workflow {
  id?: string;
  auditId: string;          // 🔹 add this
  title: string;
  scope: string;
  department: string;
  assignedTo: string;
  status: string;
  startDate: string;
  dueDate: string;
  tasks: any[];
  miniFindings?: any[];
}

export interface MiniFinding {
  id?: string;
  taskId?: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Noted' | 'Confirmed';
  createdAt?: string;
}
@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.scss']
})
export class ListUsersComponent implements OnInit {
  
  private api = 'http://localhost:3000/workflows'; 
  
   // UI state
  isDetailsPanelVisible = false;
  selectedWorkflow: Workflow | null = null;
  isAddEditModalVisible = false;
  isEditMode = false;

  // Data
  allWorkflows: Workflow[] = [];
  visibleWorkflows: Workflow[] = [];
  recordsToShow = 5;
  isLoading = false;

  // Filters
  searchTerm = '';
  departmentFilter = '';
  statusFilter = '';

  // Forms
  workflowForm: FormGroup;
  taskForm: FormGroup;
   miniFindingForm: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private globalService: GlobalService
  ) {
    this.workflowForm = this.fb.group({
      title: ['', Validators.required],
      scope: [''],
      department: [''],
      assignedTo: [''],
      status: ['Not Started', Validators.required],
      startDate: ['', Validators.required],
      dueDate: ['', Validators.required]
    });

    this.taskForm = this.fb.group({
      description: ['', Validators.required],
      assignee: [''],
      status: ['Pending', Validators.required],
      dueDate: ['']
    });

    this.miniFindingForm = this.fb.group({
    taskId: ['', Validators.required],
    description: ['', Validators.required],
    severity: ['Low', Validators.required],
    status: ['Noted', Validators.required]
  });
  }


  ngOnInit(): void {
    this.loadWorkflows();
      this.loadUsers(); 
    
  }

users: any[] = [];
today: string = new Date().toISOString().split('T')[0];

loadUsers(): void {
  this.http.get<any[]>('http://localhost:3000/users').subscribe({
    next: (res) => this.users = res,
    error: (err) => console.error('Failed to load users', err)
  });
}

editingTask: any = null; 
editTask(task: Task): void {
  this.editingTask = task;
  this.taskForm.patchValue(task); 
}

// Cancel editing
cancelEditTask(): void {
  this.editingTask = null;
  this.taskForm.reset({ status: 'Pending' });
}

addTaskToWorkflow(): void {
  if (!this.selectedWorkflow) {
    Swal.fire('Error', 'No workflow selected', 'error');
    return;
  }

  if (this.taskForm.invalid) {
    this.taskForm.markAllAsTouched();
    return;
  }

  const newTask = {
    id: 't' + Date.now(), // simple unique id
    ...this.taskForm.value
  };

  // Push into workflow tasks
  this.selectedWorkflow.tasks = this.selectedWorkflow.tasks || [];
  this.selectedWorkflow.tasks.push(newTask);

  const updated = { ...this.selectedWorkflow }; // ✅ full updated workflow

  // Save workflow + sync status + audit
  this.syncWorkflowAndAudit(updated);

  Swal.fire('Task Added', 'New task added successfully!', 'success');
  this.taskForm.reset({ status: 'Pending' });
}


deleteMiniFinding(id: string): void {
  if (!this.selectedWorkflow) return;
  const updated = {
    ...this.selectedWorkflow,
    miniFindings: (this.selectedWorkflow.miniFindings || []).filter(mf => mf.id !== id)
  };

  this.globalService.update(updated.id!, updated).subscribe({
    next: wf => {
      this.selectedWorkflow = wf;
      this.loadWorkflows();
    },
    error: err => console.error('Failed to delete mini finding', err)
  });
}

isTaskModalVisible = false;
isFindingModalVisible = false;

openFindingModal(): void {
    if (!this.selectedWorkflow) return;
    this.miniFindingForm.reset({
      taskId: '',
      description: '',
      severity: 'Low',
      status: 'Noted'
    });
    this.isFindingModalVisible = true;
  }

  closeFindingModal(): void {
    this.isFindingModalVisible = false;
  }

  addMiniFinding(): void {
    if (!this.selectedWorkflow) return;
    if (this.miniFindingForm.invalid) {
      this.miniFindingForm.markAllAsTouched();
      return;
    }
    const finding: MiniFinding = {
      ...this.miniFindingForm.value,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = {
      ...this.selectedWorkflow,
      miniFindings: [...(this.selectedWorkflow.miniFindings || []), finding]
    };
    this.globalService.update(updated.id!, updated).subscribe({
      next: wf => {
        this.selectedWorkflow = wf;
        this.loadWorkflows();
        this.closeFindingModal();
      },
      error: err => console.error('Failed to add mini finding', err)
    });
  }

openTaskModal() { this.isTaskModalVisible = true; }
closeTaskModal() { this.isTaskModalVisible = false; }

loadWorkflows(): void {
    this.isLoading = true;
    this.globalService.list().subscribe({
      next: (res) => {
        // Ensure tasks array present
        this.allWorkflows = res.map(w => ({ ...w, tasks: w.tasks || [] }));
        this.applyFiltersAndPagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load workflows', err);
        this.isLoading = false;
      }
    });
  }

  applyFiltersAndPagination(): void {
    let list = [...this.allWorkflows];
    const search = this.searchTerm.trim().toLowerCase();
    if (search) {
      list = list.filter(w =>
        (w.title || '').toLowerCase().includes(search) ||
        (w.department || '').toLowerCase().includes(search) ||
        (w.assignedTo || '').toLowerCase().includes(search)
      );
    }
    if (this.departmentFilter) {
      list = list.filter(w => (w.department || '').toLowerCase().includes(this.departmentFilter.toLowerCase()));
    }
    if (this.statusFilter) {
      list = list.filter(w => (w.status || '').toLowerCase() === this.statusFilter.toLowerCase());
    }

    this.visibleWorkflows = list.slice(0, this.recordsToShow);
  }

  getFindingsForTask(taskId: number) {
  return this.selectedWorkflow?.miniFindings?.filter(f => f.taskId === taskId) || [];
}

  loadMore(): void {
    this.recordsToShow += 5;
    this.applyFiltersAndPagination();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.departmentFilter = '';
    this.statusFilter = '';
    this.applyFiltersAndPagination();
  }

  // --- Details panel ----------------------------------------------
  showWorkflowDetails(w: Workflow): void {
    if (this.selectedWorkflow && this.selectedWorkflow.id === w.id) {
      this.hideDetails();
      return;
    }
    // show immediately basic data, and fetch latest (optional)
    this.selectedWorkflow = { ...w };
    this.isDetailsPanelVisible = true;

    // If you want to refresh from server:
    if (w.id) {
      this.globalService.get(w.id).subscribe({
        next: wf => this.selectedWorkflow = wf,
        error: err => console.warn('Could not fetch workflow details', err)
      });
    }
  }

  hideDetails(): void {
    this.isDetailsPanelVisible = false;
    this.selectedWorkflow = null;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.workflowForm.reset({ status: 'Not Started' });
    const today = new Date().toISOString().split('T')[0];
    this.workflowForm.patchValue({ startDate: today, dueDate: today });
    this.isAddEditModalVisible = true;
    this.selectedWorkflow = null;
  }

  openEditModal(w: Workflow): void {
    this.isEditMode = true;
    this.isAddEditModalVisible = true;
    this.selectedWorkflow = w;
    this.workflowForm.patchValue({
      title: w.title,
      scope: w.scope || '',
      department: w.department || '',
      assignedTo: w.assignedTo || '',
      status: w.status || 'Not Started',
      startDate: w.startDate || '',
      dueDate: w.dueDate || ''
    });
  }

  closeModal(): void {
    this.isAddEditModalVisible = false;
    this.isEditMode = false;
    this.workflowForm.reset();
  }


saveWorkflow(): void { 
  if (this.workflowForm.invalid) {
    this.workflowForm.markAllAsTouched();
    return;
  }

  const payload: Workflow = {
    ...this.workflowForm.value,
    id: this.selectedWorkflow?.id || this.workflowForm.value.id,  
    auditId: this.selectedWorkflow?.auditId || this.workflowForm.value.id, 
    tasks: this.selectedWorkflow?.tasks || [],
    miniFindings: this.selectedWorkflow?.miniFindings || []
  };

  if (this.isEditMode && this.selectedWorkflow && this.selectedWorkflow.id) {
    // ------------------- UPDATE WORKFLOW -------------------
    this.globalService.update(this.selectedWorkflow.id!, payload).subscribe({
      next: () => {
        Swal.fire('Updated', 'Workflow updated successfully!', 'success');

        // 🔹 Sync audit directly (same ID as workflow)
        const auditPayload = {
          id: payload.auditId,
          title: payload.title, 
          scope: payload.scope,
          department: payload.department,
          status: payload.status === 'Not Started' ? 'Planned' : payload.status,
          startDate: payload.startDate,
          endDate: payload.dueDate
        };

        this.http.put(`http://localhost:3000/audits/${payload.auditId}`, auditPayload).subscribe({
          next: () => this.globalService.notifyAuditsChanged(),
          error: err => console.error('Audit sync failed:', err)
        });

        this.closeModal();
        this.loadWorkflows();
          this.hideDetails()
        this.globalService.notifyWorkflowsChanged();
      },
      error: err => {
        console.error(err);
        Swal.fire('Error', 'Failed to update workflow', 'error');
      }
    });

  } else {
    // ------------------- CREATE WORKFLOW -------------------
    const newPayload = {
      ...payload,
      title: `${payload.title} Workflow`
    };

    this.globalService.create(newPayload).subscribe({
      next: (createdWf: Workflow) => {
        Swal.fire('Created', 'Workflow created successfully!', 'success');
        const auditPayload = {
          id: createdWf.id,  
          title: createdWf.title.replace(/^Workflow - /, ''), 
          scope: createdWf.scope,
          department: createdWf.department,
          status: createdWf.status === 'Not Started' ? 'Planned' : createdWf.status,
          startDate: createdWf.startDate,
          endDate: createdWf.dueDate
        };

        const auditPayloads = {
            ...payload,
            title: `${payload.title}`
          };

        this.http.post(`http://localhost:3000/audits`, auditPayloads).subscribe({
          next: () => this.globalService.notifyAuditsChanged(),
          error: err => console.error('Audit create failed:', err)
        });

        this.closeModal();
        this.loadWorkflows();
        this.globalService.notifyWorkflowsChanged();
      },
      error: err => {
        console.error(err);
        Swal.fire('Error', 'Failed to create workflow', 'error');
      }
    });
  }
}

deleteWorkflow(id?: number | string, auditId?: string): void {
  if (!id) return;

  Swal.fire({
    title: 'Delete workflow?',
    text: 'This will remove the workflow, linked audit, and all tasks.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!'
  }).then(result => {
    if (result.isConfirmed) {
      this.globalService.delete(id).subscribe({
        next: () => {
          // 🔹 Also delete linked audit if auditId is provided
          if (auditId) {
            this.http.delete(`http://localhost:3000/audits/${auditId}`).subscribe({
              next: () => this.globalService.notifyAuditsChanged(),
              error: err => console.warn('Failed to delete linked audit', err)
            });
          }

          Swal.fire('Deleted', 'Workflow and linked audit deleted', 'success');
          this.loadWorkflows();
          this.hideDetails();
          this.globalService.notifyWorkflowsChanged();
        },
        error: err => {
          console.error(err);
          Swal.fire('Error', 'Failed to delete workflow', 'error');
        }
      });
    }
  });
}

  openAddTask(): void {
    this.taskForm.reset({ status: 'Pending' });
    // We'll use the modal in details panel DOM to add
  }

  addTaskToSelected(): void {
    if (!this.selectedWorkflow) return;
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }
    const newTask: Task = {
      ...this.taskForm.value,
      // id: Date.now(),
      // status: this.taskForm.value.status as 'Pending' | 'In Progress' | 'Done'
    };
    const updated = { ...this.selectedWorkflow, tasks: [...(this.selectedWorkflow.tasks || []), newTask] };
    // Persist update
    this.globalService.update(updated.id!, updated).subscribe({
      next: wf => {
        this.selectedWorkflow = wf;
        this.loadWorkflows();
        this.taskForm.reset({ status: 'Pending' });
      },
      error: err => console.error('Failed to add task', err)
    });
  }

  toggleTaskStatus(task: Task): void {
  if (!this.selectedWorkflow) return;

  const newStatus =
    task.status === 'Done'
      ? 'Pending'
      : task.status === 'Pending'
      ? 'In Progress'
      : 'Done';

  const tasks = (this.selectedWorkflow.tasks || []).map(t =>
    t.id === task.id ? { ...t, status: newStatus } : t
  );

  const updated = { ...this.selectedWorkflow, tasks };
  this.syncWorkflowAndAudit(updated);
}

updateTask(): void {
  if (!this.selectedWorkflow || !this.editingTask) return;
  if (this.taskForm.invalid) {
    this.taskForm.markAllAsTouched();
    return;
  }

  const tasks = this.selectedWorkflow.tasks.map(t =>
    t.id === this.editingTask.id ? { ...t, ...this.taskForm.value } : t
  );

  const updated = { ...this.selectedWorkflow, tasks };
  this.syncWorkflowAndAudit(updated);

  Swal.fire('Updated', 'Task updated successfully!', 'success');
  this.cancelEditTask();
}

deleteTask(taskId: number | string): void {
  if (!this.selectedWorkflow) return;

  const tasks = (this.selectedWorkflow.tasks || []).filter(t => t.id !== taskId);
  const updated = { ...this.selectedWorkflow, tasks };
  this.syncWorkflowAndAudit(updated);
  this.loadWorkflows();

  Swal.fire('Deleted', 'Task deleted successfully!', 'success');
}



  private computeWorkflowStatus(tasks: Task[]): string {
  if (!tasks || tasks.length === 0) return 'Not Started';

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Done').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;

  if (done === total) return 'Completed';
  if (inProgress > 0 || done > 0) return 'In Progress';
  return 'Not Started';
}

private syncWorkflowAndAudit(updated: Workflow): void {
  // Compute workflow status from tasks
  updated.status = this.computeWorkflowStatus(updated.tasks);

  // Save workflow
  this.globalService.update(updated.id!, updated).subscribe({
    next: wf => {
      this.selectedWorkflow = wf;
      this.loadWorkflows();

      // 🔹 Sync linked audit
      const auditPayload = {
        id: updated.auditId,
        title: updated.title,
        scope: updated.scope,
        department: updated.department,
        status: updated.status === 'Not Started' ? 'Planned' : updated.status,
        startDate: updated.startDate,
        endDate: updated.dueDate
      };

      this.http.put(`http://localhost:3000/audits/${updated.auditId}`, auditPayload).subscribe({
        next: () => this.globalService.notifyAuditsChanged(),
        error: err => console.error('Audit sync failed:', err)
      });
    },
    error: err => console.error('Failed to sync workflow', err)
  });
}


  // --- helpers -----------------------------------------------
  taskProgressPercent(w?: Workflow): number {
    const wf = w || this.selectedWorkflow;
    if (!wf || !wf.tasks || wf.tasks.length === 0) return 0;
    const total = wf.tasks.length;
    const done = wf.tasks.filter(t => t.status === 'Done').length;
    return Math.round((done / total) * 100);
  }

}