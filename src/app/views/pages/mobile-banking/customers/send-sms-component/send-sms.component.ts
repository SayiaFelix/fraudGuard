import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from 'src/app/shared/services/http.service';
import { AddCustomerComponent } from "../add-customer/add-customer.component";
import { GlobalService } from 'src/app/shared/services/global.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import Swal from "sweetalert2";
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr'; // Make sure you have ngx-toastr installed and imported in your app module

// A clean interface for your trigger data
interface Trigger {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string; // Keep for sorting
  // Add any other properties you pass to the intent page
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
  agentList: Trigger[] = []; // Use the strong type
  isLoading = true;
  result: any;

  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    private globalService: GlobalService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private toastrService: ToastrService // Inject ToastrService
  ) {
    this.initializeForm();

    // Refresh trigger list when navigating back to this page
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
    this.chatbotData = this.globalService.getChatbotData();
    const chatbotId = this.globalService.getChatbotId();
    if (chatbotId) {
      this.fetchIntentList(chatbotId);
    } else {
      console.warn('No chatbot selected on init.');
      this.isLoading = false;
    }
  }

  initializeForm() {
    this.triggerForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      // This control was in your HTML, so it needs to be in the form group
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
          // ✅ CORRECTED: Map API data to our clean Trigger interface
          this.agentList = res.data.map((trigger: any) => ({
            ...trigger,
            // Ensure is_active is always a strict boolean for the toggle to work reliably
            is_active: trigger.is_active === 1 || trigger.is_active === true,
          })).sort((a: Trigger, b: Trigger) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        } else {
          this.agentList = [];
          this.toastrService.warning('Could not load triggers.', 'Warning');
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

  /**
   * ✅ CORRECTED: Toggles the trigger's active status using the "update-in-place" pattern.
   */
  toggleTriggerStatus(trigger: Trigger): void {
    const newStatus = !trigger.is_active;

    const payload = {
      intent_id: trigger.id,
      is_active: newStatus
    };

    // Use the correct API endpoint from IntentComponent
    this.httpService.mobileBankingPost('builder/nodes/intent/status', payload).subscribe({
      next: (res: any) => {
        if (res.status === '00') {
          // On success, update the property ON THE OBJECT in the array.
          // This instantly updates the UI without a page reload.
          trigger.is_active = newStatus;
          this.toastrService.success(`Trigger status updated to ${newStatus ? 'Active' : 'Inactive'}.`, 'Success');
        } else {
          // If the API call fails, the UI does not change, which is correct.
          this.toastrService.warning(res.message || 'Failed to update trigger status.', 'Warning');
        }
      },
      error: (err: any) => {
        // The UI also remains unchanged on HTTP error.
        this.toastrService.error(err?.error?.message || 'An error occurred while updating status.', 'Error');
      }
    });
  }

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
    const model = {
      ...this.triggerForm.value,
      chatbot_id: chatbotId,
      is_root: true,
      order: (this.agentList.length || 0) + 1, // A slightly better way to order
    };
    this.httpService.mobileBankingPost('builder/nodes/intent', model).subscribe({
        next: (result: any) => {
          if (result.status === '00') {
            this.fetchIntentList(chatbotId); // Refresh list to show the new item
            Swal.fire('Success', 'Trigger Created Successfully!', 'success');
            this.closeModal();
          } else {
            Swal.fire('Error', result.message || 'Failed to create intent.', 'error');
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err?.error?.message || 'An error occurred while creating the trigger.', 'error');
        }
      });
  }

  openIntent(trigger: Trigger): void {
    if (!trigger?.id) {
      console.warn('Trigger ID not found.');
      return;
    }
    // This is correct: it passes the whole trigger object with its current state
    this.router.navigate(['../intent', trigger.id], {
      relativeTo: this.route,
      state: { triggerData: trigger }
    });
  }

  editTrigger(trigger: Trigger): void {
    // This function relies on another component 'AddCustomerComponent'.
    // Assuming that component is set up to handle 'edit-trigger', this logic is okay.
    this.modalRef = this.modalService.open(AddCustomerComponent, { centered: true, size: 'lg' });
    this.modalRef.componentInstance.title = 'Edit Trigger';
    this.modalRef.componentInstance.formData = trigger;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        const chatbotId = this.globalService.getChatbotId();
        if (chatbotId) this.fetchIntentList(chatbotId); // Refresh list on success
        this.toastrService.success('Trigger updated successfully!');
      }
    }).catch(() => {});
  }

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
        // ✅ CORRECTED: Use the correct API endpoint for deleting an intent
        this.httpService.mobileBankingPost(`builder/nodes/intent/delete/${trigger.id}`, {}).subscribe({
          next: (res: any) => {
            if (res.status === '00') {
              Swal.fire('Deleted!', 'The trigger has been deleted.', 'success');
              const chatbotId = this.globalService.getChatbotId();
              if (chatbotId) this.fetchIntentList(chatbotId); // Refresh list
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

  // --- Modal and File Upload Methods ---

  onAddTriggerClick(): void {
    this.initializeForm(); // Reset form for a new entry
    this.triggerModal.nativeElement.classList.add('show');
    this.triggerModal.nativeElement.style.display = 'block';
    document.body.classList.add('modal-open');
  }

  closeModal(): void {
    this.triggerModal.nativeElement.classList.remove('show');
    this.triggerModal.nativeElement.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  triggerFileUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onFileUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    // Add your API call logic here for file upload
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