// ====================================================================================
// COPY AND PASTE THE COMPLETE CONTENT INTO YOUR .ts FILE
// ====================================================================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms'; // Added FormArray
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpService } from "../../../../../shared/services/http.service";
import { ConfirmDialogComponent } from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import { CompareImageComponent } from "../../../../../shared/components/compare-image-component/compare-image.component";
import { GlobalService } from '../../../../../shared/services/global.service';
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

  // --- Form Groups ---
  public addChannelForm: FormGroup;
  public brandForm: FormGroup;
  public proactiveMessagesForm: FormGroup;
  public preChatForm: FormGroup; // ADDED: Form for this section

  // --- UI State & Data ---
  public copySuccessMessage = '';
  public webchatId = 'Loading...';
  public deployScript = 'Waiting for chatbot selection...';
  public showModal = false;
  public channels: Channel[] = [];
  public selectedChannel: Channel | null = null;
  
  // --- Section visibility flags ---
  public isSetupSectionOpen = false;
  public isBasicsSectionOpen = false;
  public isProactiveSectionOpen = false;
  public isBrandSectionOpen = false;
  public isPreChatFormSectionOpen = true; // Open this section by default
  public isMobileBehaviourSectionOpen = false;
  
  public activeBrandTab: 'welcome' | 'chat' | 'styles' = 'welcome';

  // --- API & Subscription Properties ---
  private chatbotSub: Subscription;
  public chatbotData: any;
  private readonly storageKey = 'my-app-channels';
  
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
    // Add Channel Form
    this.addChannelForm = this.fb.group({
      channelType: ['Webchat', Validators.required],
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

    // ADDED: Initialize the form for the Pre-Chat Form section
    this.preChatForm = this.fb.group({
      enablePreChatForm: [true],
      fields: this.fb.array([
        this.createPreChatField('Name', true, true),
        this.createPreChatField('Email', true, true),
        this.createPreChatField('Phone', false, false),
      ])
    });
  }

  // ADDED: Helper to create a form group for a single pre-chat field
  createPreChatField(name: string, enabled: boolean, required: boolean): FormGroup {
    return this.fb.group({
      name: [name],
      enabled: [enabled],
      required: [required]
    });
  }

  // ADDED: Getter to easily access the fields FormArray in the template
  get preChatFields(): FormArray {
    return this.preChatForm.get('fields') as FormArray;
  }

  ngOnInit() {
    this.subscribeToChatbotData();
    this.activatedRoute.params.subscribe((params: any) => {
      if (typeof params.id !== 'undefined') { this.customerId = params.id; }
    });
    this.getIndividualData();
    this.loadChannelsFromStorage();
  }

  ngOnDestroy() {
    if (this.chatbotSub) { this.chatbotSub.unsubscribe(); }
  }

  private subscribeToChatbotData() {
    this.chatbotSub = this.globalService.chatbotData$.subscribe(data => {
      if (data && data.id && data.embed_script) {
        this.chatbotData = data; this.webchatId = data.id; this.deployScript = data.embed_script;
      }
    });
  }
  private getIndividualData() {
    const model = { id: this.customerId };
    if (!model.id) { return; }
    this.httpService.mobileBankingPostNest('accounts/getAccountById', model).subscribe((res: any) => {
      if (res.status === 201) { this.accountData = res.data; }
    });
  }
  private loadChannelsFromStorage() {
    const savedChannelsJson = localStorage.getItem(this.storageKey);
    if (savedChannelsJson) {
      this.channels = JSON.parse(savedChannelsJson).map((c: any) => ({ ...c, lastUpdated: new Date(c.lastUpdated) }));
    } else {
      this.channels = [{ name: 'Default Webchat', type: 'Webchat', lastUpdated: new Date(), enabled: true }];
    }
  }
  private saveChannelsToStorage() { localStorage.setItem(this.storageKey, JSON.stringify(this.channels)); }

  onAddChannel() {
    if (this.addChannelForm.invalid) { return; }
    this.channels.unshift({ name: this.addChannelForm.value.name, type: this.addChannelForm.value.channelType, lastUpdated: new Date(), enabled: true });
    this.saveChannelsToStorage();
    this.closeModal();
  }
  copyToClipboard(text: string) { navigator.clipboard.writeText(text).then(() => { this.copySuccessMessage = 'Copied!'; setTimeout(() => { this.copySuccessMessage = ''; }, 2000); }); }
  onSaveChanges() { 
    console.log("Brand Form Saved", this.brandForm.value);
    console.log("Proactive Messages Form Saved", this.proactiveMessagesForm.value);
    console.log("Pre-Chat Form Saved", this.preChatForm.value);
  }
  onTestClick() {
    if (this.deployScript && this.deployScript !== 'Waiting for chatbot selection...') {
      localStorage.setItem('chatbotTestScript', this.deployScript);
      window.open('eclectics/chatbot/test', '_blank');
    } else { alert('The chatbot script is not available yet.'); }
  }
  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; this.addChannelForm.reset({ channelType: 'Webchat', name: '', language: 'English' }); }
  viewChannelDetails(channel: Channel) { this.selectedChannel = channel; }

  toggleSetupSection() { this.isSetupSectionOpen = !this.isSetupSectionOpen; }
  toggleBasicsSection() { this.isBasicsSectionOpen = !this.isBasicsSectionOpen; }
  toggleProactiveSection() { this.isProactiveSectionOpen = !this.isProactiveSectionOpen; }
  toggleBrandSection() { this.isBrandSectionOpen = !this.isBrandSectionOpen; }
  togglePreChatFormSection() { this.isPreChatFormSectionOpen = !this.isPreChatFormSectionOpen; }
  toggleMobileBehaviourSection() { this.isMobileBehaviourSectionOpen = !this.isMobileBehaviourSectionOpen; }
  
  setActiveBrandTab(tab: 'welcome' | 'chat' | 'styles') { this.activeBrandTab = tab; }

  goBackToList() { 
    this.selectedChannel = null; 
    this.isSetupSectionOpen = false; this.isBasicsSectionOpen = false; this.isProactiveSectionOpen = false; this.isBrandSectionOpen = false; this.isPreChatFormSectionOpen = true; this.isMobileBehaviourSectionOpen = false;
  }

  approveRecord() { this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true }); this.modalRef.componentInstance.title = `Approve Record?`; this.modalRef.componentInstance.body = `Do you want to approve this record?`; }
  deleteRecord() { this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true }); this.modalRef.componentInstance.title = `Delete Record?`; this.modalRef.componentInstance.body = `Do you want to delete this record?`; }
  openImage() { this.modalRef = this.modalService.open(CompareImageComponent, { centered: true }); this.modalRef.componentInstance.title = `Image Comparison`; this.modalRef.componentInstance.body = `Do you want to approve this record?`; }
}