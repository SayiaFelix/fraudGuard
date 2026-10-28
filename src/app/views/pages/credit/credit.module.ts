import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CreditShellComponent } from './credit-shell.component';
import { CreditDashboardComponent } from './dashboard/credit-dashboard.component';
import { NewApplicationComponent } from './new-application/new-application.component';
import { ApplicationsComponent } from './applications/applications.component';
import { ApplicationDetailComponent } from './applications/application-detail.component';
import { DecisionQueueComponent } from './decision-queue/decision-queue.component';
import { LoanDecisionQueueComponent } from './decision-queue/loan-decision-queue.component';
import { LoanAssessmentComponent } from './workflow/loan-assessment.component';
import { CreditScoringComponent } from './credit-scoring/credit-scoring.component';
import { DecisionRulesComponent } from './decision-rules/decision-rules.component';
import { PolicySimulatorComponent } from './policy-simulator/policy-simulator.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { CreditReportsComponent } from './reports/credit-reports.component';
import { ModelMonitoringComponent } from './model-monitoring/model-monitoring.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { IntegrationsComponent } from './integrations/integrations.component';
import { CreditSettingsComponent } from './settings/credit-settings.component';
import { CreditBehaviourComponent } from './ops/credit-behaviour.component';

const routes: Routes = [
  {
    path: '',
    component: CreditShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CreditDashboardComponent, data: { greeting: true } },
      { path: 'applications/new', component: NewApplicationComponent,data:{ownHeader: true}  },
      { path: 'applications/:id', component: ApplicationDetailComponent, data: { ownHeader: true } },
      { path: 'applications', component: ApplicationsComponent, data: { ownHeader: true } },
      { path: 'alerts', component: DecisionQueueComponent, data: { ownHeader: true } },
      { path: 'decision-queue', component: LoanDecisionQueueComponent, data: { ownHeader: true } },
      { path: 'credit-scoring', component: CreditScoringComponent, data: { ownHeader: true } },
      { path: 'decision-rules', component: DecisionRulesComponent, data: { ownHeader: true } },
      { path: 'policy-simulator', component: PolicySimulatorComponent, data: { ownHeader: true } },
      { path: 'portfolio', component: PortfolioComponent, data: { ownHeader: true } },
      { path: 'reports', component: CreditReportsComponent, data: { title: 'Reports', subtitle: 'Download a CSV from the demo book' } },
      { path: 'model-monitoring', component: ModelMonitoringComponent, data: { ownHeader: true } },
      { path: 'audit-logs', component: AuditLogsComponent, data: { ownHeader: true } },
      { path: 'integrations', component: IntegrationsComponent, data: { title: 'Integrations', subtitle: 'Connectors stay paused until the JSON feed is ready' } },
      { path: 'settings', component: CreditSettingsComponent, data: { title: 'Settings', subtitle: 'Demo environment and decision cutoffs' } }
    ]
  }
];

@NgModule({
  declarations: [
    CreditShellComponent,
    CreditDashboardComponent,
    NewApplicationComponent,
    CreditBehaviourComponent,
    ApplicationsComponent,
    ApplicationDetailComponent,
    DecisionQueueComponent,
    LoanDecisionQueueComponent,
    LoanAssessmentComponent,
    CreditScoringComponent,
    DecisionRulesComponent,
    PolicySimulatorComponent,
    PortfolioComponent,
    CreditReportsComponent,
    ModelMonitoringComponent,
    AuditLogsComponent,
    IntegrationsComponent,
    CreditSettingsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    RouterModule.forChild(routes)
  ]
})
export class CreditModule {}
