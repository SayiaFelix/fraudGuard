import {NgModule} from '@angular/core';
import {ChannelsRoutingModule} from './channels-routing';


import {ViewCustomerComponent} from "./view-ussd-customer/view-customer.component";

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {AddCustomerComponent} from "./add-customer/add-customer.component";
import {ListInternetBankingCustomersComponent} from "./list-internet-banking/list-internet-banking-customers.component";
import {ListUssdCustomersComponent} from "./list-ussd/list-ussd-customers.component";
import { ViewInternetBankingComponent } from './view-internet-banking/view-internet-banking.component';
import {ListMobileBankingCustomersComponent} from "./list-mobile-application/list-mobile-banking-customers.component";
import {ViewMobileAppCustomerComponent} from "./view-mobile-app-customers/view-mobile-app-customer.component";
import {AddMobileAppCustomerComponent} from "./add-mobile-app-customer/add-mobile-app-customer.component";
import {NgSelectModule} from "@ng-select/ng-select";
import {ChannelDashboardComponent} from "./channel-dashboard/channel-dashboard.component";
import {NgApexchartsModule} from "ng-apexcharts";
import {AgmCoreModule} from "@agm/core";

@NgModule({
  imports: [
    SharedModule,
    ChannelsRoutingModule,
    FeatherIconModule,
    NgxDatatableModule,
    TranslateModule,
    NgSelectModule,
    NgApexchartsModule,
    AgmCoreModule
  ],
  declarations: [
    ListUssdCustomersComponent,
    ListInternetBankingCustomersComponent,
    ListMobileBankingCustomersComponent,
    ViewCustomerComponent,
    ViewMobileAppCustomerComponent,
    AddCustomerComponent,
    AddMobileAppCustomerComponent,
    ViewInternetBankingComponent,
    ChannelDashboardComponent
  ]
  ,
  entryComponents: [
    AddCustomerComponent,
    AddMobileAppCustomerComponent
  ],
})
export class ChannelsModule {
}

