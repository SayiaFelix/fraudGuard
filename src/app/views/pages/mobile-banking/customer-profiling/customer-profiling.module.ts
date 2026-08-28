import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomerProfilingComponent } from './customer-profiling.component';

@NgModule({
  declarations: [CustomerProfilingComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: CustomerProfilingComponent }])]
})
export class CustomerProfilingModule { }
