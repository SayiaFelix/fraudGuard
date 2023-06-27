import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListRequestsComponent} from "./list-requests/list-requests.component";




const routes: Routes = [

  {
    path: 'list-standards',
    component: ListRequestsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RequestsRoutingModule {
}
