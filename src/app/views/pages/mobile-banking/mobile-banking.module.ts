import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import {ReactiveFormsModule} from "@angular/forms";
import {FeatherIconModule} from "../../../core/feather-icon/feather-icon.module";
import {SharedModule} from "../../../shared/shared.module";
import {MobileBankingComponent} from "./mobile-banking.component";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {NgxDatatableComponent} from "../tables/ngx-datatable/ngx-datatable.component";
import { ListBranchesComponent } from './branches/list-branches/list-branches.component';

const routes: Routes = [
  {
    path: '',
    component: MobileBankingComponent,
    children: [
      { path: 'products', loadChildren: () => import('./products/products.module').then(m => m.ProductsModule) },

      { path: 'setups', loadChildren: () => import('./branches/branches.module').then(m => m.BranchesModule) },

      { path: 'rbac', loadChildren: () => import('./rbac/rbac.module').then(m => m.RbacModule) },

    ]
  },
]

@NgModule({
  declarations: [
    MobileBankingComponent,
    ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    ReactiveFormsModule,
    FeatherIconModule,

  ]
})
export class MobileBankingModule { }
