import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RiskScoringComponent } from './risk-scoring.component';

@NgModule({
  declarations: [RiskScoringComponent],
  imports: [CommonModule, RouterModule.forChild([{ path: '', component: RiskScoringComponent }])]
})
export class RiskScoringModule { }
