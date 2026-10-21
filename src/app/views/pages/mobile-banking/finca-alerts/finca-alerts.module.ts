import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FincaAlertsComponent } from './finca-alerts.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [FincaAlertsComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: FincaAlertsComponent }])
  ]
})
export class FincaAlertsModule { }
