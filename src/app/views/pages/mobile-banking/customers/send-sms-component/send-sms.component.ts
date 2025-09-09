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
  is_root?: boolean; // Added for update payload as per API screenshot
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
      // Assuming trigger_type is not directly editable or always 'message_received' for new intents
      // If it's part of the form, ensure it's loaded in editTrigger and saved in onTriggerSubmit
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

  // --- 1. FETCH INTENT LIST (Updated API) ---
  fetchIntentList(chatbotId: number): void {
    this.isLoading = true;
    const payload = { chatbot_id: chatbotId }; // API now expects POST with body

    // Changed to mobileBankingPost and updated endpoint
    this.httpService.mobileBankingPost('builder/chatbots/root-intents', payload).subscribe({
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
        console.error('Error fetching intent list:', err);
        this.agentList = [];
        this.toastrService.error('An error occurred while loading triggers.', 'Error');
        this.isLoading = false;
      }
    });
  }

  // --- 2. TOGGLE TRIGGER STATUS (Updated API) ---
  toggleTriggerStatus(trigger: Trigger): void {
    const newStatus = !trigger.is_active;
    const chatbotId = this.globalService.getChatbotId(); // Ensure chatbotId is retrieved

    if (!chatbotId) {
      this.toastrService.error('Chatbot context missing. Cannot update status.', 'Error');
      return;
    }

    // Payload for PATCH /update API, including chatbot_id, intent_id, is_active, and is_root
    const payload = { 
        intent_id: trigger.id, 
        chatbot_id: chatbotId, // Required by new PATCH API
        is_active: newStatus,
        is_root: trigger.is_root // Preserve is_root status as per API screenshot
    };

    // Use mobileBankingPatch and updated endpoint
    this.httpService.mobileBankingPatch('builder/intents/update', payload).subscribe({
      next: (res: any) => {
        if (res.status === '00') {
          trigger.is_active = newStatus; // Update local state on success
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

  // --- 3. ON TRIGGER SUBMIT (CREATE & UPDATE Logic) (Updated APIs) ---
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
        name: this.triggerForm.value.name,
        description: this.triggerForm.value.description,
        training_phrases: this.triggerForm.value.training_phrases,
        is_active: originalTrigger ? originalTrigger.is_active : true, // Preserve status
        is_root: originalTrigger ? originalTrigger.is_root : true // Preserve is_root as per API screenshot
      };

      // Use mobileBankingPatch and updated endpoint
      this.httpService.mobileBankingPatch('builder/intents/update', payload).subscribe({
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
        name: this.triggerForm.value.name,
        description: this.triggerForm.value.description,
        training_phrases: this.triggerForm.value.training_phrases, // Include training phrases
        chatbot_id: chatbotId,
        is_root: true, // As per API screenshot, implies root intent
        order: (this.agentList.length || 0) + 1, // Order is included in API screenshot
        // parent_id: ... // If creating a child intent, add parent_id here
      };

      // Use mobileBankingPost and updated endpoint
      this.httpService.mobileBankingPost('builder/intents/create', payload).subscribe({
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

  // --- 4. DELETE TRIGGER (Updated API) ---
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
          chatbot_id: chatbotId // Required by new DELETE API
        };
        
        // Use mobileBankingDel (now configured to send a body) and updated endpoint
        this.httpService.mobileBankingDel('builder/intents/delete', payload).subscribe({
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