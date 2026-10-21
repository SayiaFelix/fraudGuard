
import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ColumnMode, DatatableComponent} from '@swimlane/ngx-datatable';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
// import {AddProductSubItemComponent} from "../add-product-subitem/add-product-sub-item.component";
import Swal from "sweetalert2";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";

interface Customer {
  id: number;
  name: string;
  email: string;
  investment: string;
  balance: number;
}

@Component({
  selector: 'app-view-requests',
  templateUrl: './view-requests.component.html',
  styleUrls: ['./view-requests.component.scss']
})
export class ViewRequestsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;

  tempProductData = [
    {
      id: 1,
      name: 'Personal Accident',
      shortDescription: 'Summary',
      productDescription: 'Summary',
      status: true,
      createdOn: '12-02-2023',
    },
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loadingIndicator = true;
  reorderable = true;

  actions = ["View", "Edit", "Delete"];

  public productCategoryId: any;

  columns = [
    {name: 'ID', prop: 'id'},
    {name: 'ProductName', prop: 'name'},
    {name: 'Description', prop: 'shortDescription'},
    {name: 'Status', prop: 'status'},
    {name: 'CreatedOn', prop: 'createdOn'},
    {name: 'Actions', prop: 'id'},
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Products";

  loading = true;

  investorId: string;
  customer: any = null;
  customerData: Customer | null = null;
  portfolio: any;
  marketTrends: any[];
  riskScore: number;
  riskMessage: string;
  recommendations: string;
  simulatedInvestment: number;
  simulatedReturn: number;

  investorList: any[] = [];  // Add this line to define investorList
  investor: any = null;      // To store the filtered investor


  page = 1
  page_size =10;

  mockCustomers: Customer[] = [
    { id: 1, name: "John Doe", email: "john@example.com", investment: "Real Estate", balance: 50000 },
    { id: 2, name: "Jane Smith", email: "jane@example.com", investment: "Money Market", balance: 30000 },
    { id: 3, name: "David Johnson", email: "david@example.com", investment: "Private Equity", balance: 80000 }
  ];



  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService,
    private activatedRoute: ActivatedRoute,
  ) {
  }

  ngOnInit() {
    this.loadCytonData(this.page, this.page_size, this.investorId);
  
    this.route.paramMap.subscribe(params => {
      const investorId = params.get('id'); // Extract the investor ID from route params
    


      if (investorId) {
        this.loadCytonData(this.page, this.page_size, investorId); 
        console.log('Investor ID' ,investorId)// Fetch data first
      } else {
        console.error("Investor ID is missing in route parameters");
      }
    });


        // Mock Portfolio Data
        this.portfolio = {
          total: 2500000,
          roi: 9.5,
          assets: [
            { name: 'Safaricom Shares', value: 750000 },
            { name: 'Government Bonds', value: 500000 },
            { name: 'Real Estate Fund', value: 650000 },
            { name: 'Private Equity', value: 600000 }
          ]
        };
    
        // Mock AI Investment Recommendations
        this.recommendations = "Based on your risk profile, consider diversifying into emerging market ETFs and high-yield corporate bonds.";
    
        // Mock Market Trends Data
        this.marketTrends = [
          { asset: 'NSE 20 Index', change: 2.1 },
          { asset: 'Kenya REITs', change: 1.3 },
          { asset: 'Treasury Bonds', change: -0.5 },
          { asset: 'Foreign Stocks', change: 3.8 }
        ];
    
        // Mock Risk Score
        this.riskScore = 55;
        this.riskMessage = this.riskScore > 70 ? 
          "You have a high-risk portfolio. Consider balancing with lower-risk assets." : 
          "Your portfolio has a balanced risk profile.";
        }
    
      getRiskClass(risk: string) {
        switch (risk) {
          case "Low": return "badge bg-success";
          case "Moderate": return "badge bg-warning";
          case "High": return "badge bg-danger";
          default: return "badge bg-secondary";
        }
      }
    
    

      // Investment Simulator (What-If Analysis)
      simulateReturns() {
        if (this.simulatedInvestment) {
          this.simulatedReturn = this.simulatedInvestment * (this.portfolio.roi / 100);
        }

    this.breadCrumbItems = [
      {
        label: 'Mobile banking',
        path: '/mobile-banking/products/all-products',
      },
      {label: 'Pages', path: '/'},
      {label: 'Products', active: true},
    ];

    this.getIndividualData(0);

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
    });
  }

  getIndividualData(event: number): void {


    this.loading = true;

    const model = {
      size: 50,
      page: 0,
      id: this.productCategoryId
    };

    this.httpService
      .mobileBankingPost('product/portal/fetch/all', model)
      .subscribe(
        (res: any) => {
          if (res.status === 200) {
            let response = res['data'];
            this.loading = false;

            this.rows = response.map((item: any, index: any) => {
              const res = {...item, frontendId: index + 1};
              return res;
            });
          } else {
            Swal.fire('Failed', "Unable to fetch products", 'error')
          }
        }, (error: any) => {
          Swal.fire("Error", error.message, "error");
        });
  }

  openEditProductModal(formData: any) {
    // this.modalRef = this.modalService.open(AddProductSubItemComponent, {centered: true,size:"md"});
    this.modalRef.componentInstance.title = 'Edit Product';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.productCategoryId = this.productCategoryId;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openAddProductModal() {

    // this.modalRef = this.modalService.open(AddProductSubItemComponent,
      // {centered: true,size:"md"});
    this.modalRef.componentInstance.title = 'Add Product';
    this.modalRef.componentInstance.productCategoryId = this.productCategoryId;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }
 
  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  navigateToViewProduct(data: any) {
    this.router.navigate([`/mobile-banking/products/product/${this.productCategoryId}/${data.id}`]);
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
  

  loadCytonData(page: number, page_size: number, investorId: string) {
    this.httpService.getCytonData(page, page_size).subscribe(
      (response) => {
        if (response.status === "00") {
          const allInvestors = response.data.map((item: any) => ({
            investorID: item["Investor ID"],
            name: item["Investor Name"] || "Unknown",
            incomeLevel: item["Income Level"],
            investmentType: item["Investment Type"],
            amountInvested: item["Amount Invested (KES)"],
            investmentExperience: item["Investment Experience (Years)"],
            riskScore: item["Risk Score"] ? Number(parseFloat(item["Risk Score"]).toFixed(2)) : 0,
            riskCategory: item["Risk Category"],
          }));
  
          console.log("The Investment Data:", allInvestors);
          this.investor = allInvestors.find((c: { investorID: string }) => c.investorID === investorId) || null;
          
          console.log("Filtered Investor", this.investor);
        } else {
          console.error("Failed to load investment data:", response.message);
        }
      },
      (error) => {
        console.error("Error fetching investment data:", error);
      }
    );
  }


  


  exportCSV() {
    let cols: string[] = this.columns.map(item => {
      if (item['name'].toLowerCase() !== 'actions') {
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[] = []

    this.rows.forEach((row: any) => {
      let temp: Record<string, string> = {}
      cols.forEach(key => {
        temp = {...temp, [key]: row[key]}
      })
      arr.push(temp)
    })
    this.dataExploration.exportToCsv(arr, 'Products')
  }

  exportXLSX() {
    let cols: string[] = this.columns.map(item => {
      if (item['name'].toLowerCase() !== 'actions') {
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[] = []

    this.rows.forEach((row: any) => {
      let temp: Record<string, string> = {}
      cols.forEach(key => {
        temp = {...temp, [key]: row[key]}
      })
      arr.push(temp)
    })

    this.dataExploration.exportDataXlsx(arr, 'Products')
  }

  exportPDF() {
    console.log(this.rows);
    let cols: string[] = this.columns.map(item => {
      if (item['name'].toLowerCase() !== 'actions') {
        return item['name'].toUpperCase()
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let rowKeys: string[] = Object.keys(this.rows[0]);
    let arr: string[][] = []
    this.rows.forEach((row: any) => {
      let temp: string[] = []
      rowKeys.forEach(key => {
        temp.push(row[key])
      })
      arr.push(temp)
    })
    this.dataExploration.exportToPdf(cols, arr, 'Products')
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this.navigateToViewProduct(eventData.row);
    } else if (eventData.action == 'Edit') {
      this.openEditProductModal(eventData.row);
    } else if (eventData.action == 'Delete') {
      this.openDeleteModal(eventData.row);
    }
  }

  openDeleteModal(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = `Delete this Product?`;
    this.modalRef.componentInstance.body = `Do you want to delete product: ${formData.name}?`;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {

        let model = {
          id: formData.id
        }

        this.httpService.mobileBankingPost('product/portal/delete',
          model).subscribe(
          (result: any) => {
            if (result.status === 200) {
              Swal.fire('Product Deleted',
                'Product has been deleted successfully.',
                'success').then(r => console.log(r))
                this.getIndividualData(0);
            } else {
              Swal.fire('Record deletion error',
                'Product could not be deleted.',
                'error').then(r => console.log(r))
            }
          },
          (error: any) => {
            Swal.fire('Record deletion error',
              `Record deletion error`,
              'error')
          }
        );
      }
    });
  }


}

