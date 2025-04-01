import {Component, OnInit, ViewChild,} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { APP_BASE_HREF, DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import { CustomValidators } from 'ngx-custom-validators';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Inject } from '@angular/core';
import { APP_BASE_HREF_TOKEN } from '../constants';
import { ActivatedRoute } from '@angular/router';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Update the Investor interface
export interface InvestmentDetail {
  amountInvested: number;
  investmentType: string;
  riskCategory: string;
  riskScore: number;
}

export interface Investor {


  investorID: number; // 
  name: string;
  incomeLevel: string; 
  investmentType: string; 
  amountInvested: number; 
  investmentExperience: number;
  riskScore: number;
  riskCategory: string; 
  anomalyFlag: string; 
  investmentRecommendation: string;
  recommendedInvestments: string[]; 
  cluster: number; 
  clusterDescription: string; 
  roi: number;
  totalInvestments: number; 
  investments: InvestmentDetail[];
}






@Component({
  selector: 'app-list-requests',
  templateUrl: './list-requests.component.html',
  styleUrls: ['./list-requests.component.scss'],
  providers: [DatePipe],
})

export class ListRequestsComponent implements OnInit {
  public form: FormGroup;
  errorMsg: string;
  defaultProfileImage: SafeResourceUrl = "assets/images/no_I.png";
  defaultIcon: SafeResourceUrl = "assets/images/icon.png";
  existingImage: SafeResourceUrl;
  hasError: boolean = false;
  isLoading: boolean = false;
  errorMessage: string;
  modalRef: NgbModalRef;
  loading:boolean;
  showLeaveCommentForm: boolean = false;
  perPage = 100;

  

  standards: any = [
  ]
  dashboards: { id: string; src: string }[] = [
      // Processed Transactions
      {
        id: 'dashboard1',
        src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet1',
      },
      {
        id: 'dashboard2',
        src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet2',
      },
      {
        id: 'dashboard3',
        src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet3',
      },
      {
        id: 'dashboard4',
        src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet4',
      },
      {
        id: 'dashboard5',
        src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet5',
      },
      {
        id: 'dashboard6',
        src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet6',
      },
  ];
  
  paginatedDashboards: { id: string; src: string }[] = [];
  currentPage = 0;
  itemsPerPage = 4;
  recordsPerPage = 10;
  page = 2
  page_size =15;
  
// Original full data list
  filteredInvestorsList: any[] = [];

  marketTrends: any[];
  riskScore: number;
  riskMessage: string;
  recommendations: string;
  selectedTimeline: number | null = null;


  investorID: string = '';
  customer: any = null;
  investor: Investor[] = [];  
  kpis: any = {};
  images: any = {};


simulatedInvestment: number = 0; // User input
simulatedReturn: number = 0; // Calculated value
portfolio = { roi: 10 }; //


  searchQuery: string = "";
  sortField: keyof Investor = "name";
  sortDirection: "asc" | "desc" = "asc";
 
 
   // Filters
   selectedRisk: string = "";
   selectedInvestment: string = "";
   selectedIncomeLevel: string = "";
   confidenceScore: number = 0; // Confidence level of the prediction
   isProcessing: boolean = false; 

   riskProfiles: string[] = ["Low", "Medium", "High"];
   investmentTypes: string[] = ["Real Estate", "Money Market Fund", "Private Equity", "Stocks","Bonds"];
   pageSize: number = 10; // Default records per page
   isValidInvestorID: boolean = false;
  //  incomeLevels: string[] = ["Low Income", "Middle Income", "High Income"];


   investmentInsights = [
    { investment: "Real Estate", recommendation: "High potential in rental income markets." },
    { investment: "Money Market", recommendation: "Stable and liquid investment for short-term gains." },
    { investment: "Private Equity", recommendation: "Higher risk but promising long-term ROI." }
  ];

  marketUpdates: { name: string; price: string; change: string }[] = [];
  constructor(private router: Router,
    @Inject(APP_BASE_HREF_TOKEN) private appBaseHref: string,
    fb: FormBuilder,
    public modal: NgbModal,
    private httpService: HttpService,
    private sanitizer: DomSanitizer,
    public activeModal: NgbActiveModal,) {
      this.form = fb.group({
        name: ["", Validators.compose([Validators.required])],
        email: ['',Validators.compose([Validators.required, CustomValidators.email])],
        subject: ['',Validators.compose([Validators.required])],
        message: ["", Validators.compose([Validators.required])],
        phone_number: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
      });
    }

  ngOnInit(): void {
    this.loadData()
    this.loadCytonData(this.page, this.page_size)
    this.updatePagination()
    this.fetchMarketUpdates();
    this.loadDashboardData()
  
      // Mock AI Investment Recommendations
      this.recommendations = "Based on your risk profile, consider diversifying into emerging market ETFs and high-yield corporate bonds.";
  
 
  
      // Mock Risk Score
      this.riskScore = 55;
      this.riskMessage = this.riskScore > 70 ? 
        "You have a high-risk portfolio. Consider balancing with lower-risk assets." : 
        "Your portfolio has a balanced risk profile.";
      }

    getRiskClass(risk: string) {
      switch (risk) {
        case "Low":
        case "Low Risk":
          return "badge bg-danger";
        case "Medium":
        case "Moderate":
          return "badge bg-warning";
        case "High":
          return "badge bg-success";
        default:
          return "badge bg-secondary";
      }
    }

    
    getClusterClass(cluster: number): string {
      switch (cluster) {
        case 0:
          return 'badge bg-warning text-dark'; 
        case 1:
          return 'badge bg-danger text-light';
        case 2:
          return 'badge bg-success text-light'; 
        default:
          return 'badge bg-secondary text-light'; 
      }
    }
    
    
    get totalPages() {
      return Math.ceil(this.investor.length / this.recordsPerPage);
    }
  
    paginatedInvestors() {
      const startIndex = (this.currentPage - 1) * this.recordsPerPage;
      return this.investor.slice(startIndex, startIndex + this.recordsPerPage);
    }
  
  
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    }
  
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    }

    
    filteredInvestors(): Investor[] {
      console.log("Raw investor data:", this.investor); // Debugging
    
      if (!Array.isArray(this.investor)) {
        console.error("Error: this.investor is not an array!", this.investor);
        return [];
      }
    
      return this.investor
        .filter(investor => {
          const matchesSearchQuery =
            this.searchQuery === "" ||
            String(investor.investorID).toLowerCase().includes(this.searchQuery.toLowerCase());
    
          const matchesInvestmentType =
            this.selectedInvestment === "" || investor.investmentType === this.selectedInvestment;
    
          const matchesRiskProfile =
            this.selectedRisk === "" || investor.riskCategory === this.selectedRisk;
    
          return matchesSearchQuery && matchesInvestmentType && matchesRiskProfile;
        })
        .sort((a, b) => {
          if (!this.sortField) return 0;
          if (this.sortDirection === "asc") {
            return a[this.sortField] > b[this.sortField] ? 1 : -1;
          } else {
            return a[this.sortField] < b[this.sortField] ? 1 : -1;
          }
        });
    }
    
    
    
    sortBy(field: keyof Investor) {
      if (this.sortField === field) {
        this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
      } else {
        this.sortField = field;
        this.sortDirection = "asc";
      }
    }

    loadCytonData(page: number, page_size: number) {
      this.httpService.getCytonData(page, page_size).subscribe(
        (response) => {
          if (response.status === "00") {
            this.investor = response.data.map((item: any) => {
              // Determine cluster-based investment behavior
              let clusterDescription = "";
              switch (item["Cluster"]) {
                case 0:
                  clusterDescription = "Lowest investors, moderate risk appetite, prefer Real Estate";
                  break;
                case 1:
                  clusterDescription = "Highest investors, high risk appetite, prefer Private Equity & Money Market Fund";
                  break;
                case 2:
                  clusterDescription = "Moderate investors, lowest risk appetite, prefer Stocks";
                  break;
                default:
                  clusterDescription = "Unknown Cluster";
              }
    
              // Default values
              let adjustedRiskScore = 50;
              let maxInvestments = 2;
              let minInvestmentAmount = 10000;
              let maxInvestmentAmount = 50000;
              let minROI = 3;
              let maxROI = 8;
    
              if (item["Risk Category"] === "High") {
                adjustedRiskScore = Math.random() * (40 - 5) + 5; // Risk Score: 5 - 40
                maxInvestments = Math.floor(Math.random() * (5 - 3) + 3); // 3 to 5 investments
                minInvestmentAmount = 200000;
                maxInvestmentAmount = 1000000;
                minROI = 12;
                maxROI = 25;
              } else if (item["Risk Category"] === "Moderate") {
                adjustedRiskScore = Math.random() * (70 - 40) + 40; // Risk Score: 40 - 70
                maxInvestments = Math.floor(Math.random() * (3 - 2) + 2); // 2 to 3 investments
                minInvestmentAmount = 50000;
                maxInvestmentAmount = 200000;
                minROI = 8;
                maxROI = 15;
              } else if (item["Risk Category"] === "Low") {
                adjustedRiskScore = Math.random() * (100 - 70) + 70; // Risk Score: 70 - 100
                maxInvestments = 2; // Max 2 investments
                minInvestmentAmount = 10000;
                maxInvestmentAmount = 50000;
                minROI = 3;
                maxROI = 8;
              }
    
              // Ensure investments don't exceed the max limit
              let investmentList = Array.isArray(item["investments"]) 
                ? item["investments"].slice(0, maxInvestments) 
                : [];
    
              // Assign realistic investment amounts
              let investmentAmount = Math.floor(
                Math.random() * (maxInvestmentAmount - minInvestmentAmount) + minInvestmentAmount
              );
    
              // Assign realistic ROI %
              let roiPercentage = Math.random() * (maxROI - minROI) + minROI;
    
              return {
                investorID: item["Investor ID"],
                name: item["Investor Name"] || "Unknown",
                incomeLevel: item["Income Level"],
                investmentType: item["Investment Type"],
                amountInvested: investmentAmount, 
                investmentExperience: item["Investment Experience (Years)"],
                riskScore: Number(adjustedRiskScore.toFixed(2)), 
                riskCategory: item["Risk Category"],
                roi: Number(roiPercentage.toFixed(2)), 
                anomalyFlag: item["Anomaly Flag"] || "Normal",
                investmentRecommendation: item["Investment Recommendation"] || "No Recommendation",
                recommendedInvestments: item["Recommended Investments"], 
                cluster: item["Cluster"],
                clusterDescription: clusterDescription,
                roiPercentage: Number(roiPercentage.toFixed(2)), 
                totalInvestments: investmentList.length, 
                investments: investmentList 
              };
            });
    
            console.log("Investment Data:", this.investor);
            this.updatePagination();
          } else {
            console.error("Failed to load investment data:", response.message);
          }
        },
        (error) => {
          console.error("Error fetching investment data:", error);
        }
      );
    }
    
    

  
getAnomalyClass(anomalyFlag: string): string {
  return anomalyFlag === "Anomalous" ? "text-danger fw-bold" : "text-success";
}

    
updatePagination() {
      const startIndex = (this.currentPage - 1) * this.recordsPerPage;
      const endIndex = startIndex + this.recordsPerPage;
      this.filteredInvestorsList = this.investor.slice(startIndex, endIndex);
    }
    
    changePage(page: number) {
      this.currentPage = page;
      this.updatePagination();
    }

    loadDashboardData() {
      this.httpService.getDashboardData().subscribe(
        (response) => {
          if (response.status === "00") {
            this.kpis = response.data;
  
            // Update image URLs
            const baseUrl = "http://130.61.111.65:5005";
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
          console.error("Error fetching KPIs:", error);
        }
      );
    }
  
    viewCustomerDetails(customerId: number) {
      this.router.navigate([`/cyton/analytics/customer-details/${customerId}`]);
      console.log(customerId);
    }

    // exportToExcel() {
    //   const worksheet = XLSX.utils.json_to_sheet(this.investor);
    //   const workbook = XLSX.utils.book_new();
    //   XLSX.utils.book_append_sheet(workbook, worksheet, "Investor");
    //   XLSX.writeFile(workbook, "Investors.xlsx");
    // }
  

    exportToExcel() {
      if (!this.investor || this.investor.length === 0) {
        console.warn('No data available to export!');
        return;
      }
    
      // Define headers including the new column for ROI
      const headers = [
        ["Investor ID", "Income Level", "Investment Type", "Amount Invested (KES)", "Risk Score", "Investor Profile", "Anomaly Flag", "ROI (%)", "Investment Recommendation", "Recommended Investments"]
      ];
    
      // Convert data into array format
      const data = this.investor.map(investor => [
        investor.investorID,
        investor.incomeLevel,
        investor.investmentType,
        `KES ${investor.amountInvested.toLocaleString()}`, // Format amount
        investor.riskScore,
        investor.riskCategory,
        investor.anomalyFlag, // Anomaly Flag
        `${investor.roi.toFixed(2)}%`, // ROI formatted to 2 decimal places
        // investor.investmentRecommendation, // Investment Recommendation
        investor.recommendedInvestments 
      ]);
    
      // Create worksheet with headers and data
      const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...data]);
    
      // Auto-adjust column width
      const columnWidths = headers[0].map(header => ({ wch: header.length + 5 }));
      worksheet['!cols'] = columnWidths;
    
      // Create workbook and append sheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Investor");
    
      // Export as file
      XLSX.writeFile(workbook, "Investor_Data.xlsx");
    }
    
    exportToPDF() {
      const doc = new jsPDF();
    
      // Get current date and time
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
    
      // Set PDF Title (Centered)
      doc.setFontSize(18);
      const pageWidth = doc.internal.pageSize.getWidth();
      doc.text("Investor Portfolio Report", pageWidth / 2, 20, { align: "center" });
    
      // Add Date and Time (Centered)
      doc.setFontSize(12);
      doc.text(`Date: ${dateStr} | Time: ${timeStr}`, pageWidth / 2, 30, { align: "center" });
    
      // Add Table Data (Starts below date and time)
      autoTable(doc, {
        startY: 40,
        head: [['Investor ID', 'Income Level', 'Investment Type', 'Amount Invested (KES)', 'Risk Score', 'Investor Profile', 'Anomaly Flag', 'ROI (%)', 'Investment Recommendation',]],
        body: this.investor.map((investor: Investor) => [
          investor.investorID,
          investor.incomeLevel,
          investor.investmentType,
          `KES ${investor.amountInvested.toLocaleString()}`, // Format amount
          investor.riskScore,
          investor.riskCategory,
          investor.anomalyFlag, // Anomaly Flag
          `${investor.roi.toFixed(2)}%`, // ROI formatted
          // investor.investmentRecommendation, // Investment Recommendation
          investor.recommendedInvestments 
        ]),
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          3: { halign: 'right' }, // Amount Right Align
          4: { halign: 'center' }, // Risk Score Center Align
          7: { halign: 'center' }, // ROI Center Align
        }
      });
    
      // Save as PDF
      doc.save(`Investor_Portfolio_Report_${dateStr.replace(/\//g, '-')}.pdf`);
    }
    



  
    fetchMarketUpdates() {
      setTimeout(() => {
        this.marketUpdates = [
          { name: "S&P 500", price: "4,500", change: "+1.2%" },
          { name: "Dow Jones", price: "34,600", change: "-0.8%" },
          { name: "Nasdaq", price: "14,500", change: "+2.1%" }
        ];
      }, 2000);
    }

    validateInvestorID(): void {
      const investorIdPattern = /^INV\d+$/; // Matches "INV" followed by any number of digits
      this.isValidInvestorID = investorIdPattern.test(this.investorID); // Set validity based on the regex match
    }
  
    // Call this method whenever the investor ID input changes
    onInvestorIDChange(value: string): void {
      this.investorID = value;
      this.validateInvestorID(); // Revalidate on every change
    }
  
    // Simulate the return based on the inputs
    simulateReturns() {
      // If any required input is invalid, stop processing
      if (!this.isValidInvestorID || this.simulatedInvestment <= 0 || !this.selectedTimeline) {
        this.simulatedReturn = 0;
        this.confidenceScore = 0;
        return;
      }
  
      // Simulated "AI Processing" delay
      this.isProcessing = true;
  
      setTimeout(() => {
        const dynamicFactor = 1 + (Math.random() * 0.1 - 0.05); // ±5% variation
        const baseReturn = this.simulatedInvestment * (this.portfolio.roi / 100);
        const timelineMultiplier = (this.selectedTimeline ?? 12) / 12; // Ensure it's never null
  
        this.simulatedReturn = Math.round(baseReturn * dynamicFactor * timelineMultiplier);
        this.confidenceScore = Math.floor(80 + Math.random() * 20); // 80-99% confidence
  
        this.isProcessing = false;
      }, 2000);
    }

    
    // simulateReturns() {
    //   if (!this.simulatedInvestment || this.simulatedInvestment <= 0 || !this.selectedTimeline || !this.investorID) {
    //     this.simulatedReturn = 0;
    //     this.confidenceScore = 0;
    //     return;
    //   }
    
    //   // Simulated "AI Processing" delay
    //   this.isProcessing = true;
    
    //   setTimeout(() => {
    //     const dynamicFactor = 1 + (Math.random() * 0.1 - 0.05); // ±5% variation
    //     const baseReturn = this.simulatedInvestment * (this.portfolio.roi / 100);
    //     const timelineMultiplier = (this.selectedTimeline ?? 12) / 12; // Ensure it's never null
    
    //     this.simulatedReturn = Math.round(baseReturn * dynamicFactor * timelineMultiplier);
    //     this.confidenceScore = Math.floor(80 + Math.random() * 20); // 80-99% confidence
    
    //     this.isProcessing = false;
    //   }, 2000);
    // }
    

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
    }}
  phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneNumber = control.value;
    const phonePattern = /^(254\d{9}|0\d{9})$/;
    return phonePattern.test(phoneNumber) ? null : { invalidPhoneNumber: true };
  }


  toggleLeaveCommentForm() {
    if (this.showLeaveCommentForm) {
      this.hideLeaveCommentForm();
    } else {
      this.showLeaveCommentForm = true;
    }
  }
  hideLeaveCommentForm() {
    this.showLeaveCommentForm = false;
    this.form.reset()
  }
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }


  // openStandardInNewTab(standardId: number) {
  //   const baseUrl = this.appBaseHref || 'tra-customer-portal' || 'tra-customer-portal-uat';
  //   const urlTree = this.router.createUrlTree([baseUrl, 'standards', standardId]);
  //   const url = this.router.serializeUrl(urlTree);
  
  //   if (document.getElementsByTagName('base')[0].hasAttribute('href')) {
  //     const win = window.open();
  //     if (win) {
  //       win.opener = null;
  //       win.location.href = url;
  //     }
  //   } else {
  //     window.open(url, '_blank');
  //   }
  // }
  openStandardInNewTab(standardId: number) {
    const baseUrl = this.appBaseHref || 'tra-customer-portal-uat';
    const urlTree = this.router.createUrlTree([baseUrl, 'standards', standardId]);
    const url = this.router.serializeUrl(urlTree);
  
    if (document.getElementsByTagName('base')[0].hasAttribute('href')) {
      const win = window.open();
      if (win) {
        win.opener = null;
        win.location.href = url;
      }
    } else {
      window.open(url, '_blank');
    }
  }
  // openStandardInNewTab(standardId: number) {
  //   const urlTree = this.router.createUrlTree(['/standards', standardId]);
  //   const url = this.router.serializeUrl(urlTree);
  //   window.open(url, '_blank');
  // }
  // viewStandard(standardId: number) {
  //   this.router.navigate(['/standards', standardId]);
  // }
  private loadData(): any {
    this.loading = true;
    let model = {
      page: this.page - 1,
      size: this.perPage
    };
    this.httpService.customerPortalPosts(`standard/portal/getall`, model).subscribe(
      (res: any) => {
        if (res.status == 200) {
          // this.standards = res['data'];
          const standard = res.data.standards.filter((request: any) => request.status === "PUBLISHED");
          this.standards = standard
          this.standards.forEach((standard: any) => {
            // Modify preview_image_url
            if (standard.previewImageUrl) {
              const filename = standard.previewImageUrl.split('?filename=')[1];
              standard.previewImageUrl = 'https://test-api.ekenya.co.ke/tra-backend/api/v1/standard/files/download?filename=' + encodeURIComponent(filename);
              standard.existingImage = this.sanitizer.bypassSecurityTrustResourceUrl(standard.previewImageUrl);
            } else {
              standard.existingImage = this.defaultProfileImage; 
            }
  
            // Modify preview_icon_url
            if (standard.previewIconUrl) {
              const filename = standard.previewIconUrl.split('?filename=')[1];
              standard.previewIconUrl = 'https://test-api.ekenya.co.ke/tra-backend/api/v1/standard/files/download?filename=' + encodeURIComponent(filename);
              standard.existingIcon = this.sanitizer.bypassSecurityTrustResourceUrl(standard.previewIconUrl);
              standard.iconWidth = '55px'; 
              standard.iconHeight = '45px'; 
            } else {
              standard.existingIcon = this.defaultIcon;
              standard.iconWidth = '35px';
              standard.iconHeight = '30px'; 
            }
          });
  
          // console.log(this.standards);
          // console.log(this.existingImage);
          this.loading = false;
        } else {
          console.log('Failed', 'Unable to fetch standards', 'error');
        }
      },
      (error: any) => {
        console.log('Error', error.message, 'error');
      }
    );
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
          this.loadData()
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

  
  getColumnClass(numItems: number): string {
    if (numItems === 1) {
      return 'col-md-4 col-sm-6 col-lg-4 col-xl-4';
    } else {
      return 'col-md-4 col-sm-6 col-lg-3 col-xl-3';
    }
  }
  
  openModal(modalContent: any) {
    this.modalRef = this.modal.open(modalContent, {centered: true, size:"md"});
  }
  // closeModal() {
  //   this.activeModal.close();
  // }
  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }
  onRegister(e: Event) {
    e.preventDefault();
    localStorage.setItem('isLoggedin', 'true');
    if (localStorage.getItem('isLoggedin')) {
      this.router.navigate(['/']);
    }
  }

}
