import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import { ListAuditsComponent } from './list-audits/list-audits.component';




const routes: Routes = [

  {
    path: 'list-audits',
    component: ListAuditsComponent
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditTrailRoutingModule {
}