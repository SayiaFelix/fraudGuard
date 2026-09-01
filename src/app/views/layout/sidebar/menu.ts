import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [

  {
    label: 'Dashboard',
    icon: 'home',
    link: '/dashboard',
  },
  {
    label: 'Customer Profiling',
    icon: 'user-check',
    link: '/fraudsentinelAi/transaction_management/customer-profiling'
  },

  {
    isTitle: true,
    label: 'FRAUD INTELLIGENCE',
    // roles: ['Auditor', 'CIA', 'AuditUnit','Director']
  },
  {
    label: 'Transactions',
    icon: 'activity',
    link: '/fraudsentinelAi/transaction_management/fraud/transactions'
  },
  {
    label: 'Rule Management',
    icon: 'layers',
    link: '/fraudsentinelAi/transaction_management/rule-management'
  },
  {
    label: 'Case Management',
    icon: 'clipboard',
    link: '/fraudsentinelAi/transaction_management/case-management'
  },
  {
    label: 'AI Insights',
    icon: 'zap',
    link: '/fraudsentinelAi/transaction_management/fraud/ai-insights'
  },
  {
    label: 'Investigation Graph',
    icon: 'bar-chart-2',
    link: '/fraudsentinelAi/transaction_management/fraud/investigation-graph'
  },
  //   {
  //   label: 'Fieldwork',
  //   icon: 'git-branch',
  //   link: '/eclectics/executions/fieldworks',
  //   // roles: ['Auditor', 'CIA','Director','External']
  // },
  // Commented out per module rework - Risk Analytics temporarily removed
  // {
  //   label: 'Risk Analytics',
  //   icon:'bar-chart-2',
  //   // link: '/fraudsentinelAi/analytic/reports',
  //   // roles: ['CIA', 'Auditor','Director']
  // },

  
  {
    label: 'Alerts',
    icon: 'inbox',
    link: '/fraudsentinelAi/transaction_management/alerts',
    // roles: ['CIA', 'AuditUnit','Director']
  },
  //  {
  //   label: 'CAP Monitoring',
  //   icon: 'check-circle',
  //   link: '/eclectics/compliance/all',
  //   // roles: ['AuditUnit', 'CIA','Director']
  // },

   {
    isTitle: true,
    label: 'ADMINISTRATION',
    roles: ['admin']
  },

  {
    label:'User Management',
    icon:'users',
    link: '/fraudsentinelAi/user_managements/users',
    roles: ['admin'] 
  },
  {
    isTitle: true,
    label: 'SETTINGS',
  },
  // {
  //   label: 'Settings', 
  //   icon: 'settings', 
  //   isSettings: true,
  // },
  // {
  //   label: 'Help Center',
  //   icon: 'help-circle', 
  //   link: '#', 
  //   isHelpCenter: true,
  // },
  {
    label: 'Logout',
    icon: 'log-out',
    link: '#', 
    isLogout: true,
  }
];



