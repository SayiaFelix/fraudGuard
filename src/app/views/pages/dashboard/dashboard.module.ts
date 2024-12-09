import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FeatherIconModule } from 'src/app/core/feather-icon/feather-icon.module';
import { NgbDropdownModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';

// Ng-ApexCharts
import { NgApexchartsModule } from "ng-apexcharts";
import { DashboardComponent } from './dashboard.component';
import {TranslateModule} from "@ngx-translate/core";
import { Ng2TelInputModule } from 'ng2-tel-input';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  }
]

@NgModule({
  declarations: [DashboardComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        FormsModule,
        FeatherIconModule,
        Ng2TelInputModule,
        ReactiveFormsModule,
        NgbDropdownModule,
        NgbDatepickerModule,
        NgApexchartsModule,
        TranslateModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardModule { }
