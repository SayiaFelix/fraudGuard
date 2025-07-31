import {Component, ElementRef, OnInit, ViewChild,} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import {AddCustomerComponent} from "../add-customer/add-customer.component";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import {SwalComponent} from "@sweetalert2/ngx-sweetalert2";
import Swal from "sweetalert2";
import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';
import { GlobalService } from 'src/app/shared/services/global.service';

@Component({
  selector: 'app-list-internet-banking',
  templateUrl: './list-failed-registrations.component.html',
  styleUrls: ['./list-failed-registrations.component.scss'],
  providers: [DatePipe],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        transform: 'translateX(0%)',
        opacity: 1,
        display: 'block'
      })),
      state('out', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      transition('in => out', [
        animate('300ms ease-in-out')
      ]),
      transition('out => in', [
        animate('300ms ease-in-out')
      ]),
    ])
  ]
})

/**
 * Starter-component
 */
export class ListFailedRegistrationsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  @ViewChild('chatContainer') chatContainer!: ElementRef;


isCollapsed: boolean = false;
isDefaultRouteActive = false;

userMessage = '';
messages: { sender: 'bot' | 'user'; text: string; time: Date }[] = [];

chatbotData: any = null;
sessionId = 'test-session-001';
isTyping = false;



  tempProductData = [
    {
      frontendId: 1,
      mobileNumber: '254708223443',
      account: '1238**3747',
      dob: '12-10-1996',
      attemptedOn: '12-02-2023',
      response: "Failed record Mismatch",
    },
    {
      frontendId: 2,
      mobileNumber: '254708223443',
      account: '1238**3747',
      dob: '12-10-1996',
      attemptedOn: '12-02-2023',
      response: "Failed record Mismatch",
    },
    {
      frontendId: 3,
      mobileNumber: '254708223443',
      account: '1238**3747',
      dob: '12-10-1996',
      attemptedOn: '12-02-2023',
      response: "Failed record Mismatch",
    }
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  columns = [
    {name: '#', prop: 'id'},
    {name: 'Customer Name', prop: 'name'},
    {name: 'Phone Number', prop: 'phone_number'},
    {name: 'Email', prop: 'email'},
    {name: 'Identification', prop: 'identification'},
    {name: 'Wallet Account', prop: 'wallet_account'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Failed Registration";

  @ViewChild('mySwal')
 
  public readonly mySwal!: SwalComponent;
  actions = ["View"];
  private total: any;
  public customerId: any;
  result: any;

 agentList: any[] = []; // List of bots
  selectedBotId: string = '';



  constructor(
    private httpService: HttpService,
    private globalService: GlobalService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    public activatedRoute: ActivatedRoute,
    private dataExploration: DataExportationService
  ) {
  }

  ngOnInit() {
  const userId = localStorage.getItem('user_id');
  console.log('Fetched user_id:', userId);
  this.loadBots()

  this.globalService.botCreated$.subscribe(() => {
    this.loadBots(); 
  });

  this.globalService.chatbotData$.subscribe((data) => {
    this.chatbotData = data;
    this.messages = [];

    if (this.chatbotData?.welcome_message) {
      this.messages.push({
        sender: 'bot',
        text: this.chatbotData.welcome_message,
        time: new Date()
      });
    } else {
      this.messages.push({
        sender: 'bot',
        text: '⚠️ Please create a chatbot before starting a test.',
        time: new Date()
      });
    }

    const chatbotId = this.globalService.getChatbotId();
    if (chatbotId) {
      console.log('Using Chatbot ID:', chatbotId);
    } else {
      console.warn('No chatbot ID found');
    }
  });

  // Routing and other initialization
  this.router.events.subscribe(() => {
    const currentUrl = this.router.url;
    this.isDefaultRouteActive = currentUrl.endsWith('/user_bot') || currentUrl.endsWith('/user_bot/general');
  });

  this.breadCrumbItems = [
    { label: 'Mobile banking', path: '/mobile-banking/products/all-products' },
    { label: 'Pages', path: '/' },
    { label: 'Products', active: true },
  ];

  this.getIndividualData(0);

  this.form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    image: [''],
  });
}


onBotSelect(event: any) {
  const botId = +event.target.value;
  console.log('Selected Bot ID:', botId);
  this.globalService.setChatbotId(botId);
  
  const selectedBot = this.agentList.find(bot => bot.id === botId);
  
  if (selectedBot) {
    this.chatbotData = selectedBot;
    
    // Clear existing messages
    this.messages = [];
    
    // Add welcome message if available
    if (selectedBot.welcome_message) {
      this.messages.push({
        sender: 'bot',
        text: selectedBot.welcome_message,
        time: new Date()
      });
    } else {
    
      this.messages.push({
        sender: 'bot',
        text: `Hello! I'm ${selectedBot.name} Virtual Assistant. How can I help you today?`,
        time: new Date()
      });
    }
  }
}


loadBots(): void {
  const userId = localStorage.getItem('user_id');

  if (!userId) {
    console.warn('User ID not found in local storage.');
    this.agentList = [];
    return;
  }

  const usersId = parseInt(userId, 10);
  const body = { user_id: usersId };

  this.httpService.mobileBankingPost('builder/chatbots/list', body).subscribe({
    next: (res: any) => {
      if (res.status === '00' && Array.isArray(res.data)) {
        // Sort by latest created
        this.agentList = res.data.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        this.selectedBotId = this.agentList[0]?.id ?? null;

        // 🔥 Automatically trigger bot selection
        if (this.selectedBotId) {
          this.onBotSelect({ target: { value: this.selectedBotId } });
        }
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




ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

scrollToBottom() {
  try {
    this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
  } catch (err) {}
}


sendMessage(): void {
  // Prevent sending if input is empty or chatbot is not loaded
  if (!this.userMessage.trim() || !this.chatbotData) return;

  const userText = this.userMessage;

  // Push user's message with timestamp
  this.messages.push({
    sender: 'user',
    text: userText,
    time: new Date()
  });

  // Show typing indicator
  this.isTyping = true;

  const body = {
    chatbot_id: this.chatbotData.id,
    message: userText,
    session_id: this.sessionId,
  };

  // Call backend API
  this.httpService.mobileBankingPost('chatbot/chat', body).subscribe({
    next: (result: any) => {
      this.isTyping = false;

      if (result?.status === '00' && result.data?.response) {
        // Push bot response with timestamp
        this.messages.push({
          sender: 'bot',
          text: result.data.response,
          time: new Date()
        });

        // Log intent and confidence if available
        const intent = result.data.metadata?.intent;
        const confidence = result.data.metadata?.confidence;

        console.log('Intent:', intent, 'Confidence:', confidence);
      } else {
        // Push fallback bot message with timestamp
        this.messages.push({
          sender: 'bot',
          text: result.message || 'Unexpected error occurred.',
          time: new Date()
        });
      }
    },
    error: (err: any) => {
      this.isTyping = false;
      console.error(err);
      this.messages.push({
        sender: 'bot',
        text: '⚠️ Error: Unable to reach chatbot.',
        time: new Date()
      });
      Swal.fire('Error', 'Chatbot service not reachable.', 'error');
    },
  });

  // Clear the input field
  this.userMessage = '';
}

  getIndividualData(event: number): void {

    this.loading = true;

    let payload = {
      page: 0,
      size: 1000
    }

    this.httpService
      .mobileBankingPostNest('customers/getAllCustomers?walletAccountAvailable=false', payload)
      .subscribe((res: any) => {
        if (res.status === 201) {
          setTimeout(() => {

            let response = res['data'].filter((i: any) => i.walletAccount !== "").map((item: any, index: any) => {
              let res = {...item,
                frontendId: index + 1,
                wallet_account: "Not Assigned"
              };
              return res;
            })
            this.rows = response;

            this.total = res.metadata.numofrecords;
          }, 10);
        } else {
        }
      });

    this.loading = false;

  }


toggleConversationPanel() {
  this.isCollapsed = !this.isCollapsed;
}


  openAddProductModal() {
    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Categories';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openResetModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Reset Customer';
    this.modalRef.componentInstance.body = 'Do you want to reset this customer?';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Reset Successful',
          'Customer has been reset successfully!',
          'success').then(r => this.getIndividualData(0))
      } else {
        console.log("Error occurred")
      }
    });
  }


  toggleExpandRow(row: any) {
    console.log(row);
    console.log(this.table);

    this.table.rowDetail.toggleExpandRow(row);
  }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

  updateFilter(event: any, columnName: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const temp = this.temp.filter(function (d: any) {
      return d.productName.toLowerCase().indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  toggle(col: any) {
    const isChecked = this.isChecked(col);

    if (isChecked) {
      this.columns = this.columns.filter((c) => {
        return c.name !== col.name;
      });
    } else {
      this.columns = [...this.columns, col];
    }
  }

  isChecked(col: any) {
    return (
      this.columns.find((c) => {
        return c.name === col.name;
      }) !== undefined
    );
  }

  toggleDrop() {
    let checkList: HTMLElement = document.getElementById('list1')!;

    if (checkList.classList.contains('visible'))
      checkList.classList.remove('visible');
    else checkList.classList.add('visible');
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this.openAddModal(eventData.row);

    }

  }

  openAddModal(data: any) {

    console.log("data...")
    console.log(data)

    // Open other page with details on why customer creation failed.
    this.router.navigate([`/mobile-banking/customers/reason/${data.id}`])

    // this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    // this.modalRef.componentInstance.title = 'Registration Failed';
    //
    // this.modalRef.componentInstance.body= "You input the wrong mobile number.";
    // this.modalRef.result.then((result) => {
    //   if (result === 'success') {
    //   } else {
    //     console.log("Error occurred")
    //   }
    // });
  }
}
