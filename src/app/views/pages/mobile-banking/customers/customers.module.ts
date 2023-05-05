import {NgModule} from '@angular/core';
import {CustomersRoutingModule} from './customers-routing';


import {ListCustomersComponent} from './list-customers/list-customers.component';
import {ViewCustomerComponent} from "./view-customer/view-customer.component";

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
import {AddCustomerComponent} from "./add-customer/add-customer.component";
import {ListFailedRegistrationsComponent} from "./list-failed-registrations/list-failed-registrations.component";
import {SendSmsComponent} from "./send-sms-component/send-sms.component";
import {ReasonsForFailureComponent} from "./reasons-for-failure/reasons-for-failure.component";

@NgModule({
    imports: [
        SharedModule,
        CustomersRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule
    ],
  declarations: [
    ListCustomersComponent,
    ListFailedRegistrationsComponent,
    SendSmsComponent,
    ViewCustomerComponent,
    AddCustomerComponent,
    ReasonsForFailureComponent

    // CreateProductComponent
  ]
  ,
  entryComponents: [
    AddCustomerComponent,
    // CreateProductComponent
  ],
})
export class CustomersModule {
}

