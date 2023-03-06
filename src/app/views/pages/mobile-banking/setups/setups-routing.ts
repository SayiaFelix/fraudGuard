import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ListBranchesComponent} from './Branches/list-branches/list-branches.component';
import {RegionsListComponent} from "./Regions/regions-list/regions-list.component";
import {ListAtmsComponent} from "./Atms/list-atms/list-atms.component";

const routes: Routes = [
  {
    path: 'list-Regions',
    component: RegionsListComponent
  },

  {
    path: 'list-branches',
    component: ListBranchesComponent
  },

  {
    path: 'list-atms',
    component: ListAtmsComponent
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
