import {NgModule} from '@angular/core';
import {ChannelsRoutingModule} from './channels-routing';


import {ViewCustomerComponent} from "./view-customer/view-customer.component";

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {AddCustomerComponent} from "./add-customer/add-customer.component";
import {ListInternetBankingCustomersComponent} from "./list-internet-banking/list-internet-banking-customers.component";
import {ListUssdCustomersComponent} from "./list-ussd/list-ussd-customers.component";
import {ListMobileBankingCustomersComponent} from "./list-mobile-application/list-mobile-banking-customers.component";
import {ViewMobileAppCustomerComponent} from "./view-mobile-app-customers/view-mobile-app-customer.component";

@NgModule({
    imports: [
        SharedModule,
        ChannelsRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule
    ],
  declarations: [
    ListUssdCustomersComponent,
    ListInternetBankingCustomersComponent,
    ListMobileBankingCustomersComponent,
    ViewCustomerComponent,
    ViewMobileAppCustomerComponent,
    AddCustomerComponent,
  ]
  ,
  entryComponents: [
    AddCustomerComponent,
  ],
})
export class ChannelsModule {
}

