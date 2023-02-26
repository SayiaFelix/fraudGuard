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

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
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
      }
    ]
  },
]

@NgModule({
  declarations: [LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    AuthComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    ReactiveFormsModule,
    FeatherIconModule
  ]
})
export class AuthModule { }
