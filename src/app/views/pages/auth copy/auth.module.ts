import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { Routes, RouterModule } from '@angular/router';
import { AuthComponent } from './auth.component';
import {ForgotPasswordComponent} from "./forgot-password/forgot-password.component";
import {ReactiveFormsModule} from "@angular/forms";
import {FeatherIconModule} from "../../../core/feather-icon/feather-icon.module";
import {SharedModule} from "../../../shared/shared.module";
import {HttpClientModule} from "@angular/common/http";
import {TranslateModule} from "@ngx-translate/core";
import {FirstTimeLoginComponent} from "./first-time-login/first-time-login.component";
import {ChangePasswordComponent} from "./change-password/change-password.component";
import { LandingComponent } from './landing/landing.component';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        component: LandingComponent
      },
      {
        path: 'login',
        component: LoginComponent
      },
      {
        path: 'register',
        component: RegisterComponent
      },
      {
        path: 'forgot-password',
        component: ForgotPasswordComponent
      },
      {
        path: 'first-time-login',
        component: FirstTimeLoginComponent
      },
      {
        path: 'change-password',
        component: ChangePasswordComponent
      }
    ]
  },
]

@NgModule({
  declarations: [
    LandingComponent,
    LoginComponent,
    LandingComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    AuthComponent,
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
export class AuthModule { }
