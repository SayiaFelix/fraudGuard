// src/app/views/pages/mobile-banking/customers/send-sms/send-sms.component.ts

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from 'src/app/shared/services/http.service';
import { AddCustomerComponent } from "../add-customer/add-customer.component"; // This modal will be used for adding/editing triggers

// This interface defines the structure of a single trigger, based on your screenshot
interface Trigger {
  id: number; // Make sure this is present
  name: string;
  description?: string;
  type?: string;
  enabled: boolean;
  lastUpdated: Date;
}

@Component({
  selector: 'app-list-mobile-app',
  templateUrl: './send-sms.component.html',
  styleUrls: ['./send-sms.component.scss'],
})
export class SendSmsComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef;

  public modalRef: NgbModalRef;
  triggers: Trigger[] = [];
  isLoading = true;

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
  ) {}

  ngOnInit() {
    this.loadTriggers();
  }

  /**
   * Fetches the list of triggers from the API to display in the table.
   */
  loadTriggers(): void {
    this.isLoading = true;
    const model = { page: 0, size: 100 }; // Fetch up to 100 triggers

    // NOTE: This endpoint should list your triggers. Adjust if necessary.
    this.httpService
      .mobileBankingPost('api/v1/corporate/admin/list-triggers/all', model)
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.triggers = res.data || [];
          } else {
            this.showErrorMessage('Failed to load triggers.');
            this.triggers = [];
          }
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error loading triggers:', err);
          this.showErrorMessage('An error occurred while loading triggers.');
          this.triggers = []; // Default to empty on error
          this.isLoading = false;
        }
    });
  }

  /**
   * This is the function for your "Add Trigger" button.
   * It opens a modal window to enter the trigger details.
   * The API call to add the trigger will happen INSIDE the modal component.
   */
  onAddTriggerClick(): void {
    this.modalRef = this.modalService.open(AddCustomerComponent, {
      centered: true,
      size: 'lg'
    });
    
    // We tell the modal what it's being used for
    this.modalRef.componentInstance.title = 'Add New Trigger';
    this.modalRef.componentInstance.mode = 'add-trigger'; // This tells the modal to use the 'add-trigger' API
    
    // After the modal is closed, we check the result
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.loadTriggers(); // If successful, refresh the list of triggers
        this.showSuccessMessage('Trigger added successfully!');
      }
    }).catch(() => { /* This is for when the modal is dismissed (e.g., clicking outside) */ });
  }

  /**
   * Opens the modal to edit an existing trigger.
   */
  editTrigger(trigger: Trigger): void {
    this.modalRef = this.modalService.open(AddCustomerComponent, {
      centered: true,
      size: 'lg'
    });
    
    this.modalRef.componentInstance.title = 'Edit Trigger';
    this.modalRef.componentInstance.mode = 'edit-trigger';
    this.modalRef.componentInstance.formData = trigger; // Pass existing data to the modal
    
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.loadTriggers();
        this.showSuccessMessage('Trigger updated successfully!');
      }
    }).catch(() => {});
  }
  
  /**
   * Deletes a trigger after user confirmation.
   */
  deleteTrigger(trigger: Trigger): void {
    if (confirm(`Are you sure you want to delete the trigger "${trigger.name}"?`)) {
      // Use POST to a delete endpoint, as your HttpService seems to require it.
      // Adjust the endpoint as needed.
      this.httpService
        .mobileBankingPost(`api/v1/corporate/admin/triggers/delete/${trigger.id}`, {})
        .subscribe({
          next: (res: any) => {
            if (res.status === 200) {
              this.loadTriggers();
              this.showSuccessMessage('Trigger deleted successfully!');
            } else {
              this.showErrorMessage('Failed to delete trigger.');
            }
          },
          error: (err: any) => {
            console.error('Error deleting trigger:', err);
            this.showErrorMessage('Error deleting trigger.');
          }
        });
    }
  }

  /**
   * Toggles the enabled/disabled status of a trigger.
   */
  toggleTriggerStatus(trigger: Trigger, event: any): void {
    const enabled = event.target.checked;
    
    this.httpService
      .mobileBankingPost(`api/v1/corporate/admin/triggers/toggle/${trigger.id}`, { enabled })
      .subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            trigger.enabled = enabled;
            this.showSuccessMessage(`Trigger ${enabled ? 'enabled' : 'disabled'} successfully!`);
          } else {
            event.target.checked = !enabled; // Revert UI on failure
            this.showErrorMessage('Failed to update trigger status.');
          }
        },
        error: (err: any) => {
          event.target.checked = !enabled; // Revert UI on failure
          this.showErrorMessage('Error updating trigger status.');
        }
      });
  }
  
  // --- File Upload Methods ---
  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    this.httpService
      .mobileBankingPost('api/v1/corporate/admin/upload-file', formData) // Adjust endpoint
      .subscribe({
        next: (res: any) => {
          this.showSuccessMessage('File uploaded successfully!');
          this.loadTriggers();
        },
        error: (err: any) => {
          this.showErrorMessage('Error uploading file.');
        }
    });
    event.target.value = '';
  }

  // --- Utility Methods ---
  private showSuccessMessage(message: string): void {
    alert(message); // Replace with a proper notification/toast service
  }

  private showErrorMessage(message: string): void {
    alert(message); // Replace with a proper notification/toast service
  }

  getTriggerIcon(triggerType: string): string {
    const type = triggerType?.toLowerCase() || 'default';
    switch (type) {
      case 'chat started':
        return 'message-square';
      case 'chat closed':
        return 'x-square';
      case 'fallback':
        return 'alert-triangle';
      case 'message received':
        return 'inbox';
      default:
        return 'git-commit';
    }
  }
}