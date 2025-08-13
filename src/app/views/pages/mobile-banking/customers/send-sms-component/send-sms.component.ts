import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import { GlobalService } from 'src/app/shared/services/global.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import Swal from "sweetalert2";
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

// MODIFIED: Added training_phrases to the interface for editing
interface Trigger {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  training_phrases?: string[]; // Needed for the edit form
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
  agentList: Trigger[] = [];
  isLoading = true;
  
  // NEW: Property to track if we are in edit mode
  editingTriggerId: number | null = null;

  constructor(
    private httpService: HttpService,
    private globalService: GlobalService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: ToastrService
  ) {
    this.initializeForm();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && event.url.includes('/send-sms-component'))
    ).subscribe(() => {
        const chatbotId = this.globalService.getChatbotId();
        if (chatbotId) {
          this.fetchIntentList(chatbotId);
        }
    });
  }

  ngOnInit() {
    this.globalService.chatbotId$.subscribe((chatbotId) => {
    if (chatbotId) {
      this.fetchIntentList(chatbotId);
    } else {
      this.agentList = [];
    }
  });

  this.globalService.chatbotData$.subscribe(data => {
    this.chatbotData = data;
  });
  }

  initializeForm() {
    this.triggerForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      trigger_type: ['message_received', Validators.required],
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

  fetchIntentList(chatbotId: number): void {
    this.isLoading = true;
    const body = { chatbot_id: chatbotId };
    this.httpService.mobileBankingPost('builder/chatbots/root-intents', body).subscribe({
      next: (res: any) => {
        if (res.status === '00' && Array.isArray(res.data)) {
          this.agentList = res.data.map((trigger: any) => ({
            ...trigger,
            is_active: trigger.is_active === 1 || trigger.is_active === true,
          })).sort((a: Trigger, b: Trigger) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        } else {
          this.agentList = [];
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error fetching agent list:', err);
        this.agentList = [];
        this.toastrService.error('An error occurred while loading triggers.', 'Error');
        this.isLoading = false;
      }
    });
  }

  toggleTriggerStatus(trigger: Trigger): void {
    const newStatus = !trigger.is_active;
    const payload = { intent_id: trigger.id, is_active: newStatus };
    this.httpService.mobileBankingPost('builder/nodes/intent/status', payload).subscribe({
      next: (res: any) => {
        if (res.status === '00') {
          trigger.is_active = newStatus;
          this.toastrService.success(`Trigger status updated to ${newStatus ? 'Active' : 'Inactive'}.`, 'Success');
        } else {
          this.toastrService.warning(res.message || 'Failed to update trigger status.', 'Warning');
        }
      },
      error: (err: any) => {
        this.toastrService.error(err?.error?.message || 'An error occurred while updating status.', 'Error');
      }
    });
  }

  // MODIFIED: This function now handles both create and update
  onTriggerSubmit(): void {
    if (!this.triggerForm.valid) {
      this.markFormGroupTouched(this.triggerForm);
      return;
    }
    const chatbotId = this.globalService.getChatbotId();
    if (!chatbotId) {
      Swal.fire('Error', 'No chatbot ID found. Please create or select a Chatbot first.', 'error');
      return;
    }

    // --- UPDATE LOGIC ---
    if (this.editingTriggerId) {
      const originalTrigger = this.agentList.find(t => t.id === this.editingTriggerId);
      const payload = {
        intent_id: this.editingTriggerId,
        chatbot_id: chatbotId,
        ...this.triggerForm.value,
        is_active: originalTrigger ? originalTrigger.is_active : true // Preserve status
      };

      this.httpService.mobileBankingPost('builder/nodes/intent/update', payload).subscribe({
        next: (res: any) => {
          if (res.status === '00') {
            Swal.fire('Success', 'Trigger updated successfully!', 'success');
            this.fetchIntentList(chatbotId);
            this.closeModal();
          } else {
            Swal.fire('Error', res.message || 'Failed to update trigger.', 'error');
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err?.error?.message || 'An error occurred.', 'error');
        }
      });
    } 
    // --- CREATE LOGIC ---
    else {
      const payload = {
        ...this.triggerForm.value,
        chatbot_id: chatbotId,
        is_root: true,
        order: (this.agentList.length || 0) + 1,
      };
      this.httpService.mobileBankingPost('builder/nodes/intent', payload).subscribe({
          next: (result: any) => {
            if (result.status === '00') {
              Swal.fire('Success', 'Trigger Created Successfully!', 'success');
              this.fetchIntentList(chatbotId);
              this.closeModal();
            } else {
              Swal.fire('Error', result.message || 'Failed to create intent.', 'error');
            }
          },
          error: (err: any) => {
            Swal.fire('Error', err?.error?.message || 'An error occurred.', 'error');
          }
        });
    }
  }

  // MODIFIED: This now uses the component's own modal instead of NgbModal
  editTrigger(trigger: Trigger): void {
    this.editingTriggerId = trigger.id;

    // Populate the form with the trigger's data
    this.triggerForm.patchValue({
      name: trigger.name,
      description: trigger.description,
      // trigger_type: trigger.trigger_type // Add this if trigger_type is part of your trigger object
    });

    // Clear and re-populate training phrases
    this.trainingPhrases.clear();
    if (trigger.training_phrases && trigger.training_phrases.length > 0) {
      trigger.training_phrases.forEach(phrase => {
        this.trainingPhrases.push(this.fb.control(phrase, Validators.required));
      });
    } else {
      this.addTrainingPhrase(); // Add at least one empty field
    }
    
    // Open the modal
    this.triggerModal.nativeElement.classList.add('show');
    this.triggerModal.nativeElement.style.display = 'block';
    document.body.classList.add('modal-open');
  }

  // MODIFIED: Updated to use the correct API endpoint and payload for deletion
  deleteTrigger(trigger: Trigger): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the trigger "${trigger.name}". This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        const chatbotId = this.globalService.getChatbotId();
        if (!chatbotId) {
            Swal.fire('Error', 'Chatbot context lost. Cannot delete.', 'error');
            return;
        }

        const payload = {
          intent_id: trigger.id,
          chatbot_id: chatbotId
        };
        
        this.httpService.mobileBankingPost('builder/nodes/intent/delete', payload).subscribe({
          next: (res: any) => {
            if (res.status === '00') {
              Swal.fire('Deleted!', 'The trigger has been deleted.', 'success');
              this.fetchIntentList(chatbotId); // Refresh list
            } else {
              Swal.fire('Error', res.message || 'Failed to delete trigger.', 'error');
            }
          },
          error: (err: any) => {
            Swal.fire('Error', err?.error?.message || 'An error occurred.', 'error');
          }
        });
      }
    });
  }

  onAddTriggerClick(): void {
    this.editingTriggerId = null; // Ensure we are in "add" mode
    this.initializeForm(); // Reset form for a new entry
    this.triggerModal.nativeElement.classList.add('show');
    this.triggerModal.nativeElement.style.display = 'block';
    document.body.classList.add('modal-open');
  }

  closeModal(): void {
    this.triggerModal.nativeElement.classList.remove('show');
    this.triggerModal.nativeElement.style.display = 'none';
    document.body.classList.remove('modal-open');
    this.editingTriggerId = null; // Reset edit state on close
  }

  openIntent(trigger: Trigger): void {
    if (!trigger?.id) { console.warn('Trigger ID not found.'); return; }
    this.router.navigate(['../intent', trigger.id], {
      relativeTo: this.route,
      state: { triggerData: trigger }
    });
  }

  triggerFileUpload(): void { this.fileInput.nativeElement.click(); }

  onFileUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    this.toastrService.info('File upload initiated...');
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}