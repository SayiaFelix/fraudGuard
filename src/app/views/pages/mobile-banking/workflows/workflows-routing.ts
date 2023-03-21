import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListWorkflowsComponent} from "./list-customers/list-workflows.component";
import {ViewSingleWorkflowComponent} from "./view-single-workflow/view-single-workflow.component";


const routes: Routes = [

  {
    path: 'list-workflows',
    component: ListWorkflowsComponent
  },

  {
    path: 'workflow/:id',
    component: ViewSingleWorkflowComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkflowsRoutingModule {
}
