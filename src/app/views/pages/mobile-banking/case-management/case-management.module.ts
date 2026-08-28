import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CaseManagementComponent } from './case-management.component';

@NgModule({
  declarations: [CaseManagementComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: CaseManagementComponent }])]
})
export class CaseManagementModule { }
