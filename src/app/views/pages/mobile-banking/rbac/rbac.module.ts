import {NgModule} from '@angular/core';
import {RbacRoutingModule} from './rbac-routing';
import {RolesComponent} from './roles/list-roles/roles.component';
import {AddRoleComponent} from './roles/add-role/add-role.component';
import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {ProfilesComponent} from "./profiles/list-profiles/profiles.component";
import {ProfileRolesComponent} from "./profiles/profile-roles/profile-roles.component";
import {ListUsersComponent} from "./Users/list-users/list-users.component";
import {ViewUserComponent} from "./Users/view-user/view-user.component";


@NgModule({
    imports: [
      SharedModule,
      RbacRoutingModule,
      FeatherIconModule,
      NgxDatatableModule
    ],
    declarations: [
        RolesComponent,
        AddRoleComponent,
        ProfilesComponent,
        ProfileRolesComponent,
        ListUsersComponent,
        ViewUserComponent,
    ]
    ,
    entryComponents: [
        AddRoleComponent,
    ],
})
export class RbacModule {
}
