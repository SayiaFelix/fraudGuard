import {NgModule, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
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
import { Ng2TelInputModule } from 'ng2-tel-input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { VoiceComponent } from './voice/voice.component';
import { IntentComponent } from './intents/intent.component';
import { FilterPipe } from './file.pipe';

@NgModule({
    imports: [
        SharedModule,
        Ng2TelInputModule,
        CustomersRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        Ng2TelInputModule,
        TranslateModule,
        FormsModule,
        ReactiveFormsModule
    ],
  declarations: [
    ListCustomersComponent,
    ListFailedRegistrationsComponent,
    SendSmsComponent,
    ViewCustomerComponent,
    AddCustomerComponent,
    ReasonsForFailureComponent,
    VoiceComponent,
    IntentComponent,
    FilterPipe 
    // CreateProductComponent
  ],
  entryComponents: [
    AddCustomerComponent,
    // CreateProductComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CustomersModule {
}

