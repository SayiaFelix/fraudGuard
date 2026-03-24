import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BaseComponent } from './views/layout/base/base.component';
import { ErrorPageComponent } from './views/pages/error-page/error-page.component';
import { RoleGuard } from './shared/services/role.guard';
import { AuthGuard } from './shared/services/auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./views/pages/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: BaseComponent,
    canActivate: [AuthGuard],  
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./views/pages/dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
      },
      {
        path: 'fraudsentinelAi',
        loadChildren: () =>
          import('./views/pages/mobile-banking/mobile-banking.module').then(
            (m) => m.MobileBankingModule
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: {
          roles: ['admin', 'analyst', 'investigator', 'compliance']
        },
      },
      {
        path: 'apps',
        loadChildren: () =>
          import('./views/pages/apps/apps.module').then((m) => m.AppsModule),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./views/pages/ui-components/ui-components.module').then(
            (m) => m.UiComponentsModule
          ),
      },
      {
        path: 'advanced-ui',
        loadChildren: () =>
          import('./views/pages/advanced-ui/advanced-ui.module').then(
            (m) => m.AdvancedUiModule
          ),
      },
      {
        path: 'form-elements',
        loadChildren: () =>
          import('./views/pages/form-elements/form-elements.module').then(
            (m) => m.FormElementsModule
          ),
      },
      {
        path: 'advanced-form-elements',
        loadChildren: () =>
          import(
            './views/pages/advanced-form-elements/advanced-form-elements.module'
          ).then((m) => m.AdvancedFormElementsModule),
      },
      {
        path: 'charts-graphs',
        loadChildren: () =>
          import('./views/pages/charts-graphs/charts-graphs.module').then(
            (m) => m.ChartsGraphsModule
          ),
      },
      {
        path: 'tables',
        loadChildren: () =>
          import('./views/pages/tables/tables.module').then(
            (m) => m.TablesModule
          ),
      },
      {
        path: 'icons',
        loadChildren: () =>
          import('./views/pages/icons/icons.module').then((m) => m.IconsModule),
      },
      {
        path: 'general',
        loadChildren: () =>
          import('./views/pages/general/general.module').then(
            (m) => m.GeneralModule
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'error',
    component: ErrorPageComponent,
    data: {
      type: 404,
      title: 'Page Not Found',
      desc: "Ooops!! The page you were looking for doesn't exist.",
    },
  },
  {
    path: 'error/:type',
    component: ErrorPageComponent,
  },
  { path: '**', redirectTo: 'error', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}