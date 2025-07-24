import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from 'src/app/shared/services/http.service';
import { AddCustomerComponent } from "../add-customer/add-customer.component"; // This modal will be used for adding/editing triggers
import { GlobalService } from 'src/app/shared/services/global.service';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import Swal from "sweetalert2";
import { ActivatedRoute, Router } from '@angular/router';

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
  @ViewChild('triggerModal') triggerModal: ElementRef;

  triggerForm: FormGroup;
  chatbotData: any = null;
  public modalRef: NgbModalRef;
  triggers: Trigger[] = [];
  isLoading = true;
  result: any;
  agentList: any[] = [];

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    private globalService: GlobalService,
    private fb: FormBuilder,
    private router: Router,
     private route: ActivatedRoute
  ) {
     this.initializeForm();
  }

  ngOnInit() {
  this.chatbotData = this.globalService.getChatbotData();
  const chatbotId = this.globalService.getChatbotId();
  if (this.chatbotData?.welcome_message) {

    console.log(this.chatbotData)
  } else {

  }

  if (chatbotId) {
          console.log('Using Chatbot ID:', chatbotId);
        } else {
          console.warn('No chatbot ID found');
        }

  this.globalService.chatbotId$.subscribe((chatbotId) => {
    if (chatbotId) {
      console.log('Chatbot ID changed or loaded:', chatbotId);
      this.fetchIntentList(chatbotId);
    } else {
      console.warn('No chatbot selected.');
    }
  });

  }

    
  initializeForm() {
    this.triggerForm = this.fb.group({
      name: ['', [Validators.required, Validators.required]],
      description: [''],
      training_phrases: this.fb.array([
        this.fb.control('', Validators.required)
      ])
    });
  }

   get trainingPhrases() {
    return this.triggerForm?.get('training_phrases') as FormArray;
  }

  addTrainingPhrase() {
    this.trainingPhrases.push(this.fb.control('', Validators.required));
  }

  removeTrainingPhrase(index: number) {
    if (this.trainingPhrases.length > 1) {
      this.trainingPhrases.removeAt(index);
    }
  }

onAddTriggerClick() {
  this.initializeForm(); // Reinitialize form to clear previous values
  this.triggerModal.nativeElement.classList.add('show');
  this.triggerModal.nativeElement.style.display = 'block';
  document.body.classList.add('modal-open');
}

closeModal() {
  // Hide modal logic
  this.triggerModal.nativeElement.classList.remove('show');
  this.triggerModal.nativeElement.style.display = 'none';
  document.body.classList.remove('modal-open');
}


fetchIntentList(chatbotId: number): void {
  this.isLoading = true;
  const body = { chatbot_id: chatbotId };

  this.httpService.mobileBankingPost('builder/chatbots/root-intents', body).subscribe({
    next: (res: any) => {
      if (res.status === '00' && Array.isArray(res.data)) {
        this.agentList = res.data.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } else {
        this.agentList = [];
        this.showErrorMessage('Failed to load triggers.');
      }
      this.isLoading = false;
    },
    error: (err: any) => {
      console.error('Error fetching agent list:', err);
      this.agentList = [];
      this.showErrorMessage('An error occurred while loading triggers.');
      this.isLoading = false;
    }
  });
}



onTriggerSubmit(): void {
  if (this.triggerForm.valid) {
    // Get chatbot ID from global service
    const chatbotId = this.globalService.getChatbotId();
    
    if (!chatbotId) {
      console.warn('No chatbot ID found');
      Swal.fire('Error', 'No chatbot ID found,create Chatbot first', 'error');
      return;
    }

    const model = {
      ...this.triggerForm.value,
      chatbot_id: chatbotId, 
      is_root: true, 
      order: 1,
      responses: ["Welcome! How can I assist you today?"]       
    };

    console.log('Form data to submit:', model);

    this.httpService
      .mobileBankingPost('builder/nodes/intent', model)
      .subscribe({
        next: (result: any) => {
          if (result.status === '00') {
            setTimeout(() => {
              this.result = result.data;
              console.log(this.result);
             
  
              this.globalService.setIntentId(result.data.id);
              this.fetchIntentList(chatbotId)

              Swal.fire('ChatBot', 'Intent created successfully!', 'success');
              this.triggerForm.reset();
              this.closeModal(); // Close modal after successful submission
            }, 10);
          } else {
            console.log(result.message);
            Swal.fire('Error', result.message || 'Failed to create intent', 'error');
          }
        },
        error: (err: any) => {
          console.error('Bot creation failed:', err);
          Swal.fire('Error', 'Failed to create intent', 'error');
        }
      });
  } else {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.triggerForm);
  }
}

openIntent(trigger: any): void {
  if (!trigger?.id) {
    console.warn('Trigger ID not found.');
    return;
  }

  // Navigate to the intent page with the ID
  this.router.navigate(['../intent', trigger.id], { relativeTo: this.route });
}

// Helper method to mark all form controls as touched
private markFormGroupTouched(formGroup: FormGroup) {
  Object.values(formGroup.controls).forEach(control => {
    control.markAsTouched();

    if (control instanceof FormGroup) {
      this.markFormGroupTouched(control);
    }
  });
}

  // loadTriggers(): void {
  //   this.isLoading = true;
  //   const model = { page: 0, size: 100 }; // Fetch up to 100 triggers

  //   // NOTE: This endpoint should list your triggers. Adjust if necessary.
  //   this.httpService
  //     .mobileBankingPost('api/v1/corporate/admin/list-triggers/all', model)
  //     .subscribe({
  //       next: (res: any) => {
  //         if (res.status === 200) {
  //           this.triggers = res.data || [];
  //         } else {
  //           this.showErrorMessage('Failed to load triggers.');
  //           this.triggers = [];
  //         }
  //         this.isLoading = false;
  //       },
  //       error: (err: any) => {
  //         console.error('Error loading triggers:', err);
  //         this.showErrorMessage('An error occurred while loading triggers.');
  //         this.triggers = []; // Default to empty on error
  //         this.isLoading = false;
  //       }
  //   });
  // }

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
        // this.loadTriggers();
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
              // this.loadTriggers();
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
          // this.loadTriggers();
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
