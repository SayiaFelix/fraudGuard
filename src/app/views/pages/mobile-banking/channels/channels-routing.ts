import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListUssdCustomersComponent} from "./list-ussd/list-ussd-customers.component";
import {ViewCustomerComponent} from "./view-ussd-customer/view-customer.component";
import {ListInternetBankingCustomersComponent} from "./list-internet-banking/list-internet-banking-customers.component";

import { ViewInternetBankingComponent } from './view-internet-banking/view-internet-banking.component';
import {ListMobileBankingCustomersComponent} from "./list-mobile-application/list-mobile-banking-customers.component";
import {ViewMobileAppCustomerComponent} from "./view-mobile-app-customers/view-mobile-app-customer.component";
import {UssdChannelDashboardComponent} from "./ussd-channel-dashboard/ussd-channel-dashboard.component";
import {IbChannelDashboardComponent} from "./ib-channel-dashboard/ib-channel-dashboard.component";
import {AppChannelDashboardComponent} from "./app-channel-dashboard/app-channel-dashboard.component";
import {ListChannelsComponent} from "./list-channels/list-channels.component";



const routes: Routes = [

  {
    path: 'all-channels',
    component: ListChannelsComponent
  },
  {
    path: 'list-requests',
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
    path: 'ussd-ussd-channel-dashboard',
    component: UssdChannelDashboardComponent
  },
  {
    path: 'ib-ussd-channel-dashboard',
    component: IbChannelDashboardComponent
  },
  {
    path: 'app-ussd-channel-dashboard',
    component: AppChannelDashboardComponent
  },

  {
    path: 'ussdcustomer/:id',
    component: ViewCustomerComponent
  },

  {
    path: 'InternetBanking/:id',
    component: ViewInternetBankingComponent,
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
