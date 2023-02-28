import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import {ReactiveFormsModule} from "@angular/forms";
import {FeatherIconModule} from "../../../core/feather-icon/feather-icon.module";
import {SharedModule} from "../../../shared/shared.module";
import {MobileBankingComponent} from "./mobile-banking.component";
import {NgxDatatableComponent} from "./ngx-datatable/ngx-datatable.component";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";

const routes: Routes = [
  {
    path: '',
    component: MobileBankingComponent,
    children: [
      {
        path: '',
        redirectTo: 'sample-table',
        pathMatch: 'full'
      },
      {
        path: 'sample-table',
        component: NgxDatatableComponent
      }
    ]
  },
]

@NgModule({
  declarations: [
    MobileBankingComponent,
    NgxDatatableComponent
    ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    ReactiveFormsModule,
    FeatherIconModule,
    NgxDatatableModule
  ]
})
export class MobileBankingModule { }
