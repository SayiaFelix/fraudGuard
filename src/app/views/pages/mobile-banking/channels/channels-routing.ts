import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListUssdCustomersComponent} from "./list-ussd/list-ussd-customers.component";
import {ViewCustomerComponent} from "./view-ussd-customer/view-customer.component";
import {ListInternetBankingCustomersComponent} from "./list-internet-banking/list-internet-banking-customers.component";

import { ViewInternetBankingComponent } from './view-internet-banking/view-internet-banking.component';
import {ListMobileBankingCustomersComponent} from "./list-mobile-application/list-mobile-banking-customers.component";
import {ViewMobileAppCustomerComponent} from "./view-mobile-app-customers/view-mobile-app-customer.component";



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
    path: 'list-mobile-app',
    component: ListMobileBankingCustomersComponent
  },

  {
    path: 'ussdcustomer/:id',
    component: ViewCustomerComponent
  },
  
  {
    path: 'InternetBanking/:id',
    component: ViewInternetBankingComponent
  },
  {
    path: 'mobile-app/:id',
    component: ViewMobileAppCustomerComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChannelsRoutingModule {
}
