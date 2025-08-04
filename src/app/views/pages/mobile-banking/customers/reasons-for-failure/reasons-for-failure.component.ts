// ====================================================================================
// FINAL, CORRECTED AND UPDATED TYPESCRIPT FILE
// ====================================================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpService } from "../../../../../shared/services/http.service";
import { ConfirmDialogComponent } from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import { CompareImageComponent } from "../../../../../shared/components/compare-image-component/compare-image.component";
import { GlobalService } from '../../../../../shared/services/global.service'; // Adjust path if necessary
import { Subscription } from 'rxjs';

export interface Channel {
  name: string;
  type: 'Webchat' | 'WhatsApp';
  lastUpdated: Date;
  enabled: boolean;
}

@Component({
  selector: 'app-reasons-for-failure',
  templateUrl: './reasons-for-failure.component.html',
  styleUrls: ['./reasons-for-failure.component.scss'],
})
export class ReasonsForFailureComponent implements OnInit, OnDestroy {

  // --- Properties for UI State & Data ---
  public copySuccessMessage = '';
  public webchatId = 'Loading...';
  public deployScript = 'Waiting for chatbot selection...';
  public showModal = false;
  public channels: Channel[] = [];
  public selectedChannel: Channel | null = null;
  public addChannelForm: FormGroup;

  // --- ADDED: State flags for each collapsible section ---
  public isSetupSectionOpen = false;
  public isBasicsSectionOpen = true; // Set to true to be open by default as per the design
  public isProactiveSectionOpen = false;
  public isBrandSectionOpen = false;
  public isPreChatFormSectionOpen = false;
  public isMobileBehaviourSectionOpen = false;

  // --- API & Subscription Properties ---
  private chatbotSub: Subscription;
  public chatbotData: any;
  private readonly storageKey = 'my-app-channels';
  
  // --- Original Properties ---
  public modalRef: NgbModalRef;
  public customerId: any;
  public accountData: any;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private httpService: HttpService,
    private router: Router,
    private globalService: GlobalService
  ) {
    this.addChannelForm = this.fb.group({
      channelType: ['Webchat', Validators.required],
      name: ['', Validators.required],
      language: ['English', Validators.required],
    });
  }

  // --- Angular Lifecycle Hooks ---

  ngOnInit() {
    
    this.subscribeToChatbotData();
    this.activatedRoute.params.subscribe((params: any) => {
      if (typeof params.id !== 'undefined') {
        this.customerId = params.id;
      }
    });
    this.getIndividualData();
    this.loadChannelsFromStorage();
  }

  ngOnDestroy() {
    if (this.chatbotSub) {
      this.chatbotSub.unsubscribe();
    }
  }

  // --- API and Data Handling Methods ---
  private subscribeToChatbotData() {
    this.chatbotSub = this.globalService.chatbotData$.subscribe(data => {
      if (data && data.id && data.embed_script) {
        console.log("Received valid chatbot data. Populating fields.");
        this.chatbotData = data;
        this.webchatId = data.id;
        this.deployScript = data.embed_script;
      }
      console.log("Chatbot data updated:", this.chatbotData);
    });
}

  // private subscribeToChatbotData() {
  //   this.chatbotSub = this.globalService.chatbotData$.subscribe(data => {
  //     // THE FIX IS HERE: We now check for `embed_script` and use it directly.
  //     if (data && data.id && data.embed_script) {
  //       console.log("Received valid chatbot data. Populating fields.");
        
  //       // 1. Store the full data object
  //       this.chatbotData = data;
        
  //       // 2. Set the Webchat ID from the data
  //       this.webchatId = data.id;
        
  //       // 3. Set the deploy script DIRECTLY from the data
  //       this.deployScript = data.embed_script;
  //     }
  //   });
  // }

  private getIndividualData() {
    const model = { id: this.customerId };
    if (!model.id) {
      return;
    }
    this.httpService.mobileBankingPostNest('accounts/getAccountById', model).subscribe((res: any) => {
      if (res.status === 201) {
        this.accountData = res.data;
      }
    });
  }

  // --- Local Storage Methods ---

  private loadChannelsFromStorage() {
    const savedChannelsJson = localStorage.getItem(this.storageKey);
    if (savedChannelsJson) {
      const savedChannels = JSON.parse(savedChannelsJson);
      this.channels = savedChannels.map((channel: any) => ({
        ...channel,
        lastUpdated: new Date(channel.lastUpdated)
      }));
    } else {
      this.channels = [{
        name: 'Default Webchat',
        type: 'Webchat',
        lastUpdated: new Date(),
        enabled: true,
      }];
    }
  }

  private saveChannelsToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.channels));
  }

  // --- UI and Event Handler Methods ---

  onAddChannel() {
    if (this.addChannelForm.invalid) { return; }
    const newChannel: Channel = {
      name: this.addChannelForm.value.name,
      type: this.addChannelForm.value.channelType,
      lastUpdated: new Date(),
      enabled: true,
    };
    this.channels.unshift(newChannel);
    this.saveChannelsToStorage();
    this.closeModal();
  }

  copyToClipboard(text: string) { navigator.clipboard.writeText(text).then(() => { this.copySuccessMessage = 'Copied!'; setTimeout(() => { this.copySuccessMessage = ''; }, 2000); }); }
  onSaveChanges() { console.log("Save button clicked."); }
  onTestClick() {
    if (this.deployScript && this.deployScript !== 'Waiting for chatbot selection...') {
      localStorage.setItem('chatbotTestScript', this.deployScript);
      window.open('eclectics/chatbot/test', '_blank');
    } else {
      alert('The chatbot script is not available yet. Please select a chatbot to generate the script first.');
    }
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; this.addChannelForm.reset({ channelType: 'Webchat', name: '', language: 'English' }); }
  viewChannelDetails(channel: Channel) { this.selectedChannel = channel; }
  
  // --- ADDED: Toggle functions for each section ---
  toggleSetupSection() { this.isSetupSectionOpen = !this.isSetupSectionOpen; }
  toggleBasicsSection() { this.isBasicsSectionOpen = !this.isBasicsSectionOpen; }
  toggleProactiveSection() { this.isProactiveSectionOpen = !this.isProactiveSectionOpen; }
  toggleBrandSection() { this.isBrandSectionOpen = !this.isBrandSectionOpen; }
  togglePreChatFormSection() { this.isPreChatFormSectionOpen = !this.isPreChatFormSectionOpen; }
  toggleMobileBehaviourSection() { this.isMobileBehaviourSectionOpen = !this.isMobileBehaviourSectionOpen; }
  
  // --- UPDATED: Resets all section states on going back ---
  goBackToList() { 
    this.selectedChannel = null; 
    // Reset all collapsible sections to their default state
    this.isSetupSectionOpen = false; 
    this.isBasicsSectionOpen = true; // Or false if you prefer it closed
    this.isProactiveSectionOpen = false;
    this.isBrandSectionOpen = false;
    this.isPreChatFormSectionOpen = false;
    this.isMobileBehaviourSectionOpen = false;
  }

  // --- Original Methods for Modals ---
  approveRecord() { this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true }); this.modalRef.componentInstance.title = `Approve Record?`; this.modalRef.componentInstance.body = `Do you want to approve this record?`; }
  deleteRecord() { this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true }); this.modalRef.componentInstance.title = `Delete Record?`; this.modalRef.componentInstance.body = `Do you want to delete this record?`; }
  openImage() { this.modalRef = this.modalService.open(CompareImageComponent, { centered: true }); this.modalRef.componentInstance.title = `Image Comparison`; this.modalRef.componentInstance.body = `Do you want to approve this record?`; }
}