import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListUssdCustomersComponent} from "./list-ussd/list-ussd-customers.component";
import {ViewCustomerComponent} from "./view-ussd-customer/view-customer.component";
import {ListInternetBankingCustomersComponent} from "./list-internet-banking/list-internet-banking-customers.component";
import {ListMobileAppCustomersComponent} from "./list-mobile-app/list-mobile-app-customers.component";
import { ViewInternetBankingComponent } from './view-internet-banking/view-internet-banking.component';


const routes: Routes = [

  {
    path: 'list-ussd',
    component: ListUssdCustomersComponent
  },

  {
    path: 'list-internet-banking',
    component: ListInternetBankingCustomersComponent
  },

  {
    path: 'send-bulk-sms',
    component: ListMobileAppCustomersComponent
  },

  {
    path: 'ussdcustomer/:id',
    component: ViewCustomerComponent
  },
  
  {
    path: 'InternetBanking/:id',
    component: ViewInternetBankingComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChannelsRoutingModule {
}
