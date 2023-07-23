import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FeatherIconModule } from '../../../core/feather-icon/feather-icon.module';
import { SharedModule } from '../../../shared/shared.module';
import { MobileBankingComponent } from './mobile-banking.component';
import { TranslateModule } from '@ngx-translate/core';
import { AuthGuard } from 'src/app/core/guard/auth.guard';
import { Ng2TelInputModule } from 'ng2-tel-input';




const routes: Routes = [
  {
    path: '',
    component: MobileBankingComponent,
    canActivateChild: [AuthGuard],
    children: [

      {
        path: 'standards',
        loadChildren: () =>
          import('./requests/requests.module').then((m) => m.RequestsModule)
      },
      {
        path: 'reports&results',
        loadChildren: () =>
          import('./customers/customers.module').then((m) => m.CustomersModule)
      },

      {
        path: 'requests',
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
      // {
      //   path: 'accounts',
      //   loadChildren: () =>
      //     import('./Accounts/accounts.module').then((m) => m.AccountsModule)
      // },


      // {
      //   path: 'channels',
      //   loadChildren: () =>
      //     import('./channels/channels.module').then((m) => m.ChannelsModule)
      // },

      // {
      //   path: 'audit-trail',
      //   loadChildren:() =>
      //   import('./audit-trail/audit-trail.module').then((m) => m.AuditTrailModule)
      // },
      // {
      //   path: 'workflows',
      //   loadChildren: () =>
      //     import('./workflows/workflows.module').then((m) => m.WorkflowsModule),
      // },
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
    Ng2TelInputModule,
    FeatherIconModule,
    TranslateModule,
  ],
})
export class MobileBankingModule { }
