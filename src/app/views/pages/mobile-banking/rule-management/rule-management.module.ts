import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RuleManagementComponent } from './rule-management.component';

@NgModule({
  declarations: [RuleManagementComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: RuleManagementComponent }])]
})
export class RuleManagementModule { }
