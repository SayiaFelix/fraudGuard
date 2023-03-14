import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListUssdCustomersComponent} from "./list-ussd/list-ussd-customers.component";
import {ViewCustomerComponent} from "./view-customer/view-customer.component";
import {ListInternetBankingCustomersComponent} from "./list-internet-banking/list-internet-banking-customers.component";
import {ListMobileAppCustomersComponent} from "./list-mobile-app/list-mobile-app-customers.component";


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
    path: 'customer/:id',
    component: ViewCustomerComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChannelsRoutingModule {
}
