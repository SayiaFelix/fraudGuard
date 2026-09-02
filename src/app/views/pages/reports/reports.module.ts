import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FraudReportsComponent } from './fraud-reports/fraud-reports.component';

const routes: Routes = [
  { path: '', redirectTo: 'fraud', pathMatch: 'full' },
  { path: 'fraud', component: FraudReportsComponent }
];

@NgModule({
  declarations: [FraudReportsComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgApexchartsModule,
    RouterModule.forChild(routes)
  ]
})
export class ReportsModule {}
