import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListCustomersComponent} from "./list-customers/list-customers.component";
import {ViewCustomerComponent} from "./view-customer/view-customer.component";
import {ListFailedRegistrationsComponent} from "./list-failed-registrations/list-failed-registrations.component";
import {SendSmsComponent} from "./send-sms-component/send-sms.component";


const routes: Routes = [

  {
    path: 'list-requests',
    component: ListCustomersComponent
  },

  {
    path: 'list-internet-banking',
    component: ListFailedRegistrationsComponent
  },

  {
    path: 'send-bulk-sms',
    component: SendSmsComponent
  },

  {
    path: 'customer/:id',
    component: ViewCustomerComponent
  },


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule {
}
