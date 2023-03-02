import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {RolesComponent} from './roles/list-roles/roles.component';
import {ProfilesComponent} from "./profiles/list-profiles/profiles.component";
import {ProfileRolesComponent} from "./profiles/profile-roles/profile-roles.component";

const routes: Routes = [
    {
        path: 'all-roles',
        component: RolesComponent
    },
    {
      path: 'all-profiles',
      component: ProfilesComponent
    },
    {
      path: 'profile/:id',
      component: ProfileRolesComponent
    }
];

export const RbacRoutingModule: ModuleWithProviders<any> = RouterModule.forChild(routes);
