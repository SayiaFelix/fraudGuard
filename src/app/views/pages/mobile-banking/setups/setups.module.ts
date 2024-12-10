import {NgModule, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {SetupsRoutingModule} from './setups-routing';


import {ListBranchesComponent} from './Branches/list-branches/list-branches.component';
import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {RegionsListComponent} from "./Regions/regions-list/regions-list.component";
import {DefineRegionComponent} from "./Regions/define-region-component/define-region-component.component";
import {AgmCoreModule} from "@agm/core";
import {ListAtmsComponent} from "./Atms/list-atms/list-atms.component";
import {AddAtmComponent} from "./Atms/add-atm/add-atm.component";
import {AddBranchComponent} from "./Branches/add-branch/add-branch.component";
import {ListServicesComponent} from "./Services/list-services/list-services.component";
import {AddServiceComponent} from "./Services/add-service/add-service.component";


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
    AddBranchComponent,
    AddAtmComponent,
    ListServicesComponent,
    AddServiceComponent
    // ViewBranchComponent,
    // CreateBranchComponent
  ]
  ,
  entryComponents: [
    DefineRegionComponent,
    AddBranchComponent,
    AddAtmComponent
    // CreateBranchComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SetupsModule {
}
