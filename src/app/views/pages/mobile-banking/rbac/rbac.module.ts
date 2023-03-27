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
import {TranslateModule} from "@ngx-translate/core";
import {AddUserComponent} from "./Users/add-user/add-user.component";
import {AddProfileComponent} from "./profiles/add-profile/add-profile.component";
import {ViewProfileComponent} from "./profiles/view-profile/view-profile.component";
import { ChangeProfileModalComponent } from './Users/change-profile-modal/change-profile-modal.component';


@NgModule({
    imports: [
        SharedModule,
        RbacRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule
    ],
    declarations: [
        RolesComponent,
        AddRoleComponent,
        ProfilesComponent,
        ProfileRolesComponent,
        ListUsersComponent,
        ViewUserComponent,
        AddUserComponent,
        AddProfileComponent,
        ViewProfileComponent,
        ChangeProfileModalComponent
    ]
    ,
    entryComponents: [
      AddUserComponent,
      AddRoleComponent,
      AddProfileComponent,
      ChangeProfileModalComponent
    ],
})
export class RbacModule {
}
