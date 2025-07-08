import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListRequestsComponent} from "./list-requests/list-requests.component";
import { ViewRequestsComponent } from './view-requests/view-requests.component';




const routes: Routes = [

  {
    path: 'all-analytics',
    component: ListRequestsComponent
  }
,
{
  path: 'customer-details/:id',
  component: ViewRequestsComponent
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RequestsRoutingModule {
}
