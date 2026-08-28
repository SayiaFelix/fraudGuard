import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListCustomersComponent} from "./list-customers/list-customers.component";
import {ViewCustomerComponent} from "./view-customer/view-customer.component";
import {ListFailedRegistrationsComponent} from "./list-failed-registrations/list-failed-registrations.component";
import {SendSmsComponent} from "./send-sms-component/send-sms.component";
import {ReasonsForFailureComponent} from "./reasons-for-failure/reasons-for-failure.component";
import { add } from 'ngx-bootstrap/chronos';
import { AddCustomerComponent } from './add-customer/add-customer.component';
import { VoiceComponent } from './voice/voice.component';
import { IntentComponent } from './intents/intent.component';
import { TestComponentRenderer } from '@angular/core/testing';



const routes: Routes = [

  {
    path: 'all',
    component: ListCustomersComponent
  },

  {
    path: 'transactions',
    component: AddCustomerComponent
  },

{
    path: 'fraud',
    component: ListFailedRegistrationsComponent,
    children: [
      { path: '', redirectTo: 'transactions', pathMatch: 'full' },
      { path: 'risk-analyzer', component: IntentComponent },
      { path: 'live-feed', redirectTo: 'transactions', pathMatch: 'full' },
      // Unified transactions page (live feed + fraud alerts)
      { path: 'transactions', component: AddCustomerComponent },
      { path: 'investigation-graph', component: ReasonsForFailureComponent },
      { path: 'investigation-graph/:id', component: ReasonsForFailureComponent },
      { path: 'ai-insights', component: VoiceComponent },
      { path: 'history', component: ViewCustomerComponent },
      { path: 'alert-detail/:id', component: SendSmsComponent },
    ]
  }
,

 { path: 'test', component: TestComponentRenderer },
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
