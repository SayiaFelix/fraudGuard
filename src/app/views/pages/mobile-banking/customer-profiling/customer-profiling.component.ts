import {
  Component,
  OnInit
} from '@angular/core';

import {
  HttpService
} from 'src/app/shared/services/http.service';


/* =========================================================
   CUSTOMER LIST INTERFACES
========================================================= */

interface CustomerSummary {
  customer_id: string;
  full_name: string;
  customer_segment: string;
  home_city: string;
  account_status: string;
  risk_profile: string;
  branch_code: string;
  currency: string;
}


interface Pagination {
  page: number;
  size: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}


/* =========================================================
   CUSTOMER 360 INTERFACE
========================================================= */

interface Customer360 {
  customer: {
    customer_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    customer_segment: string;
    branch_code: string;
    home_city: string;
    account_status: string;
    risk_profile: string;
    currency: string;
  };

  kpis: {
    total_balance: number;
    transactions_30d: number;
    average_transaction_amount: number;
    account_count: number;
    known_devices: number;
    failed_logins: number;
  };

  transaction_summary: {
    total_transactions: number;
    preferred_channel: string;
    maximum_transaction_amount: number;
    last_transaction: string;
  };

  behavior_profile: {
    currency: string;
    average_transaction_amount: number;
    median_transaction_amount: number;

    typical_amount_range: {
      min: number;
      max: number;
    };

    average_transaction_frequency: number;

    typical_channels: string[];
    typical_locations: string[];
    typical_device_names: string[];
    typical_hours: number[];
  };

  transaction_trend: Array<{
    date: string;
    transaction_count: number;
    total_amount: number;
  }>;

  accounts: Array<{
    account_id: string;
    account_type: string;
    masked_account_number: string;
    current_balance: number;
    currency: string;
    status: string;
  }>;

  devices: Array<{
    device_id: string;
    device_name: string;
    device_brand: string;
    device_model: string;
    device_type: string;
    os_version: string;
    trust_score: number;
    is_trusted: boolean;
    last_seen: string;
  }>;

  recent_transactions: Array<{
    transaction_id: string;
    transaction_date: string;
    channel: string;
    transaction_type: string;
    amount: number;
    currency: string;
    location_city: string;
    status: string;
  }>;
}


/* =========================================================
   COMPONENT
========================================================= */

@Component({
  selector: 'app-customer-profiling',

  templateUrl:
    './customer-profiling.component.html',

  styleUrls: [
    './customer-profiling.component.scss'
  ]
})

export class CustomerProfilingComponent
  implements OnInit {


  /* =======================================================
     CUSTOMER TABLE
  ======================================================= */

  customers: CustomerSummary[] = [];


  /* =======================================================
     SELECTED CUSTOMER
  ======================================================= */

  selectedCustomer: Customer360 | null = null;


  /* =======================================================
     LOADING / ERROR STATES
  ======================================================= */

  loading = false;

  loadingDetails = false;

  errorMessage = '';


  /* =======================================================
     FILTERS
  ======================================================= */

  search = '';

  segment = '';

  riskProfile = '';


  /* =======================================================
     PAGINATION
  ======================================================= */

  pagination: Pagination = {

    page: 1,

    size: 10,

    total: 0,

    total_pages: 0,

    has_more: false
  };


  /* =======================================================
     CONSTRUCTOR
  ======================================================= */

  constructor(
    private fraudService: HttpService
  ) {}


  /* =======================================================
     INIT
  ======================================================= */

  ngOnInit(): void {

    this.loadCustomers();

  }


  /* =======================================================
     LOAD CUSTOMER TABLE
  ======================================================= */

  loadCustomers(
    page: number = 1
  ): void {

    this.loading = true;

    this.errorMessage = '';


    this.fraudService
      .getCustomers(
        page,
        this.pagination.size,
        this.search,
        this.segment,
        this.riskProfile
      )
      .subscribe({

        next: (response: any) => {

          if (
            response &&
            response.status === 'success'
          ) {

            this.customers =
              response.customers || [];


            this.pagination =
              response.pagination || {
                page: 1,
                size: 10,
                total: 0,
                total_pages: 0,
                has_more: false
              };


            this.errorMessage = '';

          } else {

            this.customers = [];


            this.errorMessage =
              'Unable to load customer profiles.';

          }


          this.loading = false;

        },


        error: (error: any) => {

          console.error(
            'Customer API error:',
            error
          );


          this.customers = [];


          this.errorMessage =
            'Unable to load customer profiles.';


          this.loading = false;

        }

      });

  }


  /* =======================================================
     OPEN CUSTOMER 360
  ======================================================= */

  openCustomer(
    customerId: string
  ): void {

    if (!customerId) {
      return;
    }


    this.loadingDetails = true;

    this.errorMessage = '';


    this.fraudService
      .getCustomer360(customerId)
      .subscribe({

        next: (response: any) => {

          if (
            response &&
            response.status === 'success' &&
            response.customer_360
          ) {

            this.selectedCustomer =
              response.customer_360;


            this.errorMessage = '';


            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            });

          } else {

            this.selectedCustomer = null;


            this.errorMessage =
              'Unable to load customer details.';

          }


          this.loadingDetails = false;

        },


        error: (error: any) => {

          console.error(
            'Customer 360 API error:',
            error
          );


          this.selectedCustomer = null;


          this.errorMessage =
            'Unable to load customer details.';


          this.loadingDetails = false;

        }

      });

  }


  /* =======================================================
     BACK TO CUSTOMER LIST
  ======================================================= */

  backToCustomers(): void {

    this.selectedCustomer = null;

    this.errorMessage = '';


    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  /* =======================================================
     SEARCH
  ======================================================= */

  onSearch(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    this.search =
      input.value;

  }


  /* =======================================================
     SEGMENT FILTER
  ======================================================= */

  onSegmentChange(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;


    this.segment =
      select.value;


    this.loadCustomers(1);

  }


  /* =======================================================
     RISK FILTER
  ======================================================= */

  onRiskChange(
    event: Event
  ): void {

    const select =
      event.target as HTMLSelectElement;


    this.riskProfile =
      select.value;


    this.loadCustomers(1);

  }


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  clearFilters(): void {

    this.search = '';

    this.segment = '';

    this.riskProfile = '';


    this.loadCustomers(1);

  }


  /* =======================================================
     PREVIOUS PAGE
  ======================================================= */

  previousPage(): void {

    if (
      this.pagination.page > 1
    ) {

      this.loadCustomers(
        this.pagination.page - 1
      );

    }

  }


  /* =======================================================
     NEXT PAGE
  ======================================================= */

  nextPage(): void {

    if (
      this.pagination.has_more
    ) {

      this.loadCustomers(
        this.pagination.page + 1
      );

    }

  }


  /* =======================================================
     FORMAT CURRENCY
  ======================================================= */

  formatCurrency(
    amount: number | null | undefined
  ): string {

    if (
      amount === null ||
      amount === undefined
    ) {

      return 'Ksh 0';

    }


    return new Intl.NumberFormat(
      'en-KE',
      {
        style: 'currency',

        currency: 'KES',

        minimumFractionDigits: 0,

        maximumFractionDigits: 2
      }
    ).format(amount);

  }


  /* =======================================================
     FORMAT LABEL
  ======================================================= */

  formatLabel(
    value: string | null | undefined
  ): string {

    if (!value) {

      return '-';

    }


    return value
      .replace(
        /_/g,
        ' '
      )
      .toLowerCase()
      .replace(
        /\b\w/g,
        char =>
          char.toUpperCase()
      );

  }


  /* =======================================================
     RISK CLASS
  ======================================================= */

  getRiskClass(
    risk: string
  ): string {

    switch (
      (risk || '').toUpperCase()
    ) {

      case 'CRITICAL':

        return 'risk-high';


      case 'HIGH':

        return 'risk-high';


      case 'MEDIUM':

        return 'risk-medium';


      case 'LOW':

        return 'risk-low';


      default:

        return 'risk-low';

    }

  }


  /* =======================================================
     TRANSACTION STATUS CLASS
  ======================================================= */

  getStatusClass(
    status: string
  ): string {

    switch (
      (status || '').toUpperCase()
    ) {

      case 'BLOCKED':

        return 'status-blocked';


      case 'CHALLENGED':

        return 'status-challenged';


      case 'APPROVED':

        return 'status-approved';


      default:

        return 'status-approved';

    }

  }


  /* =======================================================
     MAXIMUM GRAPH VALUE
  ======================================================= */

  getMaxTrendAmount(): number {

    if (
      !this.selectedCustomer ||
      !this.selectedCustomer
        .transaction_trend ||
      !this.selectedCustomer
        .transaction_trend.length
    ) {

      return 1;

    }


    return Math.max(

      ...this.selectedCustomer
        .transaction_trend
        .map(
          item =>
            item.total_amount || 0
        ),

      1

    );

  }


  /* =======================================================
     GRAPH BAR HEIGHT
  ======================================================= */

  getTrendHeight(
    amount: number
  ): number {

    const max =
      this.getMaxTrendAmount();


    if (!amount) {

      return 2;

    }


    return Math.max(

      (
        amount / max
      ) * 100,

      5

    );

  }

}