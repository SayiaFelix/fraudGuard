import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CaseManagementComponent } from './case-management.component';

@NgModule({
  declarations: [CaseManagementComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: CaseManagementComponent }])
  ]
})
export class CaseManagementModule { }
