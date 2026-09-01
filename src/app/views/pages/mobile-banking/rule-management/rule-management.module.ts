import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RuleManagementComponent } from './rule-management.component';

@NgModule({
  declarations: [RuleManagementComponent],
  imports: [CommonModule,FormsModule, HttpClientModule,RouterModule.forChild([{ path: '', component: RuleManagementComponent }])]
})
export class RuleManagementModule { }
