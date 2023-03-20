import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListWorkflowsComponent} from "./list-customers/list-workflows.component";
import {ViewCustomerComponent} from "./view-customer/view-customer.component";
import {ListFailedRegistrationsComponent} from "./list-failed-registrations/list-failed-registrations.component";
import {SendSmsComponent} from "./send-sms-component/send-sms.component";



const routes: Routes = [

  {
    path: 'list-workflows',
    component: ListWorkflowsComponent
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
