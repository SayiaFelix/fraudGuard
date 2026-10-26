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
import { AlertsComponent } from './alerts/alerts.component';
import { CaseManagementComponent } from './case-management/case-management.component';
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
      { path: 'applications/new', component: NewApplicationComponent, data: { title: 'New application', subtitle: 'Score a request on the demo scorecard' } },
      { path: 'applications/:id', component: ApplicationDetailComponent, data: { title: 'Application', subtitle: 'Score, reasons, and case notes' } },
      { path: 'applications', component: ApplicationsComponent, data: { title: 'Applications', subtitle: 'Origination book and decision outcomes' } },
      { path: 'alerts', component: AlertsComponent, data: { ownHeader: true } },
      { path: 'case-management', component: AlertsComponent, data: { ownHeader: true } },
      { path: 'decision-queue', component: DecisionQueueComponent, data: { title: 'Decision Queue', subtitle: 'Referred applications waiting for a decision' } },
      { path: 'credit-scoring', component: CreditScoringComponent, data: { title: 'Credit scoring', subtitle: 'Retail scorecard v3.2' } },
      { path: 'decision-rules', component: DecisionRulesComponent, data: { title: 'Decision rules', subtitle: 'Policy that sits on top of the score' } },
      { path: 'policy-simulator', component: PolicySimulatorComponent, data: { title: 'Policy simulator', subtitle: 'See who would move if the cutoffs change' } },
      { path: 'portfolio', component: PortfolioComponent, data: { title: 'Portfolio analytics', subtitle: 'Where the book is concentrated' } },
      { path: 'reports', component: CreditReportsComponent, data: { ownHeader: true } },
      { path: 'model-monitoring', component: ModelMonitoringComponent, data: { title: 'Model monitoring', subtitle: 'Gini, KS, and population stability' } },
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
    ApplicationsComponent,
    ApplicationDetailComponent,
    DecisionQueueComponent,
    AlertsComponent,
    CaseManagementComponent,
    CreditScoringComponent,
    DecisionRulesComponent,
    PolicySimulatorComponent,
    PortfolioComponent,
    CreditReportsComponent,
    ModelMonitoringComponent,
    AuditLogsComponent,
    IntegrationsComponent,
    CreditSettingsComponent,
    CreditBehaviourComponent
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
