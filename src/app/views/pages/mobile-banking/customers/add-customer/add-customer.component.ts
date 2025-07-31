import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { GlobalService } from 'src/app/shared/services/global.service';
import { ToastrService } from 'ngx-toastr';
import Swal from "sweetalert2";

@Component({
    selector: 'app-add-workflow-step',
    templateUrl: './add-customer.component.html',
    styleUrls: ['./add-customer.component.scss']
})
export class AddCustomerComponent implements OnInit {
    // --- PROPERTIES FOR IMAGE UPLOADER ---
    @ViewChild('fileInput') fileInput: ElementRef;
    imageUploaded: boolean = false;
    imagePreviewUrl: string | ArrayBuffer | null = null;
    imageFile: File | null = null;

    @Output() botCreated = new EventEmitter<void>();
    @Input() title: any;
    @Input() formData: any;
    public loading = false;
    public hasErrors = false;
    public errorMessages: any;
    public form: FormGroup;

    availableLanguages: string[] = ['English', 'Swahili', 'French', 'Arabic', 'Spanish', 'German'];
    language: string[] = ['English'];
    defaultLanguage: string = 'English';
    data: any;
    chatbotdata: any;
    result: any;
    agentList: any[] = [];
    chatbotList: any[] = [];
    isLoadingBots = false;
    fullAgentList: any[] = []; 
    paginatedAgentLists: any[] = []; 
    public currentPage: number = 1;
    public itemsPerPage: number = 3; 

    constructor(
        public activeModal: NgbActiveModal,
        private globalService: GlobalService,
        public fb: FormBuilder,
        private _toastService: ToastrService,
        private _httpService: HttpService) {
    }

    ngOnInit() {
      this.fetchAgentList();
      this.fetchAgentLists();

      this.form = this.fb.group({
          name: ['', Validators.required],
          description: [''],
          language: [''],
      });
    }

    uploadImageClick(): void {
      this.fileInput.nativeElement.click();
    }

    /**

     * @param event The file input change event.
     */
    onFileChange(event: any): void {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.imageFile = files[0];
        this.imageUploaded = true;

        // Generate a preview
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreviewUrl = reader.result;
        };
        if (this.imageFile) {
            reader.readAsDataURL(this.imageFile);
        }
      }
    }

    removeImage(): void {
        this.imageFile = null;
        this.imagePreviewUrl = null;
        this.imageUploaded = false;
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    get totalPages(): number {
        return Math.ceil(this.fullAgentList.length / this.itemsPerPage);
    }

    get pages(): number[] {
        const pagesArray = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pagesArray.push(i);
        }
        return pagesArray;
    }

    updatePaginatedList(): void {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.paginatedAgentLists = this.fullAgentList.slice(startIndex, endIndex);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updatePaginatedList();
        }
    }

    nextPage(): void {
        this.goToPage(this.currentPage + 1);
    }

    previousPage(): void {
        this.goToPage(this.currentPage - 1);
    }

    fetchAgentLists(): void {
      this.isLoadingBots = true;
      const userId = localStorage.getItem('user_id');

      if (!userId) {
        console.warn('User ID not found in local storage.');
        this.fullAgentList = [];
        this.isLoadingBots = false;
        return;
      }

      const usersId = parseInt(userId, 10);
      const body = { user_id: usersId };

      this._httpService.mobileBankingPost('builder/chatbots/list', body).subscribe({
        next: (res: any) => {
          if (res.status === '00' && Array.isArray(res.data)) {
            this.fullAgentList = res.data
              .sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            this.currentPage = 1;
            this.updatePaginatedList();
          } else {
            this.fullAgentList = [];
            this.paginatedAgentLists = [];
            console.warn('Unexpected data format', res);
          }
          this.isLoadingBots = false;
        },
        error: (err: any) => {
          console.error('Error fetching agent list:', err);
          this.fullAgentList = [];
          this.paginatedAgentLists = [];
          this.isLoadingBots = false;
        }
      });
    }

    toggleChatbotStatus(chatbot: any): void {
      const newStatus = !chatbot.is_active;
      const payload = {
        chatbot_id: chatbot.id,
        is_active: newStatus
      };

      this._httpService.mobileBankingPost('builder/chatbots/status', payload).subscribe({
        next: (res: any) => {
          if (res.status === '00') {
            const botInFullList = this.fullAgentList.find(b => b.id === chatbot.id);
            if (botInFullList) {
                botInFullList.is_active = newStatus;
            }
            this.updatePaginatedList();
          } else {
            this._toastService.warning(
              res.message || 'Failed to update chatbot status.',
              'Warning'
            );
          }
        },
        error: (err: any) => {
          this._toastService.error(
            err?.error?.message || 'An error occurred while updating status.',
            'Error'
          );
        }
      });
    }

    public submitData(): void {
        if (this.formData) {
            this.saveChanges();
        }
        this.loading = true;
    }

    addLanguage(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const selectedLang = select.value;

        if (selectedLang && !this.language.includes(selectedLang)) {
            if (this.language.length === 1 && this.language[0] === 'English') {
                this.language = [];
            }
            this.language.push(selectedLang);
            this.defaultLanguage = selectedLang;
            select.value = '';
        }
    }

    removeLanguage(lang: string): void {
      this.language = this.language.filter(l => l !== lang);

      if (this.defaultLanguage === lang) {
        this.defaultLanguage = this.language.length > 0 ? this.language[0] : 'English';
      }
    }

    fetchAgentList(): void {
     const userId = localStorage.getItem('user_id');
      if (!userId) {
        console.warn('User ID not found in local storage.');
        this.agentList = [];
        return;
      }
      const usersId = parseInt(userId, 10);
      const body = { user_id: usersId };
      this._httpService.mobileBankingPost('builder/chatbots/list', body).subscribe({
        next: (res: any) => {
          if (res.status === '00' && Array.isArray(res.data)) {
            this.agentList = res.data;
          } else {
            this.agentList = [];
            console.warn('Unexpected data format', res);
          }
        },
        error: (err: any) => {
          console.error('Error fetching agent list:', err);
          this.agentList = [];
        }
      });
    }

    sendBot(): void {
      const selectedLang = this.language.length > 0 ? this.language[0] : 'English';

      const model = {
        name: this.form.value.name,
        description: this.form.value.description,
        language: selectedLang,
      };

      console.log('Bot payload:', model);
      if (this.imageFile) {
        console.log('Image to upload:', this.imageFile.name);
      }

      this._httpService
        .mobileBankingPost('builder/chatbots', model)
        .subscribe({
          next: (result: any) => {
            if (result.status === '00') {
              setTimeout(() => {
                this.result = result.data;
                this.globalService.setChatbotId(result.data.id);
                this.globalService.setChatbotData(result.data);
                this.fetchAgentList();
                this.fetchAgentLists();

                Swal.fire('ChatBot', 'Chatbot Created Successfully!', 'success');
                this.globalService.notifyBotCreated();

                this.form.reset();
                this.language = ['English'];
                this.defaultLanguage = 'English';
                this.removeImage();
              }, 10);
            } else {
              this._toastService.warning(
                result.message || 'Bot creation did not complete successfully.',
                'Warning'
              );
            }
          },
          error: (err: any) => {
            console.error('Bot creation failed:', err);
            this._toastService.error(
              err?.error?.message || 'An error occurred while creating the bot.',
              'Error'
            );
          }
        });
    }

    public closeModal(): void {
        this.activeModal.dismiss('Cross click');
    }

    private saveChanges(): any {
    }
}