import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {RolesComponent} from './roles/list-roles/roles.component';
import {ProfilesComponent} from "./profiles/list-profiles/profiles.component";
import {ProfileRolesComponent} from "./profiles/profile-roles/profile-roles.component";
import { ListUsersComponent } from './Users/list-users/list-users.component';
import { ViewUserComponent } from './Users/view-user/view-user.component';

const routes: Routes = [
    {
        path: 'all-roles',
        component: RolesComponent
    },
    {
      path: 'tickets',
      component: ProfilesComponent
    },
    {
      path: 'profile/:id',
      component: ProfileRolesComponent
    },

  {
    path: 'livechats',
    component: ListUsersComponent
  },

  {
    path: 'users/:id',
    component: ViewUserComponent
  }
];

export const RbacRoutingModule: ModuleWithProviders<any> = RouterModule.forChild(routes);
