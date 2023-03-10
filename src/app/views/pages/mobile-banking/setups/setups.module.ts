import {NgModule} from '@angular/core';
import {SetupsRoutingModule} from './setups-routing';


import {ListBranchesComponent} from './Branches/list-branches/list-branches.component';
import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {RegionsListComponent} from "./Regions/regions-list/regions-list.component";
import {DefineRegionComponent} from "./Regions/define-region-component/define-region-component.component";
import {AgmCoreModule} from "@agm/core";
import {ListAtmsComponent} from "./Atms/list-atms/list-atms.component";
import {AddAtmsComponent} from "./Atms/add-atms/add-atms.component";
import {AddBranchComponent} from "./Branches/add-branch/add-branch.component";
import {AddAtmComponent} from "./Atms/add-atm/add-atm.component";


@NgModule({
  imports: [
    SharedModule,
    SetupsRoutingModule,
    FeatherIconModule,
    NgxDatatableModule,
    AgmCoreModule,
  ],
  declarations: [
    ListBranchesComponent,
    RegionsListComponent,
    DefineRegionComponent,
    ListAtmsComponent,
    AddAtmsComponent,
    AddBranchComponent,
    AddAtmComponent
    // ViewBranchComponent,
    // CreateBranchComponent
  ]
  ,
  entryComponents: [
    DefineRegionComponent,
    AddAtmsComponent,
    AddBranchComponent,
    AddAtmComponent
    // CreateBranchComponent
  ],
})
export class SetupsModule {
}
