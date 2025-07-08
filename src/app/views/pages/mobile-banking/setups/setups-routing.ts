import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ListBranchesComponent} from './Branches/list-branches/list-branches.component';
import {RegionsListComponent} from "./Regions/regions-list/regions-list.component";
import {ListAtmsComponent} from "./Atms/list-atms/list-atms.component";
import {ListServicesComponent} from "./Services/list-services/list-services.component";

const routes: Routes = [
  {
    path: 'list-Regions',
    component: RegionsListComponent
  },

  {
    path: 'logs',
    component: ListBranchesComponent
  },

  {
    path: 'list-atms',
    component: ListAtmsComponent
  },

  {
    path: 'list-services',
    component: ListServicesComponent
  },


  // {
  //   path: 'product/:id',
  //   component: ViewProductComponent
  // }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})
export class SetupsRoutingModule {
}
