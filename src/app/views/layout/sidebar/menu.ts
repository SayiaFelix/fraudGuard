import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [

  {
    label: 'Dashboard',
    icon: 'home',
    link: '/dashboard',
  },
  {
    label: 'Inbox',
    icon: 'inbox',
    // link: '/fraudsentinelAi/user/inbox',
    // roles: ['CIA', 'AuditUnit','Director']
  },

  {
    isTitle: true,
    label: 'FRAUD INTELLIGENCE',
    // roles: ['Auditor', 'CIA', 'AuditUnit','Director']
  },

  {
    label: 'Fraud Alert',
    icon: 'alert-triangle', 
    link: '/fraudsentinelAi/transaction_management/fraud',
    // roles: ['Auditor', 'CIA','Director']
  },
  //   {
  //   label: 'Fieldwork',
  //   icon: 'git-branch',
  //   link: '/eclectics/executions/fieldworks',
  //   // roles: ['Auditor', 'CIA','Director','External']
  // },
  {
    label: 'Risk Analytics',
    icon:'bar-chart-2',
    // link: '/fraudsentinelAi/analytic/reports',
    // roles: ['CIA', 'Auditor','Director']
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
    // roles: ['CIA']
  },

  {
    label:'User Management',
    icon:'users',
    // link: '/fraudsentinelAi/user_managements/users',
    // roles: ['CIA'] 
  },
  // {
  //   isTitle: true,
  //   label: 'SETTINGS',
  // },
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



