import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import {ForgotPasswordComponent} from "./forgot-password/forgot-password.component";
import {ReactiveFormsModule} from "@angular/forms";
import {FeatherIconModule} from "../../../core/feather-icon/feather-icon.module";
import {SharedModule} from "../../../shared/shared.module";
import {TranslateModule} from "@ngx-translate/core";
import {FirstTimeLoginComponent} from "./first-time-login/first-time-login.component";
import {ChangePasswordComponent} from "./change-password/change-password.component";
import { LandingComponent } from './landing/landing.component';
import { StandardsComponent } from './all-standards/all-standards.component';
import { ViewStandardsComponent } from './view-standards/view-standards.component';
import { HomeComponent } from './home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      // {
      //   path: '',
      //   redirectTo: 'standards',
      //   pathMatch: 'full'
      // },
      {
        path: '',
        component: LandingComponent
      },
      
      {
        path: 'all-standards',
        component: StandardsComponent
      },
      {
        path: 'Id',
        component: ViewStandardsComponent
      },
      // {
      //   path: 'forgot-password',
      //   component: ForgotPasswordComponent
      // },
      // {
      //   path: 'first-time-login',
      //   component: FirstTimeLoginComponent
      // },
      // {
      //   path: 'change-password',
      //   component: ChangePasswordComponent
      // }
    ]
  },
]

@NgModule({
  declarations: [
    LandingComponent,
    StandardsComponent,
    ViewStandardsComponent,
    ForgotPasswordComponent,
    HomeComponent,
    FirstTimeLoginComponent,
    ChangePasswordComponent
  ],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        SharedModule,
        ReactiveFormsModule,
        FeatherIconModule,
        TranslateModule
    ]
})
export class HomeModule { }
