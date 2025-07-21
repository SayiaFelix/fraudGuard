import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListCustomersComponent} from "./list-customers/list-customers.component";
import {ViewCustomerComponent} from "./view-customer/view-customer.component";
import {ListFailedRegistrationsComponent} from "./list-failed-registrations/list-failed-registrations.component";
import {SendSmsComponent} from "./send-sms-component/send-sms.component";
import {ReasonsForFailureComponent} from "./reasons-for-failure/reasons-for-failure.component";



const routes: Routes = [

  {
    path: 'ai_chat',
    component: ListCustomersComponent
  },

{
    path: 'user_bot',
    component: ListFailedRegistrationsComponent,
    children: [
      { path: '', redirectTo: 'general', pathMatch: 'full' },
      { path: 'general', component: ListCustomersComponent },
      { path: 'action', component: SendSmsComponent },
      { path: 'llm', component: ViewCustomerComponent },
      { path: 'publish', component: ReasonsForFailureComponent },
      // { path: 'voice', component: VoiceComponent },
    ]
  }
,
  // {
  //   path: 'action',
  //   component: SendSmsComponent
  // },

  // {
  //   path: 'llm',
  //   component: ViewCustomerComponent
  // },

  // {
  //   path: 'publish',
  //   component: ReasonsForFailureComponent
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule {
}
