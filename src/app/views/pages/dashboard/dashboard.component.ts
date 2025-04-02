import { HttpClient } from '@angular/common/http';
import { Component,ViewChild,  ElementRef,OnInit,ChangeDetectorRef } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { NgbDateStruct, NgbCalendar, NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CustomValidators } from 'ngx-custom-validators';
import { Observable, map, of } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import { formatDate } from '@angular/common';
declare var bootstrap: any
import { forkJoin } from 'rxjs';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

// interface Message {
//   text: string;
//   sender: "user" | "bot";
//   isAttention?: boolean;  
// }

interface Message {
  text: string;
  sender: "bot" | "user";
  isAttention?: boolean; 
  isWelcomeMessage?: boolean;  // Allow optional welcome message flag
}


interface Customer {
  Account: string;
  "Account Balance": number;
  "CRB Score": number;
  "CUST TYPE": string;
  "Date Created": string;
  "Express_age": number;
  "Has Q-Loan\nMobile Loan": number;
  "ID Number": number;
  "Loan_income": number;
  "Location Details": string;
  Phone: number;
  "Risk Category": string;
  "Risk Profile": number;
  "Sidian Express Name": string;
  "Sidian Express Number": number;
  Status: string;
  "avg_monthly_cash_flow": number;
  "default_probability": number;
  "discounted_loan_value": number;
  "loan_limit": number;

   // ✅ Allow `null` explicitly
   alertMessage?: string | null;      
   recommendation?: string; 
 
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  preserveWhitespaces: true
})
export class DashboardComponent implements OnInit {
  public form: FormGroup;
  errorMsg: string;
  hasError: boolean = false;
  certificateAvailable = false;
  private brochureUrl = 'assets/images/certificate.png';
  uploadedImageUrl: string | undefined;
  imageUploaded = false;
  selectedFile: File | null = null;
  selectedImage: any = 'assets/images/ns.jpg'; 
  uploadedImage: File | null = null;
  allCustomers: Customer[] = [];

  public downloadLink: SafeUrl;
  isLoading: boolean = false;
  errorMessage: string;
  modalRef: NgbModalRef;
  userData$: Observable<any>;
  companyEmail: string | null;
  licenceNumber: string | null;
  profile: string | null;
  companyRegistrationDate: string | null;
  county: string | null;
  contactPerson: string | null;
  logo: string | null;
  facilityType: string | null;
  facilityCategory: string | null;
  businessPhone: string | null;
  selectedImageFile: File | null = null;

  showLeaveCommentForm: boolean = false;
  showFormImage = 'assets/images/chats.png'

  isChatOpen = false;
  messages: Message[] = [{ text: "Welcome 😊 to Analytic AI !!", sender: "bot" ,isWelcomeMessage: true}];
  userMessage = "";

  /**
   * Apex chart
   */
  public customersChartOptions: any = {};
  public ordersChartOptions: any = {};
  public growthChartOptions: any = {};
  public revenueChartOptions: any = {};
  public monthlySalesChartOptions: any = {};
  public cloudStorageChartOptions: any = {};

  // colors and font variables for apex chart
  obj = {
    primary: "#6571ff",
    secondary: "#7987a1",
    success: "#05a34a",
    info: "#66d1d1",
    warning: "#F69414",
    danger: "#ff3366",
    light: "#e9ecef",
    dark: "#060c17",
    muted: "#7987a1",
    gridBorder: "rgba(77, 138, 240, .15)",
    bodyColor: "#000",
    cardBg: "#fff",
    fontFamily: "'Roboto', Helvetica, sans-serif"
  }
  existingImage: SafeResourceUrl;

  /**
   * NgbDatepicker
   */
  currentDate: NgbDateStruct;
  standards: any;
  loading: boolean
  profileDetails: any;
  showUploadText = false;
  certificate: any;
  resultRef: any;
  results: any;
  message: string;
  // errorMessage: string = '';
  // isLoading: boolean = false;
  

  accountNumber: string  = '';
  loanLimitData: any = null;
  riskAnalysisData: any = null;  // Store Risk API response
  featureImportanceData: any = null; 
  searchQuery: string = '';
  selectedRiskCategory: string = '';
  simulatedCashFlow: number = 1000;
  simulatedLoanLimit: number = 0;
  loanAmount: number = 0;
  interestRate: number = 0;
  loanTerm: number = 0;

  loanPerformance: any = {
    status: '',
    default_probability: 0,
    crb_score: 0
  };

  // simulatedCashFlow: number = 10000; // Default value
  // simulatedLoanLimit: number = 0;

  // loanPerformance = {
  //   status: "Good Standing",
  //   default_probability: 0.05, // 5%
  //   crb_score: 750
  // };

  private inactivityTimer: any;

  private inactivityTimeout: any;
  private warningTimeout: any;
  private blinkInterval: any;
  private isWarningActive: boolean = false;

  currentVisuals: { id: string; src: string }[] = [];
  currentBatchIndex: number = 0;
  itemsPerBatch: number = 6;
  intervalId: any;

  currentPage = 1;
  pageSize = 10;
  perPage = 100;
  page = 3


  // currentPage = 0;
  itemsPerPage = 4;
  isEntering = true;
  isExiting = false;
  @ViewChild('chatMessagesContainer') private chatMessagesContainer: ElementRef;

  user: any;
  marketTrends: any[];
  riskScore: number;
  riskMessage: string;
  recommendations: string;
  portfolioChart: any;
  // customers: any[] = [];
  repaymentAmount: number | null = null;
  closeTimeout: any;
  dashboardData: any = null;
  kpis: any = {};
  images: any = {};
  forecast: any = {};

  customers: Customer[] = [];
  riskCategoryChart = "assets/images/risk_category_Individual_distribution.png";
  defaultProbabilityChart = "assets/images/loan_vs_default_probability.png";
  investortrendsChart = "assets/images/investortrends.PNG";
  max_days_arearsChart = "assets/images/max_days_arears.png";

  

  // apiUrl = 'http://130.61.111.65:5010/api/customer_data';
  apiUrl = 'http://127.0.0.1:5050/api/customer_data';
  loanUrl = 'http://127.0.0.1:5050/api/loan_amount'
  riskUrl = 'http://127.0.0.1:5050/api/default_probability'
  featureImportanceUrl = 'http://127.0.0.1:5050/api/feature_importance'

  // currentPage: number = 1;  
  totalPages: number = Math.ceil(this.customers.length / this.pageSize);

  dashboards: { id: string; src: string }[] = [
    // Processed Transactions
    {
      id: 'dashboard1',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet1',
    },
    {
      id: 'dashboard2',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet2',
    },
    {
      id: 'dashboard3',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet3',
    },
    {
      id: 'dashboard4',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet4',
    },
    {
      id: 'dashboard5',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet5',
    },
    {
      id: 'dashboard6',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet6',
    },
    // Bill
    {
      id: 'dashboard7',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet7',
    },
    {
      id: 'dashboard8',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet8',
    },
    {
      id: 'dashboard9',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet9',
    },
    // New Customers
    {
      id: 'dashboard10',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet10',
    },
    {
      id: 'dashboard11',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet11',
    },
    {
      id: 'dashboard12',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet12',
    },
    {
      id: 'dashboard13',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet13',
    },
    {
      id: 'dashboard14',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet14',
    },
    {
      id: 'dashboard15',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet15',
    },
    // SMS Status
    {
      id: 'dashboard16',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet16',
    },
    {
      id: 'dashboard17',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet17',
    },
    {
      id: 'dashboard18',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet20',
    }
  ];
  


  paginatedDashboards: { id: string; src: string }[] = [];
  // totalPages: number = Math.ceil(this.dashboards.length / this.itemsPerPage);

  constructor(private calendar: NgbCalendar,
    private cdr: ChangeDetectorRef,
    private httpService: HttpService,
    fb: FormBuilder,
    private _router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    public modal: NgbModal,
    public activeModal: NgbActiveModal,) {
    this.downloadLink = this.sanitizer.bypassSecurityTrustUrl(this.brochureUrl);
    this.form = fb.group({
      name: ["", Validators.compose([Validators.required])],
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['', Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      phone_number: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
    });
  }


  ngOnInit(): void {
    this.simulateLoanLimit();
    this.fetchCustomerData()
    this.loadDashboardData();
    this.loadForecastData();
    this.kpis = {
      totalInvestments: 1500000,
      portfolioGrowth: 12.5,
      roi: 7.2
    };

    // Mock AI Investment Insights
    this.recommendations = "Investors need to focus into a high-growth tech stocks and bonds based on their risk profile.";

    // Mock Market Trends Data (Next-Day Prediction)
    this.marketTrends = [
      { asset: 'NSE 20 Index', change: 1.8 },
      { asset: 'Safaricom Stock', change: 3.1 },
      { asset: 'KCB Bank Shares', change: -0.9 },
      { asset: 'Real Estate Index', change: 2.7 }
    ];

    // Mock Risk Score
    this.riskScore = 68;
    this.riskMessage = this.riskScore > 80 ? 
      "Investors have moderate risk profile. They need to consider diversifying to balance their investments." : 
      "Their portfolio is balanced with low risk exposure.";

    // Initialize Portfolio Performance Chart
    this.initPortfolioChart();
  }

   // Function to determine risk level based on default probability
   getRiskLabel(probability: number): { label: string; color: string } {
    const riskPercentage = probability * 100; // Convert from 0-1 to 0-100
  
    if (riskPercentage < 20) {
      return { label: "Very Low Risk", color: "green" };
    } else if (riskPercentage < 40) {
      return { label: "Low Risk", color: "orange" };
    } else if (riskPercentage < 70) {
      return { label: "Medium Risk", color: "blue" };
    } else {
      return { label: "High Risk", color: "red" };
    }
  }
  

  fetchCustomerData() {
    this.isLoading = true;
    const requestBody = {
      page: this.currentPage,
      size: this.pageSize,
      filters: {
        "CUST TYPE": "I",
        ...(this.searchQuery ? { "Account": this.searchQuery } : {}),
        ...(this.selectedRiskCategory ? { "Risk Category": this.selectedRiskCategory } : {})
      }
    };
  
    this.http.post<{ status: string; sidian_customer_data: Customer[] }>(this.apiUrl, requestBody)
      .subscribe(response => {
        if (response.status === '00' && response.sidian_customer_data) {
          this.isLoading = false;
  
          this.allCustomers = response.sidian_customer_data.map(customer => {
            // Get risk category
            const riskCategory = this.getRiskCategory(customer.default_probability);
  
            // Generate AI-based loan recommendation
            const recommendation = this.getLoanRecommendation(customer);
  
            // Generate real-time alert if high risk
            const alertMessage = customer.default_probability > 0.9 
              ? `🚨 ALERT: Default Probability is ${Math.round(customer.default_probability * 100)}% !!!` 
              : null;
  
            return {
              ...customer,
              "Risk Category": riskCategory,
              recommendation,
              alertMessage
            };
          });
  
          // Apply filtering
          this.filterCustomers();
  
          // Log real-time alerts & recommendations
          this.allCustomers.forEach(customer => {
            if (customer.alertMessage) console.warn(customer.alertMessage);
            console.log(`AI Recommendation for ${customer.Account}: ${customer.recommendation}`);
          });
        }
      }, error => {
        this.isLoading = false;
        console.error('Error fetching data', error);
      });
  }

  getLoanRecommendation(customer: Customer): string {
    const maxLoan = customer.loan_limit ?? 0;
    const interestRate = this.calculateInterestRate(customer);
  
    if (maxLoan > 0) {
      return `✅ Customer ${customer.Account} qualifies for a ${maxLoan.toFixed(2)}K loan at ${interestRate}% interest.`;
    }
    return `❌ Customer ${customer.Account} is not eligible for a loan.`;
  }
  
  calculateInterestRate(customer: Customer): number {
    // Example logic: Lower risk = lower interest
    if (customer.default_probability < 0.1) return 10;
    if (customer.default_probability < 0.3) return 12;
    if (customer.default_probability < 0.5) return 15;
    return 18; // High risk, higher interest
  }
  
  
  // **Separate function for filtering (called after fetching data)**
  filterCustomers() {
    if (!this.allCustomers) return;
  
    this.customers = this.allCustomers.filter(customer =>
      (!this.searchQuery || customer.Account.includes(this.searchQuery)) &&
      (!this.selectedRiskCategory || customer["Risk Category"] === this.selectedRiskCategory)
    );
  }
  


// prevPage() {
//   if (this.currentPage > 1) {
//     this.currentPage--;
//     this.fetchCustomerData();
//   }
// }

// nextPage() {
//   if (this.currentPage < this.totalPages) {
//     this.currentPage++;
//     this.fetchCustomerData();
//   }
// }

  
resetView() {
  this.loanLimitData = null;
  this.riskAnalysisData = null;
  this.featureImportanceData = null;
  this.accountNumber = '';  // Clears the account number
}


  
  nextPage() {
    this.currentPage++;
    this.fetchCustomerData();
  }


  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.fetchCustomerData();
    }
  }
  
  getRiskClass(risk: string) {
    if (risk.includes('Low')) return 'text-success';
    if (risk.includes('Medium')) return 'text-warning';
    return 'text-danger';
  }

  checkLoanLimit(): void {
    if (!this.accountNumber) {
      this.errorMessage = 'Please enter an account number.';
      return;
    }
  
    this.isLoading = true;
    const requestBody = { Account: this.accountNumber };
  
    forkJoin([
      this.http.post<{ body: any[], status: string }>(this.loanUrl, requestBody),
      this.http.post<{ body: any[], status: string }>(this.riskUrl, requestBody),
      this.http.post<{ body: any, status: string }>(this.featureImportanceUrl, requestBody)
    ]).subscribe({
      next: ([loanResponse, riskResponse, featureResponse]) => {
        // ✅ Check if loan response has data
        this.loanLimitData = (loanResponse.status === '00' && loanResponse.body.length > 0) 
          ? loanResponse.body[0] 
          : null;
  
        // ✅ Check if risk response has data
        this.riskAnalysisData = (riskResponse.status === '00' && riskResponse.body.length > 0) 
          ? riskResponse.body[0] 
          : null;
  
        // ⚠️ Feature Importance API might fail, so handle it separately
        if (featureResponse.status === '00' && featureResponse.body) {
          this.featureImportanceData = featureResponse.body;
        } else {
          console.warn('Feature Importance API issue:', featureResponse);
          this.featureImportanceData = null;
        }
        this.isLoading = false;
  
        // ❌ Show error only if BOTH Loan and Risk APIs fail
        if (!this.loanLimitData && !this.riskAnalysisData) {
          this.errorMessage = 'Account not found. Please check the account number and try again.';
        } else {
          this.errorMessage = ''; // Clear error if Loan or Risk API succeeds
          this.closeModal(); // ✅ Close modal only if Loan or Risk API succeeds
        }
  
        console.log('Loan Data:', this.loanLimitData);
        console.log('Risk Data:', this.riskAnalysisData);
        console.log('Feature Importance:', this.featureImportanceData);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error fetching data:', error);
        this.errorMessage = 'An error occurred while retrieving data. Please try again later.';
      }
    });
  }
  
  

  closeModal() {
    const modalElement = document.getElementById('loanLimitModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) {
      modalInstance.hide();
    }
  }

  filteredCustomers = [...this.customers];

  // // Method to filter customers based on searchQuery and selectedRiskCategory
  // filterCustomers() {
  //   this.filteredCustomers = this.customers.filter(customer => {
  //     const matchesQuery = customer.name.toLowerCase().includes(this.searchQuery.toLowerCase());
  //     const matchesRisk = this.selectedRiskCategory ? customer.riskCategory === this.selectedRiskCategory : true;
  //     return matchesQuery && matchesRisk;
  //   });
  // }


  // Method to simulate loan limit based on cash flow

  simulateLoanLimit() {
    this.simulatedLoanLimit = this.simulatedCashFlow * 3;
  
    // Update loan performance based on the cash flow
    if (this.simulatedCashFlow >= 1000000) {
      this.loanPerformance.status = "Excellent Standing";
      this.loanPerformance.default_probability = 0.01; // 1.0%
      this.loanPerformance.crb_score = 850;
    } else if (this.simulatedCashFlow >= 500000) {
      this.loanPerformance.status = "Good Standing";
      this.loanPerformance.default_probability = 0.05; // 5.0%
      this.loanPerformance.crb_score = 750;
    } else if (this.simulatedCashFlow >= 200000) {
      this.loanPerformance.status = "Moderate Risk";
      this.loanPerformance.default_probability = 0.12; // 12.0%
      this.loanPerformance.crb_score = 650;
    } else {
      this.loanPerformance.status = "High Risk";
      this.loanPerformance.default_probability = 0.25; // 25.0%
      this.loanPerformance.crb_score = 500;
    }
  }
  


  // Method to calculate loan repayment details
  calculateRepayment() {
    const interestRate = 0.1; // 10% interest rate
    this.repaymentAmount = this.simulatedLoanLimit + (this.simulatedLoanLimit * interestRate);
  }

  toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode'); // Toggle dark mode class on body
    localStorage.setItem('darkMode', body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
  }

  // Export data (dummy function)
  exportData(format: string) {
    alert(`Exporting data as ${format.toUpperCase()}`);
    if (format === 'csv') {
      this.exportToCSV();
    } else if (format === 'pdf') {
      this.exportToPDF();
    }
  }

  // Export table data to CSV
  exportToCSV() {
    const headers = ["Account", "Monthly Cash Flow", "CRB Score", "Risk Category", "Status", "Default Probability"];
    const data = this.customers.map(customer => [
      // customer.Name,
      customer.Account,
      `KES ${customer.avg_monthly_cash_flow}`,
      customer["CRB Score"],
      customer["Risk Category"],
      customer.Status,
      `${(customer.default_probability * 100).toFixed(2)}%`
    ]);

    const csvContent = [headers, ...data].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    FileSaver.saveAs(blob, "customer_data.csv");
  }

//   exportToPDF() {
//     const doc = new jsPDF();

//     // **Company Logo**
//     const logo = "assets/images/eclectics.png"; 
//     const logoWidth = 35; 
//     const logoHeight = 15;
//     const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2; // Center logo
//     doc.addImage(logo, "PNG", logoX, 10, logoWidth, logoHeight);

//     // **Title (Below Logo)**
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(18);
//     doc.setTextColor(40, 40, 40);
//     doc.text("Customer Data Report", doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });

//     // **Date and Time**
//     const now = new Date();
//     const dateStr = now.toLocaleDateString();
//     const timeStr = now.toLocaleTimeString();
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(80, 80, 80);
//     doc.text(`Date: ${dateStr} | Time: ${timeStr}`, doc.internal.pageSize.getWidth() / 2, 50, { align: "center" });

//     // **Table Headers**
//     const headers = [
//       ["Account", "Monthly Cash Flow (KES)", "CRB Score", "Risk Category", "Status", "Default Probability"]
//     ];

//     // **Prepare Data for Table**
//     const data = this.customers.map(customer => [
//       customer.Account,
//       `KES ${customer.avg_monthly_cash_flow.toLocaleString()}`,
//       customer["CRB Score"],
//       customer["Risk Category"],
//       customer.Status,
//       `${(customer.default_probability * 100).toFixed(2)}%`
//     ]);

//     // **Styled Table**
//     (doc as any).autoTable({
//       head: headers,
//       body: data,
//       startY: 60, // Adjusted to prevent overlapping
//       theme: "striped",
//       styles: { fontSize: 10, cellPadding: 4 },
//       headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
//       alternateRowStyles: { fillColor: [240, 240, 240] },
//       margin: { top: 50 },
//     });

//     // **Charts Section**
//     const chartWidth = 80; // Width of each chart
//     const chartHeight = 60; // Height of each chart
//     const margin = 10; // Margin between charts
//     const startY = (doc as any).autoTable.previous.finalY + 20; // Start below the table

//     // **First Two Charts (Stay on the Same Page)**
//     doc.addImage(this.riskCategoryChart, "PNG", margin, startY, chartWidth, chartHeight);
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.text("Risk Category Distribution", margin + 10, startY + chartHeight + 5);
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text("Distribution of customers by risk category.", margin + 10, startY + chartHeight + 10);

//     doc.addImage(this.defaultProbabilityChart, "PNG", margin + chartWidth + margin, startY, chartWidth, chartHeight);
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.text("Loan vs Default Probability", margin + chartWidth + margin + 10, startY + chartHeight + 5);
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text("Relationship between loan amount and default probability.", margin + chartWidth + margin + 10, startY + chartHeight + 10);

//     // **NEW PAGE for the Remaining Charts**
//     doc.addPage();
//     const newStartY = 20; // Reset Y position for new page

//     // **Investor Trends Chart**
//     doc.addImage(this.investortrendsChart, "PNG", margin, newStartY, chartWidth, chartHeight);
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.text("Investor Trends", margin + 10, newStartY + chartHeight + 5);
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text("Trends in investor behavior over time.", margin + 10, newStartY + chartHeight + 10);

//     // **Max Days in Arrears Chart**
//     doc.addImage(this.max_days_arearsChart, "PNG", margin + chartWidth + margin, newStartY, chartWidth, chartHeight);
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.text("Max Days in Arrears", margin + chartWidth + margin + 10, newStartY + chartHeight + 5);
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text("Maximum days customers are in arrears.", margin + chartWidth + margin + 10, newStartY + chartHeight + 10);

//     // **Save PDF**
//     doc.save("Analytic_summary.pdf");
// }

exportToPDF() {
  const doc = new jsPDF();

  // **Company Logo**
  const logo = "assets/images/eclectics.png"; 
  const logoWidth = 35; 
  const logoHeight = 15;
  const logoX = (doc.internal.pageSize.getWidth() - logoWidth) / 2; // Center logo
  doc.addImage(logo, "PNG", logoX, 10, logoWidth, logoHeight);

  // **Title (Below Logo)**
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text("Customer Data Report", doc.internal.pageSize.getWidth() / 2, 40, { align: "center" });

  // **Date and Time**
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Date: ${dateStr} | Time: ${timeStr}`, doc.internal.pageSize.getWidth() / 2, 50, { align: "center" });

  // **Table Headers**
  const headers = [
    ["Account", "Monthly Cash Flow (KES)", "CRB Score", "Risk Category", "Status", "Default Probability"]
  ];

  // **Prepare Data for Table**
  const data = this.customers.map(customer => [
    customer.Account,
    `KES ${customer.avg_monthly_cash_flow.toLocaleString()}`,
    customer["CRB Score"],
    customer["Risk Category"],
    customer.Status,
    `${(customer.default_probability * 100).toFixed(2)}%`
  ]);

  // **Styled Table**
  (doc as any).autoTable({
    head: headers,
    body: data,
    startY: 60, // Adjusted to prevent overlapping
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 50 },
  });

  // **Charts Section**
  const chartWidth = 80; // Width of each chart
  const chartHeight = 60; // Height of each chart
  const margin = 10; // Margin between charts
  const startY = (doc as any).autoTable.previous.finalY + 20; // Start below the table

  // **First Two Charts (Stay on the Same Page)**
  
  // **Risk Category Distribution**
  let chartY = startY;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Risk Category Distribution", margin, chartY);
  doc.addImage(this.riskCategoryChart, "PNG", margin, chartY + 5, chartWidth, chartHeight);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Distribution of customers by risk category.", margin, chartY + chartHeight + 10);

  // **Loan vs Default Probability**
  let chartX = margin + chartWidth + margin;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Loan vs Default Probability", chartX, chartY);
  doc.addImage(this.defaultProbabilityChart, "PNG", chartX, chartY + 5, chartWidth, chartHeight);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Relationship between loan amount and default probability.", chartX, chartY + chartHeight + 10);

  // **NEW PAGE for the Remaining Charts**
  doc.addPage();
  const newStartY = 20; // Reset Y position for new page

  // **Investor Trends Chart**
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Investor Trends", margin, newStartY);
  doc.addImage(this.investortrendsChart, "PNG", margin, newStartY + 5, chartWidth, chartHeight);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Trends in investor behavior over time.", margin, newStartY + chartHeight + 10);

  // **Max Days in Arrears Chart**
  chartX = margin + chartWidth + margin;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Max Days in Arrears", chartX, newStartY);
  doc.addImage(this.max_days_arearsChart, "PNG", chartX, newStartY + 5, chartWidth, chartHeight);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Maximum days customers are in arrears.", chartX, newStartY + chartHeight + 10);

  // **Save PDF**
  doc.save("Analytic_summary.pdf");
}

  getRiskCategory(defaultProbability: number): string {
    if (defaultProbability <= 0.2) {
      return "Very Low Risk";
    } else if (defaultProbability > 0.2 && defaultProbability <= 0.4) {
      return "Low Risk";
    } else if (defaultProbability > 0.4 && defaultProbability <= 0.7) {
      return "Moderate Risk";
    } else {
      return "High Risk";
    }
  }

  
  initPortfolioChart() {
    const ctx = document.getElementById('portfolioChart') as HTMLCanvasElement;
    // this.portfolioChart = new Chart(ctx, {
    //   type: 'line',
    //   data: {
    //     labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    //     datasets: [{
    //       label: 'Portfolio Performance (KSh)',
    //       data: [1200000, 1250000, 1300000, 1380000, 1450000, 1500000],
    //       borderColor: '#007BFF',
    //       backgroundColor: 'rgba(0, 123, 255, 0.2)',
    //       fill: true
    //     }]
    //   },
    //   options: {
    //     responsive: true,
    //     plugins: {
    //       legend: { display: false }
    //     }
    //   }
    // });
    // Initialize the first batch
    this.updateCurrentVisuals();

    // Set up automatic sliding every 5 seconds
    this.intervalId = setInterval(() => {
         this.nextBatch();
       }, 30000);
    
    this.updatePagination();
    this.currentDate = this.calendar.getToday();

    this.customersChartOptions = getCustomerseChartOptions(this.obj);
    this.ordersChartOptions = getOrdersChartOptions(this.obj);
    this.growthChartOptions = getGrowthChartOptions(this.obj);
    this.revenueChartOptions = getRevenueChartOptions(this.obj);
    this.monthlySalesChartOptions = getMonthlySalesChartOptions(this.obj);
    this.cloudStorageChartOptions = getCloudStorageChartOptions(this.obj);

    // Some RTL fixes. (feel free to remove if you are using LTR))
    if (document.querySelector('html')?.getAttribute('dir') === 'rtl') {
      this.addRtlOptions();
    }


    this.loadData()
    this.loadCertificate()
    this.loadResults()

  }


  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }

  ngAfterViewInit(): void {
    // Enable Bootstrap Tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
  }

  loadDashboardData() {
    this.isLoading = true;
    this.httpService.getDashboardData().subscribe(
      (response) => {
        if (response.status === "00") {
          this.isLoading = false;
          this.kpis = response.data;

          // Update image URLs
          const baseUrl = "http://127.0.0.1:5005";
          this.images = {
            investment_trends: baseUrl + response.images.investment_trends,
            investor_behavior: baseUrl + response.images.investor_behavior,
            market_sentiment: baseUrl + response.images.market_sentiment
          };
          console.log('KPIS AND Images',this.kpis, this.images);
        } else {
          console.error("Failed to load KPIs:", response.message);
        }
      },
      (error) => {
        this.isLoading = false;
        console.error("Error fetching KPIs:", error);
      }
    );
  }

  loadForecastData() {
    this.httpService.getForecastData().subscribe(
      (response) => {
        if (response.status === "00") {
          this.forecast = response.data;
          console.log('Forecast Data',this.forecast);
        } else {
          console.error("Failed to load forecast data:", response.message);
        }
      },
      (error) => {
        console.error("Error fetching forecast data:", error);
      }
    );
  }

toggleChat(): void {
  this.isChatOpen = !this.isChatOpen;

  if (this.isChatOpen) {
    setTimeout(() => {
      this.scrollToBottom();
    }, 10);
    
    this.startInactivityTimer();
  } else {
    this.clearTimers();
  }
}

sendInactivityMessage() {
  // Add a warning message and store its index for removal later
  this.messages.push({ text: "Are you still there? 😊", sender: "bot", isAttention: true });
  this.isWarningActive = true;

  // Start blinking effect
  let blinkCount = 0;
  this.blinkInterval = setInterval(() => {
    this.isWarningActive = !this.isWarningActive; // Toggle blinking state
    blinkCount++;

    if (blinkCount >= 10) { // Stop blinking after 30s
      clearInterval(this.blinkInterval);
    }
  }, 3000);

  this.scrollToBottom();
  this.cdr.detectChanges();

  // If no response within 30s, close chat
  this.inactivityTimeout = setTimeout(() => {
    if (this.isWarningActive) {
      this.clearChat();
    }
  }, 30000);
}

clearTimers(): void {
  clearTimeout(this.warningTimeout);
  clearTimeout(this.inactivityTimeout);
  clearInterval(this.blinkInterval);
}

handleKeyPress(event: KeyboardEvent) {
  if (event.key === "Enter") {
    this.sendMessage();
  }
}

sendMessage() {
  if (!this.userMessage.trim()) return;

  // Append User Message
  this.messages.push({ text: this.userMessage, sender: "user" });

  // If user responds, remove "Are you still there?" message and stop blinking
  if (this.isWarningActive) {
    this.removeInactivityMessage();
  }

  // Reset inactivity timer
  this.resetInactivityTimer();

  // Send request to API
  this.httpService.sendMessage(this.userMessage).subscribe(
    response => {
      const formattedResponse = this.formatBotResponse(response.reply);
      this.messages.push({ text: formattedResponse, sender: "bot" });
      this.afterMessageUpdate();
    },
    () => {
      this.messages.push({ text: "⚠️ Sorry, I couldn't reach the server. Try again later.", sender: "bot" });
      this.afterMessageUpdate();
    }
  );

  // Clear Input
  this.userMessage = "";
}

private afterMessageUpdate() {
  this.scrollToBottom();
  this.startInactivityTimer();
  this.cdr.detectChanges();
}

// 🔥 Main Timer Logic 🔥
startInactivityTimer() {
  this.clearTimers();
  this.isWarningActive = false;

  // ⏳ After 3 minutes of inactivity, send warning
  this.warningTimeout = setTimeout(() => {
    this.sendInactivityMessage();
  }, 90000); // 3 minutes (180000ms)
}

// 🔄 Remove "Are you still there?" message and stop blinking
private removeInactivityMessage() {
  this.messages = this.messages.filter(msg => msg.text !== "Are you still there? 😊");
  this.isWarningActive = false;
  clearInterval(this.blinkInterval);
  this.cdr.detectChanges();
}


resetInactivityTimer() {
  clearTimeout(this.warningTimeout);
  clearTimeout(this.inactivityTimer);
  
  // Remove the "Are you still there?" message if it's still in the chat
  this.messages = this.messages.filter(msg => msg.text !== "Are you still there? 😊");
  
  this.isWarningActive = false;
  this.startInactivityTimer(); // Restart the inactivity timer
}


// clearChat() {
//   this.isChatOpen = false;
//   this.messages = [{ text: "Welcome 😊 to Analytic AI !!", sender: "bot" }]; // Preserve welcome message
// }
clearChat() {
  this.isChatOpen = false;
  this.messages = [{ text: "Welcome 😊 to Analytic AI !!", sender: "bot", isWelcomeMessage: true }]; // Add a flag
}


  formatBotResponse(response: string): string {
    // Remove asterisks (*) used for bolding
    response = response.replace(/\*\*/g, "");

    // Remove unwanted 'x' (or any other character you want to remove)
    // response = response.replace(/x/g, "");

    // Convert numbered lists into HTML <ul> with <li>
    response = response.replace(/(\d+)\.\s(.+)/g, "<li>🔹 <strong>$2</strong></li>");

    // Wrap lists in <ul> tags if there are list items
    if (response.includes("<li>")) {
        response = response.replace(/(.*?)(<li>.+<\/li>)/s, "$1<ul>$2</ul>");
    }

    return response;
}


handleChatResponse(response: string) {
  // Format the response before adding it to the messages array
  const formattedResponse = this.formatBotResponse(response);
  this.messages.push({ text: formattedResponse, sender: "bot" });
}


  selectedChartUrl: string | null = null;
  selectedChartName: string = '';
  
  // Modify sendMessage() to reset the timer on user input
  
  showChart(type: string) {
    // Define API base URL
    const apiBaseUrl = 'assets/images';

    // Define mapping of prediction types to chart images
    const chartImageMap: { [key: string]: string } = {
      'Total Transactions': 'Total_transactions.png',
      'Loan Repayment Trends': 'Loan_repayment.png',
      'Loan Default Rates': 'Default_rates.png',
      'Customer Deposits Growth': 'customer_deposits_growth_chart.png',
      'Fraud Risk Indicator': 'fraud_risk_indicator_chart.png'
    };
    
    // Set the chart URL dynamically
    this.selectedChartName = type;  

    // Ensure the selected chart exists in the map
    if (chartImageMap[type]) {
        this.selectedChartUrl = `${apiBaseUrl}/${chartImageMap[type]}`;
        console.log("Chart type clicked:", type);
        console.log("Expected image path:", this.selectedChartUrl);
    } else {
        console.error("No image found for:", type);
        this.selectedChartUrl = null;  // Show fallback text if no image
    }

    // Open the Bootstrap modal
    const chartModal = new bootstrap.Modal(document.getElementById('chartModal')!);
    chartModal.show();
}
  
  ngOnDestroy() {
    // Clear interval when the component is destroyed
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  updateCurrentVisuals() {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.currentVisuals = this.dashboards.slice(start, end);
  }


  nextBatch() {
    this.isExiting = true;

    // Wait for exit animation before updating visuals
    setTimeout(() => {
      this.isExiting = false;
   
      this.currentPage = (this.currentPage + 1) % Math.ceil(this.dashboards.length / this.itemsPerPage);
      this.updateCurrentVisuals();
      this.isEntering = true;

      // Reset entering animation
      setTimeout(() => {
        this.isEntering = false;
      }, 1000); // Match animation duration
    }, 1000); // Match animation duration
  }

  phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneNumber = control.value;
    const phonePattern = /^(254\d{9}|0\d{9})$/;
    return phonePattern.test(phoneNumber) ? null : { invalidPhoneNumber: true };
  }

  ngAfterViewChecked() {
    // Scroll to the bottom of the chat messages container
    this.scrollToBottom();
  }

  // Function to scroll to the bottom
  private scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error while scrolling to bottom', err);
    }
  }

  onImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage = e.target.result;
        // Here you can implement logic to upload the image to your server if needed
      };
      reader.readAsDataURL(file);
    }
  }
  showCertificateMessage: boolean = false;

  onDownloadClick() {
    this.showCertificateMessage = true
    setTimeout(() => {
      this.hideCertificateMessage();
    }, 3000);
  }

  hideCertificateMessage() {
    this.showCertificateMessage = false;
  }

  handleImageUpload(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedImageUrl = e.target?.result as string;
        // this.imageUploaded = true;
        this.showUploadText = true;

        const formData = new FormData();
        // console.log(formData)
        formData.append('image', file);
        this.httpService.customerPortalPostFile(`api/v1/auth/uploadLandingPhoto`, formData).subscribe(
          (result: any) => {
            if (result.status === '00') {
              // console.log('Image uploaded successfully!', result);
              this.isLoading = false;
              this.activeModal.close('success');
              Swal.fire('Image uploaded Successfully!',
                'success').then(r => console.log(r))
              this.form.reset()
            } else {
              Swal.fire('Image Uploaded Failed, Try Again',
                'error').then(r => console.log(r))
            }
          },
          (error: any) => {
            Swal.fire('Image Uploaded error',
              'error')
          }
        );
      };
      reader.readAsDataURL(file);
    }
  }

  updatePagination() {
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDashboards = this.dashboards.slice(startIndex, endIndex);
  }
  
  // nextPage() {
  //   if ((this.currentPage + 1) * this.itemsPerPage < this.dashboards.length) {
  //     this.currentPage++;
  //     this.updatePagination();
  //   }
  // }
  
  // prevPage() {
  //   if (this.currentPage > 0) {
  //     this.currentPage--;
  //     this.updatePagination();
  //   }}
  private loadData(): any {
    // this.loading = true;
    // let userId = JSON.parse(localStorage.getItem('data')!)['user']['id'];
    // let model = {
    //   id: userId
    // };
    // // console.log(model)
    // this.httpService.customerPortalPost(`api/v1/auth/getProfile`, model).subscribe(
    //   (res: any) => {
    //     if (res.status == '00') {
    //       this.profileDetails = res['data'];
    //       if (this.profileDetails.PhotoPath && !this.profileDetails.PhotoPath.startsWith('http://') && !this.profileDetails.PhotoPath.startsWith('https://')) {
    //         this.uploadedImageUrl = 'https://' + this.profileDetails.PhotoPath;
    //       } else {
    //         this.uploadedImageUrl = this.profileDetails.PhotoPath || 'assets/images/sd.png'; // Use the default image if PhotoPath is empty
    //       }
    //       // console.log(this.uploadedImageUrl)
    //       this.loading = false;
    //     } else {
    //       console.log('Failed', 'Unable to fetch profile', 'error');
    //     }
    //   },
    //   (error: any) => {
    //     console.log('Error', error.message, 'error');
    //   }
    // );
  }

  private loadResults(): any {
    this.loading = true;
    // let licenceNumber = JSON.parse(localStorage.getItem('data')!)['licenceNumber'];
    let model = {
      // licenceNumber,
      page: this.page - 1,
      size: this.perPage
    };
    // 
    this.httpService.customerPortalPosts(`admin/customer/portal/fetch-result-by-licence-number`, model).subscribe(
      (res: any) => {
        if (res.status == 200) {
          this.results = res['data'];
          // console.log(this.results);

          if(this.results !== undefined){

            const result = res.data.filter((request: any) => request.status === "PUBLISHED" || request.status === "APPEALED" );
            this.resultRef = res.data[0].resultRef;
            // console.log(this.resultRef)
            
            this.results = result
          } else {
            this.results = []
          } 

          this.loading = false;
        } else {
          console.log('Failed', "Unable to fetch results", 'error')
        }
      }, (error: any) => {
        console.log("Error", error.message, "error");
      });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return formatDate(date, 'd MMMM yyyy', 'en-US', '+0530');
  }

  loadCertificate(): void {
    this.loading = true;
   let model =  {
      resultRef:"RSTDAXOYO"
  }
    this.httpService
      .customerPortalPosts('admin/customer/portal/get-certificate',model)
      .subscribe((res: any) => {
        if (res.status === 200) {
          // console.log(res.data);
          this.certificate = res.data.downloadUrl
          if(this.certificate){
            this.existingImage =  this.certificate.replace("http://10.20.2.19:7600", "https://test-api.ekenya.co.ke/tra-backend")
          }else{
            this.existingImage =  'assets/images/certificate.png'
          }
        } else {
          this.loading = false;
        }
      });
    this.loading = false;
  }


  getCertificate(): void {
    this.loading = true;
    let model = {
      resultRef: this.resultRef
    };
    this.http.post('https://test-api.ekenya.co.ke/tra-backend/api/v1/admin/customer/portal/generate-certificate', model, { responseType: 'blob' })
      .subscribe((response: Blob) => {
        const downloadLink = document.createElement('a');
        const imageUrl = URL.createObjectURL(response);
  
        downloadLink.href = imageUrl;
        downloadLink.download = 'Certificate.pdf'; 
        downloadLink.target = '_blank';
       
        downloadLink.click();
  
        // Clean up
        URL.revokeObjectURL(imageUrl);
  
        this.loading = false;
      },
       (error:any) => {
        console.error('Error fetching certificate:', error);
        this.loading = false;
      });
  }
  
  
  // downloadCertificate() {
  //   const refNo = 'your_reference_number'; // Replace with the actual reference number
    
  //   // Make the API request
  //   this.http.post('https://test-api.ekenya.co.ke/tra-backend/api/v1/admin/customer/portal/generate-certificate', { refNo }, { responseType: 'blob' })
  //     .subscribe((response: Blob) => {
  //       // Create a downloadable link
  //       const downloadLink = document.createElement('a');
  //       downloadLink.href = URL.createObjectURL(response);
  //       downloadLink.download = 'certificate.png'; // Change the filename if needed
  //       document.body.appendChild(downloadLink);
  //       downloadLink.click();
  //       document.body.removeChild(downloadLink);
  //     });
  // }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] as File;
  }

  toggleLeaveCommentForm() {
    if (this.showLeaveCommentForm) {
      this.hideLeaveCommentForm();
    } else {
      this.showLeaveCommentForm = true;
      this.showFormImage = this.showLeaveCommentForm ? 'assets/images/chat.png' : 'assets/images/chats.png';
    }
  }

  hideLeaveCommentForm() {
    this.showLeaveCommentForm = false;
    this.form.reset()
  }

  
  handleImageError() {
    this.uploadedImageUrl = 'assets/images/sd.png';
  }

  onleaveComment() {
    this.isLoading = true;
    const model = {
      name: this.form.value.name,
      phone_number: this.form.value.phone_number,
      subject: this.form.value.subject,
      message: this.form.value.message,
      email: this.form.value.email,
    };
    // console.log(model)
    this.httpService.customerPortalPost(`api/v1/auth/customerEnquirer`, model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.hideLeaveCommentForm();
          // this.loadData()
          Swal.fire('Customer Enquire Successfully',
            'success').then(r => console.log(r))
        } else {
          this.hideLeaveCommentForm();
          Swal.fire('Customer Enquire  Failed, Try Again',
            'error').then(r => console.log(r))
            this.isLoading = false;
        }
      },
      (error: any) => {
        this.hideLeaveCommentForm();
        Swal.fire('Customer Enquire error',
          'error')
          this.isLoading = false;
      }
    );
  }

  openModal(modalContent: any) {
    this.modalRef = this.modal.open(modalContent, { centered: true, size: "md" });
  }

  // public closeModal(): void {
  //   this.activeModal.dismiss('Cross click');
  // }


  /**
   * Only for RTL (feel free to remove if you are using LTR)
   */
  addRtlOptions() {
    // Revenue chart
    this.revenueChartOptions.yaxis.labels.offsetX = -25;
    this.revenueChartOptions.yaxis.title.offsetX = -75;

    //  Monthly sales chart
    this.monthlySalesChartOptions.yaxis.labels.offsetX = -10;
    this.monthlySalesChartOptions.yaxis.title.offsetX = -70;
  }
}


/**
 * Customerse chart options
 */
function getCustomerseChartOptions(obj: any) {
  return {
    series: [{
      name: '',
      data: [3844, 3855, 3841, 3867, 3822, 3843, 3821, 3841, 3856, 3827, 3843]
    }],
    chart: {
      type: "line",
      height: 60,
      sparkline: {
        enabled: !0
      }
    },
    colors: [obj.primary],
    xaxis: {
      type: 'datetime',
      categories: ["Jan 01 2022", "Jan 02 2022", "Jan 03 2022", "Jan 04 2022", "Jan 05 2022", "Jan 06 2022", "Jan 07 2022", "Jan 08 2022", "Jan 09 2022", "Jan 10 2022", "Jan 11 2022",],
    },
    stroke: {
      width: 2,
      curve: "smooth"
    },
    markers: {
      size: 0
    },
  }
};


/**
 * Orders chart options
 */
function getOrdersChartOptions(obj: any) {
  return {
    series: [{
      name: '',
      data: [36, 77, 52, 90, 74, 35, 55, 23, 47, 10, 63]
    }],
    chart: {
      type: "bar",
      height: 60,
      sparkline: {
        enabled: !0
      }
    },
    colors: [obj.primary],
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: "60%"
      }
    },
    xaxis: {
      type: 'datetime',
      categories: ["Jan 01 2022", "Jan 02 2022", "Jan 03 2022", "Jan 04 2022", "Jan 05 2022", "Jan 06 2022", "Jan 07 2022", "Jan 08 2022", "Jan 09 2022", "Jan 10 2022", "Jan 11 2022",],
    }
  }
};



/**
 * Growth chart options
 */
function getGrowthChartOptions(obj: any) {
  return {
    series: [{
      name: '',
      data: [41, 45, 44, 46, 52, 54, 43, 74, 82, 82, 89]
    }],
    chart: {
      type: "line",
      height: 60,
      sparkline: {
        enabled: !0
      }
    },
    colors: [obj.primary],
    xaxis: {
      type: 'datetime',
      categories: ["Jan 01 2022", "Jan 02 2022", "Jan 03 2022", "Jan 04 2022", "Jan 05 2022", "Jan 06 2022", "Jan 07 2022", "Jan 08 2022", "Jan 09 2022", "Jan 10 2022", "Jan 11 2022",],
    },
    stroke: {
      width: 2,
      curve: "smooth"
    },
    markers: {
      size: 0
    },
  }
};



/**
 * Revenue chart options
 */
function getRevenueChartOptions(obj: any) {
  return {
    series: [{
      name: "Revenue",
      data: [
        49.3,
        48.7,
        50.6,
        53.3,
        54.7,
        53.8,
        54.6,
        56.7,
        56.9,
        56.1,
        56.5,
        60.3,
        58.7,
        61.4,
        61.1,
        58.5,
        54.7,
        52.0,
        51.0,
        47.4,
        48.5,
        48.9,
        53.5,
        50.2,
        46.2,
        48.6,
        51.7,
        51.3,
        50.2,
        54.6,
        52.4,
        53.0,
        57.0,
        52.9,
        48.7,
        52.6,
        53.5,
        58.5,
        55.1,
        58.0,
        61.3,
        57.7,
        60.2,
        61.0,
        57.7,
        56.8,
        58.9,
        62.4,
        58.7,
        58.4,
        56.7,
        52.7,
        52.3,
        50.5,
        55.4,
        50.4,
        52.4,
        48.7,
        47.4,
        43.3,
        38.9,
        34.7,
        31.0,
        32.6,
        36.8,
        35.8,
        32.7,
        33.2,
        30.8,
        28.6,
        28.4,
        27.7,
        27.7,
        25.9,
        24.3,
        21.9,
        22.0,
        23.5,
        27.3,
        30.2,
        27.2,
        29.9,
        25.1,
        23.0,
        23.7,
        23.4,
        27.9,
        23.2,
        23.9,
        19.2,
        15.1,
        15.0,
        11.0,
        9.20,
        7.47,
        11.6,
        15.7,
        13.9,
        12.5,
        13.5,
        15.0,
        13.9,
        13.2,
        18.1,
        20.6,
        21.0,
        25.3,
        25.3,
        20.9,
        18.7,
        15.3,
        14.5,
        17.9,
        15.9,
        16.3,
        14.1,
        12.1,
        14.8,
        17.2,
        17.7,
        14.0,
        18.6,
        18.4,
        22.6,
        25.0,
        28.1,
        28.0,
        24.1,
        24.2,
        28.2,
        26.2,
        29.3,
        26.0,
        23.9,
        28.8,
        25.1,
        21.7,
        23.0,
        20.7,
        29.7,
        30.2,
        32.5,
        31.4,
        33.6,
        30.0,
        34.2,
        36.9,
        35.5,
        34.7,
        36.9
      ]
    }],
    chart: {
      type: "line",
      height: '400',
      parentHeightOffset: 0,
      foreColor: obj.bodyColor,
      background: obj.cardBg,
      toolbar: {
        show: false
      },
    },
    colors: [obj.primary, obj.danger, obj.warning],
    grid: {
      padding: {
        bottom: -4,
      },
      borderColor: obj.gridBorder,
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      type: "datetime",
      categories: [
        "Jan 01 2022", "Jan 02 2022", "jan 03 2022", "Jan 04 2022", "Jan 05 2022", "Jan 06 2022", "Jan 07 2022", "Jan 08 2022", "Jan 09 2022", "Jan 10 2022", "Jan 11 2022", "Jan 12 2022", "Jan 13 2022", "Jan 14 2022", "Jan 15 2022", "Jan 16 2022", "Jan 17 2022", "Jan 18 2022", "Jan 19 2022", "Jan 20 2022", "Jan 21 2022", "Jan 22 2022", "Jan 23 2022", "Jan 24 2022", "Jan 25 2022", "Jan 26 2022", "Jan 27 2022", "Jan 28 2022", "Jan 29 2022", "Jan 30 2022", "Jan 31 2022",
        "Feb 01 2022", "Feb 02 2022", "Feb 03 2022", "Feb 04 2022", "Feb 05 2022", "Feb 06 2022", "Feb 07 2022", "Feb 08 2022", "Feb 09 2022", "Feb 10 2022", "Feb 11 2022", "Feb 12 2022", "Feb 13 2022", "Feb 14 2022", "Feb 15 2022", "Feb 16 2022", "Feb 17 2022", "Feb 18 2022", "Feb 19 2022", "Feb 20 2022", "Feb 21 2022", "Feb 22 2022", "Feb 23 2022", "Feb 24 2022", "Feb 25 2022", "Feb 26 2022", "Feb 27 2022", "Feb 28 2022",
        "Mar 01 2022", "Mar 02 2022", "Mar 03 2022", "Mar 04 2022", "Mar 05 2022", "Mar 06 2022", "Mar 07 2022", "Mar 08 2022", "Mar 09 2022", "Mar 10 2022", "Mar 11 2022", "Mar 12 2022", "Mar 13 2022", "Mar 14 2022", "Mar 15 2022", "Mar 16 2022", "Mar 17 2022", "Mar 18 2022", "Mar 19 2022", "Mar 20 2022", "Mar 21 2022", "Mar 22 2022", "Mar 23 2022", "Mar 24 2022", "Mar 25 2022", "Mar 26 2022", "Mar 27 2022", "Mar 28 2022", "Mar 29 2022", "Mar 30 2022", "Mar 31 2022",
        "Apr 01 2022", "Apr 02 2022", "Apr 03 2022", "Apr 04 2022", "Apr 05 2022", "Apr 06 2022", "Apr 07 2022", "Apr 08 2022", "Apr 09 2022", "Apr 10 2022", "Apr 11 2022", "Apr 12 2022", "Apr 13 2022", "Apr 14 2022", "Apr 15 2022", "Apr 16 2022", "Apr 17 2022", "Apr 18 2022", "Apr 19 2022", "Apr 20 2022", "Apr 21 2022", "Apr 22 2022", "Apr 23 2022", "Apr 24 2022", "Apr 25 2022", "Apr 26 2022", "Apr 27 2022", "Apr 28 2022", "Apr 29 2022", "Apr 30 2022",
        "May 01 2022", "May 02 2022", "May 03 2022", "May 04 2022", "May 05 2022", "May 06 2022", "May 07 2022", "May 08 2022", "May 09 2022", "May 10 2022", "May 11 2022", "May 12 2022", "May 13 2022", "May 14 2022", "May 15 2022", "May 16 2022", "May 17 2022", "May 18 2022", "May 19 2022", "May 20 2022", "May 21 2022", "May 22 2022", "May 23 2022", "May 24 2022", "May 25 2022", "May 26 2022", "May 27 2022", "May 28 2022", "May 29 2022", "May 30 2022",
      ],
      lines: {
        show: true
      },
      axisBorder: {
        color: obj.gridBorder,
      },
      axisTicks: {
        color: obj.gridBorder,
      },
      crosshairs: {
        stroke: {
          color: obj.secondary,
        },
      },
    },
    yaxis: {
      title: {
        text: 'Revenue ( $1000 x )',
        style: {
          size: 9,
          color: obj.muted
        }
      },
      tickAmount: 4,
      tooltip: {
        enabled: true
      },
      crosshairs: {
        stroke: {
          color: obj.secondary,
        },
      },
      labels: {
        offsetX: 0,
      },
    },
    markers: {
      size: 0,
    },
    stroke: {
      width: 2,
      curve: "straight",
    },
  }
};



/**
 * Monthly sales chart options
 */
function getMonthlySalesChartOptions(obj: any) {
  return {
    series: [{
      name: 'Sales',
      data: [152, 109, 93, 113, 126, 161, 188, 143, 102, 113, 116, 124]
    }],
    chart: {
      type: 'bar',
      height: '318',
      parentHeightOffset: 0,
      foreColor: obj.bodyColor,
      background: obj.cardBg,
      toolbar: {
        show: false
      },
    },
    colors: [obj.primary],
    fill: {
      opacity: .9
    },
    grid: {
      padding: {
        bottom: -4
      },
      borderColor: obj.gridBorder,
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      type: 'datetime',
      categories: ['01/01/2022', '02/01/2022', '03/01/2022', '04/01/2022', '05/01/2022', '06/01/2022', '07/01/2022', '08/01/2022', '09/01/2022', '10/01/2022', '11/01/2022', '12/01/2022'],
      axisBorder: {
        color: obj.gridBorder,
      },
      axisTicks: {
        color: obj.gridBorder,
      },
    },
    yaxis: {
      title: {
        text: 'Number of Sales',
        style: {
          size: 9,
          color: obj.muted
        }
      },
      labels: {
        offsetX: 0,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: 'center',
      fontFamily: obj.fontFamily,
      itemMargin: {
        horizontal: 8,
        vertical: 0
      },
    },
    stroke: {
      width: 0
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '10px',
        fontFamily: obj.fontFamily,
      },
      offsetY: -27
    },
    plotOptions: {
      bar: {
        columnWidth: "50%",
        borderRadius: 4,
        dataLabels: {
          position: 'top',
          orientation: 'vertical',
        }
      },
    }
  }
}



/**
 * Cloud storage chart options
 */
function getCloudStorageChartOptions(obj: any) {
  return {
    series: [67],
    chart: {
      height: 260,
      type: "radialBar"
    },
    colors: [obj.primary],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 15,
          size: "70%"
        },
        track: {
          show: true,
          background: obj.light,
          strokeWidth: '100%',
          opacity: 1,
          margin: 5,
        },
        dataLabels: {
          showOn: "always",
          name: {
            offsetY: -11,
            show: true,
            color: obj.muted,
            fontSize: "13px"
          },
          value: {
            color: obj.bodyColor,
            fontSize: "30px",
            show: true
          }
        }
      }
    },
    fill: {
      opacity: 1
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Storage Used"]
  }
};
