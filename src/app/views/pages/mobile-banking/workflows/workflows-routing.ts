import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListWorkflowsComponent} from "./list-customers/list-workflows.component";


const routes: Routes = [

  {
    path: 'list-workflows',
    component: ListWorkflowsComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkflowsRoutingModule {
}
