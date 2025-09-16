import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpService } from "../../../../../shared/services/http.service";
import { ConfirmDialogComponent } from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import { CompareImageComponent } from "../../../../../shared/components/compare-image-component/compare-image.component";
import { GlobalService } from '../../../../../shared/services/global.service';
import { Subscription, of } from 'rxjs'; 
import { catchError } from 'rxjs/operators'; 
import Swal from "sweetalert2";

export type ChannelType = 'webchat' | 'whatsapp' | 'facebook'; 

export interface Channel {
  id: number; 
  name: string;
  type: ChannelType;
  created_at: string; 
  is_active: boolean; 
  lastUpdated?: Date; 
  enabled?: boolean; 
}

@Component({
  selector: 'app-reasons-for-failure',
  templateUrl: './reasons-for-failure.component.html',
  styleUrls: ['./reasons-for-failure.component.scss'],
})
export class ReasonsForFailureComponent implements OnInit, OnDestroy {

  // --- Form Groups ---
  public addChannelForm: FormGroup;
  public brandForm: FormGroup;
  public proactiveMessagesForm: FormGroup;
  public preChatForm: FormGroup;
  public mobileBehaviourForm: FormGroup;
  public whatsAppForm: FormGroup;
  public whatsAppConfigForm: FormGroup;
  public whatsAppSetupForm: FormGroup;
  public facebookForm: FormGroup;
  public facebookSetupForm: FormGroup;
  public isTesting = false;
  public isLoadingChannels = true; 
  public isVerifyingWhatsApp = false;

  // --- UI State & Data ---
  public copySuccessMessage = '';
  public webchatId = 'Loading...';
  public deployScript = 'Waiting for chatbot selection...';
  public webhookUrl = 'https://v3-api.proto.cx/api/platform/inbound/whatsapp/01K2M81A...';
  public showAppSecret = false;
  public showModal = false;
  public channels: Channel[] = [];
  public selectedChannel: Channel | null = null;

  
   public isSetupSectionOpen = false;
  public isBasicsSectionOpen = true; 
  public isProactiveSectionOpen = false;
  public isBrandSectionOpen = false;
  public isPreChatFormSectionOpen = false;
  public isMobileBehaviourSectionOpen = false;

  
  public isConfigurationSectionOpen = false;
  public isWebhookSectionOpen = false;
  public isConnectedPageSectionOpen = false;
  public activeBrandTab: 'welcome' | 'chat' | 'styles' = 'welcome';

  
  private chatbotSub: Subscription;
  public chatbotData: any;
  

  public modalRef: NgbModalRef;
  public customerId: any;
  public accountData: any;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private httpService: HttpService,
    private router: Router,
    private globalService: GlobalService,
    
  ) {
    // Add Channel Form
    this.addChannelForm = this.fb.group({
      channelType: ['webchat', Validators.required], 
      name: ['', Validators.required],
      language: ['English', Validators.required],
    });

    // Brand Form
    this.brandForm = this.fb.group({
      enableWelcomeScreen: [true],
      title: ['Brand'],
      description1: ['Customise the webchat style to match your brand'],
      description2: ['Customise the webchat style to match your brand'],
    });

    // Proactive Messages Form
    this.proactiveMessagesForm = this.fb.group({
      messageColour: ['#FFFFFF'],
      quickReplyButtonColour: ['#E3EBF9'],
      quickReplyButtonBorderColour: ['#2C71F6'],
    });

    // nitialize the form for the Pre-Chat Form section
    this.preChatForm = this.fb.group({
      enablePreChatForm: [true],
      fields: this.fb.array([
        this.createPreChatField('Name', true, true),
        this.createPreChatField('Email', true, true),
        this.createPreChatField('Phone', false, false),
      ])
    });

    this.mobileBehaviourForm = this.fb.group({
        threshold: [768],
        displayMode: ['fullscreen'], 
        width: [100],
        height: [100]
    });

    this.whatsAppForm = this.fb.group({
      enabled: [true],
      message: ['Please fill in the form before starting the chat.'],
      language: ['English'],
      autoCloseChat: [false],
      autoCloseTimeout: ['15 Minutes']
    });

    this.whatsAppConfigForm = this.fb.group({
      appId: ['', Validators.required],
      appSecret: ['', Validators.required],
      accessToken: ['', Validators.required],
      phoneNumberId: ['', Validators.required]
    });

    this.whatsAppSetupForm = this.fb.group({
      appId: ['01K2M81A7A67HZ6KHZW6MSM4V3'],
      appSecret: ['a-very-secret-password-string']
    });

    
    this.facebookForm = this.fb.group({
      enabled: [true],
      name: ['NIT FB'],
      language: ['English'],
      autoCloseChat: [false],
      autoCloseTimeout: ['15 Minutes']
    });

    this.facebookSetupForm = this.fb.group({
      appId: ['01K35X3A7BEAWTVNNJDCHZYAVG']
    });

  }

  
  createPreChatField(name: string, enabled: boolean, required: boolean): FormGroup {
    return this.fb.group({
      name: [name],
      enabled: [enabled],
      required: [required]
    });
  }

  get preChatFields(): FormArray {
    return this.preChatForm.get('fields') as FormArray;
  }

  ngOnInit() {
    this.subscribeToChatbotData();
    this.activatedRoute.params.subscribe((params: any) => {
      if (typeof params.id !== 'undefined') { this.customerId = params.id; }
    });
    this.getIndividualData();
  }

  ngOnDestroy() {
    if (this.chatbotSub) { this.chatbotSub.unsubscribe(); }
  }

  private subscribeToChatbotData() {
    this.chatbotSub = this.globalService.chatbotData$.subscribe(data => {
      console.log("Received chatbot data:", data);
      if (data && data.id && data.embed_script) {
        this.chatbotData = data;
        this.webchatId = data.id;
        this.deployScript = data.embed_script;
        this.fetchChannels(); 
      } else {
        this.isLoadingChannels = false; 
      }
      console.log("Chatbot data updated:", this.chatbotData);
    });
  }

  private getIndividualData() {
    const model = { id: this.customerId };
    if (!model.id) { return; }
    this.httpService.mobileBankingPostNest('accounts/getAccountById', model).subscribe((res: any) => {
      if (res.status === 201) { this.accountData = res.data; }
    });
  }

  private fetchChannels(): void {
    if (!this.chatbotData || !this.chatbotData.id) {
        console.warn('Cannot fetch channels: Chatbot ID not available.');
        this.isLoadingChannels = false;
        return;
    }

    this.isLoadingChannels = true;
    const body = { chatbot_id: this.chatbotData.id };

    this.httpService.mobileBankingPost('builder/channels/list-by-chatbot', body)
        .pipe(
            catchError(err => {
                console.error('HTTP Error while fetching channels:', err);
                Swal.fire('Error', 'Failed to load channels from the server.', 'error');
                this.isLoadingChannels = false;
                return of(null);
            })
        )
        .subscribe({
            next: (res: any) => {
                console.log('RAW API RESPONSE RECEIVED:', res);
                if (res && res.status === '00' && Array.isArray(res.data)) {
                    const channelData = res.data;
                    console.log("SUCCESS: Found channels array directly in res.data:", channelData);
                    if (channelData.length === 0) {
                        this.channels = [];
                    } else {
                        const supportedTypes: ChannelType[] = ['webchat', 'whatsapp', 'facebook'];
                        this.channels = channelData
                            .filter((apiChannel: any) => supportedTypes.includes(apiChannel.type))
                            .map((apiChannel: any) => ({
                                id: apiChannel.id,
                                name: apiChannel.name,
                                type: apiChannel.type as ChannelType,
                                is_active: apiChannel.is_active,
                                created_at: apiChannel.created_at,
                                language: apiChannel.language,
                                lastUpdated: new Date(apiChannel.created_at),
                                enabled: apiChannel.is_active
                            }));
                    }
                } else {
                    console.warn('FAILURE: Response format was not the expected {status: "00", data: [...]}. Response:', res);
                    this.channels = [];
                }
                this.isLoadingChannels = false;
            },
            error: (err: any) => {
                console.error("Subscription-level error:", err);
                this.isLoadingChannels = false;
            }
        });
  }

  // --- THIS IS THE UPDATED FUNCTION ---
  onVerifyWhatsAppConfig(): void {
    // 1. Check if the form is valid
    if (this.whatsAppConfigForm.invalid) {
      Swal.fire('Error','Please fill in all four configuration fields.', 'error');
      this.whatsAppConfigForm.markAllAsTouched(); // Show validation errors
      return;
    }

    // 2. Set loading state to provide user feedback
    this.isVerifyingWhatsApp = true; 

    // 3. Construct the payload from the form values
    const payload = {
      app_id: this.whatsAppConfigForm.value.appId,
      app_secret: this.whatsAppConfigForm.value.appSecret,
      user_access_token: this.whatsAppConfigForm.value.accessToken,
      phone_number_id: this.whatsAppConfigForm.value.phoneNumberId
    };

    // 4. Make the API call
    this.httpService.mobileBankingPost('whatsapp/configure', payload)
      .subscribe({
        next: (response: any) => {
          if (response.status === '00') {
            Swal.fire('Success','Configuration verified successfully!', 'success');
          } else {
            // Handle cases where the API returns a success status but with an error message
            Swal.fire('Verification Failed', response.message || 'Please check your credentials.', 'error');
          }
          this.isVerifyingWhatsApp = false; // Reset loading state
        },
        error: (err: any) => {
          console.error('WhatsApp configuration API error:', err);
          const errorMessage = err?.error?.message || 'An unexpected error occurred during verification.';
          this.isVerifyingWhatsApp = false; // Reset loading state
          Swal.fire('API Error', errorMessage, 'error');
        }
      });
  }
 
onAddChannel() {
    if (this.addChannelForm.invalid) {
      Swal.fire('Error','Please fill in all required fields.', 'error');
      return;
    }

    if (!this.chatbotData || !this.chatbotData.id) {
        Swal.fire('Error','Cannot create channel: Chatbot data is not available.', 'error');
        return;
    }
    
    const newChannelPayload = {
      chatbot_id: this.chatbotData.id,
      name: this.addChannelForm.value.name,
      type: this.addChannelForm.value.channelType,
      language: this.addChannelForm.value.language 
    };
                           
    this.httpService.mobileBankingPost('builder/channels/create', newChannelPayload) 
      .subscribe({
        next: (response: any) => {
          if (response.status === '00') {
            Swal.fire('Success','Channel created successfully!', 'success');
            this.closeModal();
            this.fetchChannels();
          } else {
            Swal.fire('Error','Failed to create channel.', 'error');
          }
        },
        error: (err: any) => {
          console.error('Error creating channel:', err);
          Swal.fire('Error','An unexpected error occurred.', 'error');
        }
      });
  }

  copyToClipboard(text: string) { navigator.clipboard.writeText(text).then(() => { this.copySuccessMessage = 'Copied!'; setTimeout(() => { this.copySuccessMessage = ''; }, 2000); }); }
  onSaveChanges() {
    console.log("Saving changes for channel:", this.selectedChannel?.name);
    console.log("Brand Form Saved", this.brandForm.value);
    console.log("Proactive Messages Form Saved", this.proactiveMessagesForm.value);
    console.log("Pre-Chat Form Saved", this.preChatForm.value);
  }

isDeployScriptValid(): boolean {
  return !!this.deployScript &&
         this.deployScript.trim().length > 0 &&
         !this.deployScript.includes('Waiting for chatbot selection');
}

async onTestClick() {
  if (this.isTesting) return;
  this.isTesting = true;

  try {
    if (!this.webchatId) {
      alert('No chatbot ID available');
      return;
    }

    if (!this.isDeployScriptValid()) {
      alert('Deploy script is not valid. Please select a chatbot first.');
      return;
    }

    const chatbotId = this.webchatId;
    const chatbotName = this.chatbotData?.name || 'Chatbot';

    const testWindow = window.open('', '_blank');
    if (!testWindow) {
      alert('Please allow popups for this site.');
      return;
    }

    testWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${chatbotName} Bot Test - ID ${chatbotId}</title>
        <style>
          html, body { height: 100%; margin: 0; padding: 0; font-family: Arial, sans-serif; }
          .container { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; }
          .loader { margin: 30px auto; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Testing ${chatbotName} Chatbot (ID: ${chatbotId})</h1>
          <div id="status">Initializing chatbot...</div>
          <div class="loader"></div>
        </div>
        <script>
          (function() {
            const statusEl = document.getElementById('status');
            const loaderEl = document.querySelector('.loader');
            try {
              const iframe = document.createElement("iframe");
              iframe.src = "http://130.61.111.65:5040/static/chat-widget.html?chatbot_id=${chatbotId}";
              iframe.style = "position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none; z-index:9999;";
              iframe.onload = function() { statusEl.textContent = 'Chatbot loaded successfully!'; loaderEl.style.display = 'none'; };
              iframe.onerror = function() { statusEl.textContent = 'Failed to load chatbot.'; loaderEl.style.display = 'none'; };
              document.body.appendChild(iframe);
            } catch (err) {
              statusEl.textContent = 'Error: ' + err.message;
              loaderEl.style.display = 'none';
            }
          })();
        </script>
      </body>
      </html>
    `);
    testWindow.document.close();

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    this.isTesting = false;
  }
}

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; this.addChannelForm.reset({ channelType: 'webchat', name: '', language: 'English' }); } 
  viewChannelDetails(channel: Channel) { this.selectedChannel = channel; }

  toggleSetupSection() { this.isSetupSectionOpen = !this.isSetupSectionOpen; }
  toggleBasicsSection() { this.isBasicsSectionOpen = !this.isBasicsSectionOpen; }
  toggleProactiveSection() { this.isProactiveSectionOpen = !this.isProactiveSectionOpen; }
  toggleBrandSection() { this.isBrandSectionOpen = !this.isBrandSectionOpen; }
  togglePreChatFormSection() { this.isPreChatFormSectionOpen = !this.isPreChatFormSectionOpen; }
  toggleMobileBehaviourSection() { this.isMobileBehaviourSectionOpen = !this.isMobileBehaviourSectionOpen; }
  toggleConfigurationSection() { this.isConfigurationSectionOpen = !this.isConfigurationSectionOpen; }
  toggleWebhookSection() { this.isWebhookSectionOpen = !this.isWebhookSectionOpen; }
  toggleConnectedPageSection() { this.isConnectedPageSectionOpen = !this.isConnectedPageSectionOpen; }

  setActiveBrandTab(tab: 'welcome' | 'chat' | 'styles') { this.activeBrandTab = tab; }

  goBackToList() {
    this.selectedChannel = null;
    this.isSetupSectionOpen = false;
    this.isBasicsSectionOpen = true;
    this.isProactiveSectionOpen = false;
    this.isBrandSectionOpen = false;
    this.isPreChatFormSectionOpen = false;
    this.isMobileBehaviourSectionOpen = false;
    this.isConfigurationSectionOpen = false;
    this.isWebhookSectionOpen = false;
    this.isConnectedPageSectionOpen = false;
  }
  approveRecord() { this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true }); this.modalRef.componentInstance.title = `Approve Record?`; this.modalRef.componentInstance.body = `Do you want to approve this record?`; }
  deleteRecord() { this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true }); this.modalRef.componentInstance.title = `Delete Record?`; this.modalRef.componentInstance.body = `Do you want to delete this record?`; }
  openImage() { this.modalRef = this.modalService.open(CompareImageComponent, { centered: true }); this.modalRef.componentInstance.title = `Image Comparison`; this.modalRef.componentInstance.body = `Do you want to approve this record?`; }
}