import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChannelMonitoringComponent } from './channel-monitoring/channel-monitoring.component';

const routes: Routes = [
  { path: '', component: ChannelMonitoringComponent }
];

@NgModule({
  declarations: [ChannelMonitoringComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgApexchartsModule,
    RouterModule.forChild(routes)
  ]
})
export class ChannelMonitoringModule {}
