import { MenuItem } from './menu.model';

// Fraud Guard navigation is retained and commented out.
// The live menu is the Eclectics credit decisioning workspace.
// export const MENU: MenuItem[] = [
//   { label: 'Dashboard', icon: 'home', link: '/dashboard' },
//   { label: 'Customer Profiling', icon: 'user-check', link: '/fraudsentinelAi/transaction_management/customer-profiling' },
//   { isTitle: true, label: 'FRAUD INTELLIGENCE' },
//   { label: 'Transactions Feed', icon: 'activity', link: '/fraudsentinelAi/transaction_management/fraud/transactions' },
//   { label: 'Rule Management', icon: 'layers', link: '/fraudsentinelAi/transaction_management/rule-management' },
//   { label: 'Case Management', icon: 'clipboard', link: '/fraudsentinelAi/transaction_management/case-management' },
//   { label: 'Alerts Management', icon: 'inbox', link: '/fraudsentinelAi/transaction_management/alerts' },
//   { label: 'Investigation Graph', icon: 'git-branch', link: '/fraudsentinelAi/transaction_management/fraud/investigation-graph' },
//   { label: 'AI Insights', icon: 'zap', link: '/fraudsentinelAi/transaction_management/fraud/ai-insights' },
//   { isTitle: true, label: 'ADMINISTRATION', roles: ['admin'] },
//   { label: 'User Management', icon: 'users', link: '/fraudsentinelAi/user_managements/users', roles: ['admin'] },
//   { label: 'Channel Monitoring', icon: 'radio', roles: ['admin'], link: '/channel-monitoring' },
//   { label: 'Reports & Analytics', icon: 'pie-chart', roles: ['admin'], link: '/reports' },
//   { isTitle: true, label: 'SETTINGS' },
//   { label: 'Logout', icon: 'log-out', link: '#', isLogout: true },
// ];

export const MENU: MenuItem[] = [
  { label: 'Dashboard', icon: 'home', link: '/dashboard', exact: true },

  { isTitle: true, label: 'Workspace' },
  { label: 'Ingestion', icon: 'plus-circle', link: '/applications/new', exact: true },
  {
    label: 'Applications',
    icon: 'file-text',
    link: '/applications',
    exact: true,
    badge: { text: 124, variant: 'uba' }
  },
  { label: 'Decision Queue', icon: 'inbox', link: '/decision-queue', exact: true, badge: { text: 8, variant: 'uba' } },

  { isTitle: true, label: 'Risk & Decisioning' },
  { label: 'Channel Simulator', icon: 'smartphone', link: '/credit-scoring', exact: true },
  { label: 'Decision Rules', icon: 'sliders', link: '/decision-rules', exact: true },
  { label: 'Policy Simulator', icon: 'shuffle', link: '/policy-simulator', exact: true },

  { isTitle: true, label: 'Insights' },
  { label: 'Portfolio Analytics', icon: 'pie-chart', link: '/portfolio', exact: true },

  { isTitle: true, label: 'Administration' },
  { label: 'Alerts', icon: 'bell', link: '/alerts', exact: true, badge: { text: 8, variant: 'uba' } },
  { label: 'Audit Logs', icon: 'shield', link: '/audit-logs', exact: true },
  // { label: 'Integrations', icon: 'link', link: '/integrations', exact: true },
  { label: 'Model Monitoring', icon: 'activity', link: '/model-monitoring', exact: true },
  { label: 'Log out', icon: 'log-out', isLogout: true }
];
