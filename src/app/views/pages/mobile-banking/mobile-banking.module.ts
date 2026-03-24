import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { FeatherIconModule } from '../../../core/feather-icon/feather-icon.module';
import { SharedModule } from '../../../shared/shared.module';
import { MobileBankingComponent } from './mobile-banking.component';
import { TranslateModule } from '@ngx-translate/core';
import { Ng2TelInputModule } from 'ng2-tel-input';
import { AuthGuard } from 'src/app/shared/services/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: MobileBankingComponent,
    canActivateChild: [AuthGuard],
    children: [

      {
        path: 'user',
        loadChildren: () =>
          import('./requests/requests.module').then((m) => m.RequestsModule)
      },
      {
        path: 'compliance',
        loadChildren: () =>
          import('./customers/customers.module').then((m) => m.CustomersModule)
      },
      {
        path: 'transaction_management',
        loadChildren: () =>
          import('./customers/customers.module').then((m) => m.CustomersModule)
      },

      {
        path: 'analytic',
        loadChildren: () =>
          import('./products/products.module').then((m) => m.ProductsModule),
      },

      {
        path: 'user_managements',
        loadChildren: () =>
          import('./setups/setups.module').then((m) => m.SetupsModule),
      },
      {
        path: 'executions',
        loadChildren: () =>
          import('./rbac/rbac.module').then((m) => m.RbacModule),
      },
      //  {
      //   path: 'settings',
      //   loadChildren: () =>
      //     import('./rbac/rbac.module').then((m) => m.RbacModule),
      // },
  
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
