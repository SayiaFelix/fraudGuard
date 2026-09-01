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

interface CustomerProfileSummary {
  score: number;
  level: string;
}

interface CustomerSummary {
  customer_id: string;
  full_name: string;
  customer_segment: string;
  home_city: string;
  account_status: string;

  // Legacy field retained temporarily for backwards compatibility.
  risk_profile: string;

  branch_code: string;
  currency: string;

  // Derived profile returned by the Customer 360 backend.
  customer_profile?: CustomerProfileSummary;
}

interface Pagination {
  page: number;
  size: number;
  total: number;
  total_pages: number;
  has_more: boolean;
}


/* =========================================================
   CUSTOMER PROFILE / EXPLAINABILITY
========================================================= */

interface ProfileFactor {
  name: string;
  contribution: number;
  evidence: string;
}

interface CustomerProfileStatistics {
  total_transactions: number;
  critical_risk_transactions: number;
  high_risk_transactions: number;
  medium_risk_transactions: number;
  blocked_transactions: number;
  challenged_transactions: number;
  account_takeover_events: number;
  high_value_anomalies: number;
  velocity_anomalies: number;
  new_or_unknown_device_events: number;
  unusual_location_events: number;
  new_beneficiary_events: number;
  off_hours_events: number;
  failed_logins: number;
  recent_suspicious_transactions: number;
}

interface CustomerProfile {
  score: number;
  level: string;
  reasons: string[];
  factors: ProfileFactor[];
  statistics: CustomerProfileStatistics;
  legacy_risk_profile: string;
}


/* =========================================================
   FRONTEND-ONLY PRODUCT RECOMMENDATIONS
========================================================= */

interface ProductRecommendation {
  product_name: string;
  relevance_score: number;
  reason: string;
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

    // Legacy field retained until the old static profile is removed.
    risk_profile: string;

    currency: string;
  };

  // Derived profile calculated by the backend from actual activity.
  customer_profile?: CustomerProfile;

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

    risk_score: number;
    risk_level: string;
    fraud_type: string;

    status: string;
  }>;
}


/* =========================================================
   COMPONENT
========================================================= */

@Component({
  selector: 'app-customer-profiling',
  templateUrl: './customer-profiling.component.html',
  styleUrls: ['./customer-profiling.component.scss']
})
export class CustomerProfilingComponent implements OnInit {

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
  customerProfile = '';


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


  constructor(
    private fraudService: HttpService
  ) {}


  ngOnInit(): void {
    this.loadCustomers();
  }


  /* =======================================================
     LOAD CUSTOMER TABLE
  ======================================================= */

  loadCustomers(page: number = 1): void {
    this.loading = true;
    this.errorMessage = '';

    this.fraudService
      .getCustomers(
        page,
        this.pagination.size,
        this.search,
        this.segment,
        this.customerProfile
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
     SEARCH / FILTERS
  ======================================================= */

  onSearch(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    this.search =
      input.value;
  }


  onSegmentChange(
    event: Event
  ): void {
    const select =
      event.target as HTMLSelectElement;

    this.segment =
      select.value;

    this.loadCustomers(1);
  }


  onProfileChange(
    event: Event
  ): void {
    const select =
      event.target as HTMLSelectElement;

    this.customerProfile =
      select.value;

    this.loadCustomers(1);
  }


  clearFilters(): void {
    this.search = '';
    this.segment = '';
    this.customerProfile = '';

    this.loadCustomers(1);
  }


  /* =======================================================
     PAGINATION
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
     CUSTOMER PROFILE HELPERS
  ======================================================= */

  getCustomerProfileLevel(
    customer: CustomerSummary
  ): string {
    return (
      customer.customer_profile?.level ||
      customer.risk_profile ||
      'LOW'
    );
  }


  getCustomerProfileScore(
    customer: CustomerSummary
  ): number | null {
    return (
      customer.customer_profile?.score ??
      null
    );
  }


  getSelectedCustomerProfileLevel(
    profile: Customer360
  ): string {
    return (
      profile.customer_profile?.level ||
      profile.customer.risk_profile ||
      'LOW'
    );
  }


  getSelectedCustomerProfileScore(
    profile: Customer360
  ): number | null {
    return (
      profile.customer_profile?.score ??
      null
    );
  }


  /* =======================================================
     EXPLAINABILITY GRAPH HELPERS
  ======================================================= */

  getMaxFactorContribution(): number {
    if (
      !this.selectedCustomer ||
      !this.selectedCustomer
        .customer_profile
        ?.factors
        ?.length
    ) {
      return 1;
    }

    return Math.max(
      ...this.selectedCustomer
        .customer_profile
        .factors
        .map(
          factor =>
            factor.contribution || 0
        ),
      1
    );
  }


  getFactorWidth(
    contribution: number
  ): number {
    const max =
      this.getMaxFactorContribution();

    if (!contribution) {
      return 2;
    }

    return Math.max(
      (contribution / max) * 100,
      4
    );
  }


  /* =======================================================
     FRONTEND-GENERATED AI CUSTOMER INSIGHT
  ======================================================= */

  getAiInsight(
    profile: Customer360
  ): string {

    const level =
      this.getSelectedCustomerProfileLevel(
        profile
      );

    const stats =
      profile.customer_profile
        ?.statistics;

    const criticalCount =
      stats?.critical_risk_transactions ?? 0;

    const blockedCount =
      stats?.blocked_transactions ?? 0;

    const challengedCount =
      stats?.challenged_transactions ?? 0;

    const severeActivity =
      criticalCount +
      blockedCount +
      challengedCount;

    const recentElevatedTransactions =
      profile.recent_transactions
        ?.filter(
          tx =>
            (
              tx.risk_level || ''
            ).toUpperCase() !== 'LOW'
        ).length ?? 0;


    if (
      level === 'CRITICAL'
    ) {
      return (
        `${profile.customer.full_name}'s current profile indicates ` +
        `concentrated severe fraud-risk activity that requires immediate review. ` +
        `The elevated score is being driven by material exceptions rather than ` +
        `normal day-to-day activity. Prioritize blocked, challenged and critical ` +
        `transactions, then validate whether the associated device, location and ` +
        `beneficiary activity is legitimate.`
      );
    }


    if (
      level === 'HIGH'
    ) {
      return (
        `${profile.customer.full_name}'s HIGH profile reflects a small number ` +
        `of material risk events rather than uniformly suspicious behaviour. ` +
        `${severeActivity > 0
          ? `There are ${severeActivity} severe or intervention-related events in the observed history. `
          : ''
        }` +
        `${recentElevatedTransactions > 0
          ? `${recentElevatedTransactions} elevated-risk transaction(s) are also visible in the recent activity. `
          : ''
        }` +
        `The recommended analyst focus is on the highest-risk exceptions while ` +
        `continuing to treat normal activity separately from the elevated profile.`
      );
    }


    if (
      level === 'MEDIUM'
    ) {
      return (
        `${profile.customer.full_name}'s MEDIUM profile shows mostly routine ` +
        `activity with a smaller set of emerging anomalies. The current signals ` +
        `do not indicate consistently severe fraud behaviour, but they are strong ` +
        `enough to justify closer monitoring and review of challenged or unusual ` +
        `transactions before the profile escalates further.`
      );
    }


    return (
      `${profile.customer.full_name}'s activity is broadly consistent with the ` +
      `established customer pattern. No sustained severe fraud-risk pattern is ` +
      `currently evident. Continue routine monitoring for material changes in ` +
      `transaction behaviour, device usage, location or authentication activity.`
    );
  }

  /* =======================================================
     FRONTEND-GENERATED PRODUCT RECOMMENDATIONS
  ======================================================= */

  getProductRecommendations(
    profile: Customer360
  ): ProductRecommendation[] {

    const segment =
      (
        profile.customer
          .customer_segment || ''
      )
        .toUpperCase();

    const existingProducts =
      profile.accounts.map(
        account =>
          (
            account.account_type || ''
          )
            .toUpperCase()
      );

    const recommendations:
      ProductRecommendation[] = [];


    /* -------------------------------------------------------
       SALARIED CUSTOMER
    ------------------------------------------------------- */

    if (
      segment === 'SALARIED'
    ) {

      if (
        !existingProducts.some(
          product =>
            product.includes(
              'MORTGAGE'
            )
        )
      ) {
        recommendations.push({
          product_name:
            'Mortgage',

          relevance_score:
            88,

          reason:
            'Salaried customer with an established banking relationship and regular transaction activity.'
        });
      }


      if (
        !existingProducts.some(
          product =>
            product.includes(
              'LOAN'
            )
        )
      ) {
        recommendations.push({
          product_name:
            'Personal Loan',

          relevance_score:
            82,

          reason:
            'Regular salaried activity indicates potential relevance for short- to medium-term personal credit.'
        });
      }


      recommendations.push({
        product_name:
          'Savings & Investment',

        relevance_score:
          76,

        reason:
          'Consistent account activity suggests potential for structured savings and investment products.'
      });


      recommendations.push({
        product_name:
          'Premium Debit Card',

        relevance_score:
          70,

        reason:
          'Regular digital and merchant activity suggests potential value from an enhanced transactional card offering.'
      });
    }


    /* -------------------------------------------------------
       SME CUSTOMER
    ------------------------------------------------------- */

    else if (
      segment === 'SME'
    ) {

      recommendations.push({
        product_name:
          'Working Capital Finance',

        relevance_score:
          91,

        reason:
          'SME relationship and transaction activity indicate potential working-capital requirements.'
      });


      recommendations.push({
        product_name:
          'Merchant Collections',

        relevance_score:
          84,

        reason:
          'Digital transaction activity may benefit from integrated merchant collection services.'
      });


      recommendations.push({
        product_name:
          'Asset Finance',

        relevance_score:
          75,

        reason:
          'Potential fit for financing business equipment, vehicles or other productive assets.'
      });


      recommendations.push({
        product_name:
          'Business Current Account',

        relevance_score:
          72,

        reason:
          'A dedicated business transaction account may support payment, collection and reconciliation needs.'
      });
    }


    /* -------------------------------------------------------
       LOAN-SEGMENT CUSTOMER
       Current synthetic data still contains LOAN as a segment.
    ------------------------------------------------------- */

    else if (
      segment === 'LOAN'
    ) {

      recommendations.push({
        product_name:
          'Savings Account',

        relevance_score:
          84,

        reason:
          'Existing credit relationship presents an opportunity to deepen the customer relationship through savings.'
      });


      recommendations.push({
        product_name:
          'Debit Card',

        relevance_score:
          78,

        reason:
          'Transaction activity indicates potential value from convenient card-based payments and withdrawals.'
      });


      recommendations.push({
        product_name:
          'Mobile Banking',

        relevance_score:
          74,

        reason:
          'Digital access can improve account servicing, payments and repayment convenience.'
      });
    }


    /* -------------------------------------------------------
       RETAIL / PERSONAL / OTHER
    ------------------------------------------------------- */

    else {

      if (
        !existingProducts.some(
          product =>
            product.includes(
              'SAVINGS'
            )
        )
      ) {
        recommendations.push({
          product_name:
            'Savings Account',

          relevance_score:
            86,

          reason:
            'Provides a suitable foundation for regular saving and broader account relationship growth.'
        });
      }


      recommendations.push({
        product_name:
          'Debit Card',

        relevance_score:
          78,

        reason:
          'Transaction activity indicates potential value from card-based payments and withdrawals.'
      });


      if (
        !existingProducts.some(
          product =>
            product.includes(
              'LOAN'
            )
        )
      ) {
        recommendations.push({
          product_name:
            'Personal Loan',

          relevance_score:
            68,

          reason:
            'Customer activity may indicate potential relevance for personal credit products.'
        });
      }


      recommendations.push({
        product_name:
          'Mobile Banking',

        relevance_score:
          72,

        reason:
          'Digital banking can improve convenience for payments, transfers and account servicing.'
      });
    }


    return recommendations
      .slice(0, 3);
  }


  /* =======================================================
     ACCOUNT DISPLAY HELPERS
  ======================================================= */

  getAccountValueLabel(
    accountType:
      string |
      null |
      undefined
  ): string {

    const type =
      (
        accountType || ''
      )
        .toUpperCase();

    if (
      type.includes('LOAN')
    ) {
      return 'Outstanding';
    }

    return 'Balance';
  }


  /* =======================================================
     DISPLAY HELPERS
  ======================================================= */

  formatCurrency(
    amount:
      number |
      null |
      undefined
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


  formatLabel(
    value:
      string |
      null |
      undefined
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
     PROFILE / TRANSACTION RISK CLASSES
  ======================================================= */

  getRiskClass(
    risk:
      string |
      null |
      undefined
  ): string {

    switch (
      (risk || '')
        .toUpperCase()
    ) {

      case 'CRITICAL':
        return 'risk-critical';

      case 'HIGH':
        return 'risk-high';

      case 'MEDIUM':
        return 'risk-medium';

      case 'LOW':
      default:
        return 'risk-low';
    }
  }


  getTransactionRiskClass(
    risk:
      string |
      null |
      undefined
  ): string {

    return this.getRiskClass(
      risk
    );
  }


  /* =======================================================
     TRANSACTION STATUS CLASS
  ======================================================= */

  getStatusClass(
    status:
      string |
      null |
      undefined
  ): string {

    switch (
      (status || '')
        .toUpperCase()
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
     TRANSACTION TREND GRAPH
  ======================================================= */

  getMaxTrendAmount(): number {

    if (
      !this.selectedCustomer ||
      !this.selectedCustomer
        .transaction_trend
        ?.length
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
