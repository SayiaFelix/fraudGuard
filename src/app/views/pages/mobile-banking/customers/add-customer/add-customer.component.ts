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

  
  public editingBot: any | null = null;

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

  public filteredAgentList: any[] = [];
  public nameFilter: string = '';
  public languageFilter: string = 'all';
  public dateFilter: string = 'all';
  public statusFilter: string = 'all';

  public availableFilterLanguages: string[] = [];
  public dateFilterOptions = [
      { value: 'all', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: '7d', label: 'Last 7 Days' },
      { value: '30d', label: 'Last 30 Days' }
  ];
  public statusFilterOptions = [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
  ];

  constructor(
      public activeModal: NgbActiveModal,
      private globalService: GlobalService,
      public fb: FormBuilder,
      private _toastService: ToastrService,
      private _httpService: HttpService) {
  }

  ngOnInit() {
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

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.imageFile = files[0];
      this.imageUploaded = true;
      const reader = new FileReader();
      reader.onload = () => { this.imagePreviewUrl = reader.result; };
      if (this.imageFile) { reader.readAsDataURL(this.imageFile); }
    }
  }

  removeImage(): void {
      this.imageFile = null;
      this.imagePreviewUrl = null;
      this.imageUploaded = false;
      if (this.fileInput) { this.fileInput.nativeElement.value = ''; }
  }

  get totalPages(): number {
      return Math.ceil(this.filteredAgentList.length / this.itemsPerPage);
  }

  get pages(): number[] {
      const pagesArray = [];
      for (let i = 1; i <= this.totalPages; i++) { pagesArray.push(i); }
      return pagesArray;
  }

  applyFilter(): void {
    let filteredData = [...this.fullAgentList];
    const nameSearchValue = this.nameFilter.toLowerCase().trim();
    if (nameSearchValue) {
      filteredData = filteredData.filter(bot => (bot.name || '').toLowerCase().includes(nameSearchValue));
    }
    if (this.languageFilter && this.languageFilter !== 'all') {
      filteredData = filteredData.filter(bot => {
        const botLangs = bot.language ? [bot.language] : (bot.languages || []);
        return botLangs.includes(this.languageFilter);
      });
    }
    if (this.statusFilter && this.statusFilter !== 'all') {
      const isActive = this.statusFilter === 'active';
      filteredData = filteredData.filter(bot => bot.is_active === isActive);
    }
    if (this.dateFilter && this.dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate: Date | undefined;
      switch (this.dateFilter) {
        case 'today': startDate = today; break;
        case '7d': startDate = new Date(); startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate = new Date(); startDate.setDate(now.getDate() - 30); break;
      }
      if (startDate) {
        const finalStartDate = startDate;
        filteredData = filteredData.filter(bot => new Date(bot.created_at) >= finalStartDate);
      }
    }
    this.filteredAgentList = filteredData;
    this.currentPage = 1;
    this.updatePaginatedList();
  }

  updatePaginatedList(): void {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.paginatedAgentLists = this.filteredAgentList.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
      if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.updatePaginatedList(); }
  }

  nextPage(): void { this.goToPage(this.currentPage + 1); }
  previousPage(): void { this.goToPage(this.currentPage - 1); }

fetchAgentLists(): void {
  this.isLoadingBots = true;
  const userId = localStorage.getItem('user_id'); 

  if (!userId) {
    this.fullAgentList = [];
    this.isLoadingBots = false;
    return;
  }
  
  this._httpService.customerPortalGet('builder/chatbots/list', this._httpService.getHeaders()).subscribe({
    next: (res: any) => {
      if (res.status === '00' && Array.isArray(res.data)) {
        this.fullAgentList = res.data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const languages = new Set<string>();
        this.fullAgentList.forEach(bot => {
            if (bot.language) languages.add(bot.language);
            else if (bot.languages && Array.isArray(bot.languages)) bot.languages.forEach((lang: string) => languages.add(lang));
        });
        this.availableFilterLanguages = Array.from(languages).sort();
        this.applyFilter();
      } else {
        this.fullAgentList = []; this.filteredAgentList = []; this.paginatedAgentLists = [];
      }
      this.isLoadingBots = false;
    },
    error: (err: any) => {
      console.error('Error fetching agent list:', err);
      this.fullAgentList = []; this.filteredAgentList = []; this.paginatedAgentLists = []; this.isLoadingBots = false;
    }
  });
}

toggleChatbotStatus(chatbot: any): void {
  const newStatus = !chatbot.is_active;
  const payload = { 
      chatbot_id: chatbot.id, 
      is_active: newStatus 
  };

  this._httpService.mobileBankingPatch('builder/chatbots/update', payload).subscribe({
    next: (res: any) => {
      if (res.status === '00') {
        const botInFullList = this.fullAgentList.find(b => b.id === chatbot.id);
        if (botInFullList) {
            botInFullList.is_active = newStatus;
            this.globalService.setBotStatus({ id: chatbot.id, is_active: newStatus });
        }
        this.applyFilter(); 
      } else {
        this._toastService.warning(res.message || 'Failed to update chatbot status.', 'Warning');
      }
    },
    error: (err: any) => {
      this._toastService.error(err?.error?.message || 'An error occurred while updating status.', 'Error');
    }
  });
}

  public submitData(): void {
      if (this.formData) { this.saveChanges(); }
      this.loading = true;
  }

  addLanguage(event: Event): void {
      const select = event.target as HTMLSelectElement;
      const selectedLang = select.value;
      if (selectedLang && !this.language.includes(selectedLang)) {
          if (this.language.length === 1 && this.language[0] === 'English') { this.language = []; }
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

  sendBot(): void {
    if (this.editingBot) {
      this.updateBot();
    } else {
      this.createBot();
    }
  }

  private createBot(): void {
    this.loading = true;
    const selectedLang = this.language.length > 0 ? this.language[0] : 'English';
    const model = {
      name: this.form.value.name,
      description: this.form.value.description,
      language: selectedLang,
    };

    this._httpService.mobileBankingPost('builder/chatbots/create', model).subscribe({
      next: (result: any) => {
        this.loading = false;
        if (result.status === '00') {
          // Show SweetAlert success message
          Swal.fire({
            title: 'Success!',
            text: 'AI Assistant created successfully!',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28a745'
          }).then(() => {
            this.clearForm();
            this.fetchAgentLists();
            this.globalService.notifyBotCreated();
            this.botCreated.emit();
          });

          this._toastService.success('AI Assistant Created Successfully!', 'Success');
        } else {
          Swal.fire({
            title: 'Warning!',
            text: result.message || 'AI Assistant creation did not complete.',
            icon: 'warning',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ffc107'
          });
          this._toastService.warning(result.message || 'Bot creation did not complete.', 'Warning');
        }
      },
      error: (err: any) => {
        this.loading = false;
        const errorMessage = err?.error?.message || 'An error occurred while creating the AI Assistant.';
        
        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        });
        
        this._toastService.error(errorMessage, 'Error');
      }
    });
  }

private updateBot(): void {
  if (!this.editingBot) return;

  this.loading = true;
  const model = {
    chatbot_id: this.editingBot.id,
    name: this.form.value.name,
    description: this.form.value.description,
    is_active: this.editingBot.is_active,
    language: this.language.length > 0 ? this.language[0] : 'English',
    config: this.editingBot.config || {}
  };

  this._httpService.mobileBankingPatch('builder/chatbots/update', model).subscribe({
    next: (result: any) => {
      this.loading = false;
      if (result.status === '00') {
        Swal.fire({
          title: 'Success!',
          text: 'AI Assistant updated successfully!',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28a745'
        }).then(() => {
          this.clearForm();
          this.fetchAgentLists();
          this.globalService.notifyBotCreated();
          this.botCreated.emit();
        });
        this._toastService.success('AI Assistant updated successfully!', 'Success');
      } else {
        Swal.fire({
          title: 'Warning!',
          text: result.message || 'Update failed.',
          icon: 'warning',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ffc107'
        });
        this._toastService.warning(result.message || 'Update failed.', 'Warning');
      }
    },
    error: (err: any) => {
      this.loading = false;
      const errorMessage = err?.error?.message || 'An error occurred during update.';
      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      });
      this._toastService.error(errorMessage, 'Error');
    }
  });
}

  public editBot(bot: any): void {
    this.editingBot = bot;
    this.form.patchValue({
      name: bot.name,
      description: bot.description
    });

    this.language = bot.language ? [bot.language] : (bot.languages || ['English']);
    this.defaultLanguage = this.language[0];
    this.form.get('language')?.disable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

public deleteBot(bot: any): void {
  Swal.fire({
    title: 'Are you sure?',
    text: `You are about to delete "${bot.name}". This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      const payload = { chatbot_id: bot.id };
      console.log('Attempting to delete bot with payload:', payload);

      this._httpService.mobileBankingDel('builder/chatbots/delete', payload).subscribe({
        next: (res: any) => {
          console.log('Server response from delete API:', res);

          if (res && res.status === '00') {
            Swal.fire('Deleted!', 'The AI Assistant has been deleted.', 'success');
            this.fetchAgentLists()
            console.log(`Bot with id ${bot.id} deleted successfully on server. Removing from local list.`);
            console.log('List size before filter:', this.fullAgentList.length);

            this.fullAgentList = this.fullAgentList.filter(b => b.id !== bot.id);
            
            console.log('List size after filter:', this.fullAgentList.length);
            this.applyFilter();
          } else {
            console.error('Deletion failed: API returned a non-success status.', res);
            this._toastService.error(res.message || 'The server indicated the deletion failed.', 'Error');
            Swal.fire('Failed!', res.message || 'The AI Assistant could not be deleted.', 'error');
          }
        },
        error: (err: any) => {
          console.error('An HTTP error occurred during deletion:', err);
          this._toastService.error(err?.error?.message || 'An unexpected error occurred.', 'Error');
          Swal.fire('Error!', err?.error?.message || 'An unexpected error occurred.', 'error');
        }
      });
    }
  });
}

  public clearForm(): void {
    this.form.reset();
    this.form.get('language')?.enable();
    this.editingBot = null; // Exit edit mode
    this.language = ['English'];
    this.defaultLanguage = 'English';
    this.removeImage();
  }

  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

  private saveChanges(): any {}
}