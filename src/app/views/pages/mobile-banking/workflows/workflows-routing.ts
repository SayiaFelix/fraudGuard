import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ListWorkflowsComponent} from "./list-workflows/list-workflows.component";
import { ListWorkflowMenuComponent } from './list-workflow-menu/list-workflow-menu.component';
import {ViewSingleWorkflowComponent} from "./view-single-workflow/view-single-workflow.component";
import {MyTasksComponent} from "./my-tasks/my-tasks.component";
import {AllTasksComponent} from "./all-tasks/all-tasks.component";
import {ViewSingleTaskComponent} from "./view-single-task/view-single-task.component";
import {TestComponent} from "./test/test.component";


const routes: Routes = [

  {
    path: 'list-workflow-menu',
    component: ListWorkflowMenuComponent,
    children: [
      {
        path:'',
        component: ListWorkflowsComponent
      },
      {
        path:'list-workflows',
        component: ListWorkflowsComponent
      },
      {
        path:'my-tasks',
        component: MyTasksComponent
      },
      {
        path:'all-tasks',
        component: AllTasksComponent
      }
    ]
  },

  {
    path: 'test',
    component: TestComponent,
    children: [
      {
        path: '',
        component: ListWorkflowsComponent
      },
      {
        path:'list-workflows',
        component: ListWorkflowsComponent
      },
      {
        path:'my-tasks',
        component: MyTasksComponent
      },
      {
        path:'all-tasks',
        component: AllTasksComponent
      }
    ]
  },

  {
    path: 'my-tasks',
    component: MyTasksComponent,
  },

  {
    path: 'my-task/:id',
    component: ViewSingleTaskComponent
  },

  {
    path: 'all-tasks',
    component: AllTasksComponent,
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
