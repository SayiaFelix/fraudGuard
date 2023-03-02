import {NgModule} from '@angular/core';
import {BranchesRoutingModule} from './branches-routing';


import {ListBranchesComponent} from './list-branches/list-branches.component';
import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {RegionsListComponent} from "./regions/regions-list/regions-list.component";
import {DefineRegionComponent} from "./regions/define-region-component/define-region-component.component";
import {AgmCoreModule} from "@agm/core";


@NgModule({
  imports: [
    SharedModule,
    BranchesRoutingModule,
    FeatherIconModule,
    NgxDatatableModule,
    AgmCoreModule,


  ],
  declarations: [
    ListBranchesComponent,
    RegionsListComponent,
    DefineRegionComponent
    // AddBranchComponent,
    // ViewBranchComponent,
    // CreateBranchComponent
  ]
  ,
  entryComponents: [
    DefineRegionComponent
    // AddBranchComponent,
    // CreateBranchComponent
  ],
})
export class BranchesModule {
}
