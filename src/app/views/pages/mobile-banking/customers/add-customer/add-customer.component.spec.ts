import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCustomerComponent } from './add-customer.component';

describe('AddCustomerComponent', () => {
  let component: AddCustomerComponent;
  let fixture: ComponentFixture<AddCustomerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddCustomerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should paginate the transaction list to five rows per page', () => {
    component.transactions = Array.from({ length: 12 }, (_, index) => ({
      transactionId: `TX-${index + 1}`,
      amount: 1000,
      riskScore: 5,
      riskCategory: 'Medium',
      channel: 'Mobile',
      location: 'Nairobi',
      timestamp: new Date(2024, 0, index + 1),
      status: 'Open',
      flaggedBy: 'AI',
      customerName: `Customer ${index + 1}`,
      customerId: `CUST-${index + 1}`,
      deviceId: `DEV-${index + 1}`,
      ipAddress: '127.0.0.1',
      modelAgreement: { flagged: 1, total: 7, text: 'test' },
      mlVotes: '1/7',
      ruleEngine: { triggered: false, rules: [], severity: 0 },
      hybridScore: false,
      aiAnalysis: { details: 'test', signals: [] },
      recommendedAction: 'Review',
      rawData: {},
      senderDeviceId: 'SENDER',
      recipientDeviceId: 'RECIPIENT'
    } as any));

    component.applyFilters();

    expect(component.totalPages).toBe(3);
    expect(component.paginatedTransactions.length).toBe(5);

    component.nextPage();
    expect(component.currentPage).toBe(2);
    expect(component.paginatedTransactions.length).toBe(5);
  });

  it('should show the recipient when the user is the sender and the sender when the user is the receiver', () => {
    const sentTx = {
      customerId: 'CUST-1',
      senderDeviceId: 'CUST-1',
      recipientDeviceId: 'CUST-2',
      rawData: {
        customer_info: { customer_id: 'CUST-1' },
        sender_device: { id: 'CUST-1' },
        recipient_device: { id: 'CUST-2' }
      }
    } as any;

    const receivedTx = {
      customerId: 'CUST-1',
      senderDeviceId: 'CUST-2',
      recipientDeviceId: 'CUST-1',
      rawData: {
        customer_info: { customer_id: 'CUST-1' },
        sender_device: { id: 'CUST-2' },
        recipient_device: { id: 'CUST-1' }
      }
    } as any;

    expect(component.getCounterpartyDisplay(sentTx)).toBe('CUST-2');
    expect(component.getCounterpartyDisplay(receivedTx)).toBe('CUST-2');
  });
});
