import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FeatherIconModule } from '../../../core/feather-icon/feather-icon.module';
import { SharedModule } from '../../../shared/shared.module';
import { MobileBankingComponent } from './mobile-banking.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthGuard } from 'src/app/core/guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: MobileBankingComponent,
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'customers',
        loadChildren: () =>
          import('./customers/customers.module').then((m) => m.CustomersModule)
      },

      {
        path: 'products',
        loadChildren: () =>
          import('./products/products.module').then((m) => m.ProductsModule),
      },

      {
        path: 'setups',
        loadChildren: () =>
          import('./setups/setups.module').then((m) => m.SetupsModule),
      },

      {
        path: 'rbac',
        loadChildren: () =>
          import('./rbac/rbac.module').then((m) => m.RbacModule),
      },

      {
        path: 'Users',
        loadChildren: () =>
          import('./rbac/rbac.module').then((m) => m.RbacModule),
      },
    ],
  },
];

@NgModule({
  declarations: [MobileBankingComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    ReactiveFormsModule,
    FeatherIconModule,
    TranslateModule,
  ],
})
export class MobileBankingModule {}
