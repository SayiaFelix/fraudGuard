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
    link: '/eclectics/user/inbox',
    // roles: ['CIA', 'AuditUnit','Director']
  },

  {
    isTitle: true,
    label: 'AUDIT PROCESS',
    // roles: ['Auditor', 'CIA', 'AuditUnit','Director']
  },

  {
    label: 'Audit Management',
    icon: 'calendar', 
    link: '/eclectics/audit_management/audits',
    // roles: ['Auditor', 'CIA','Director']
  },
    {
    label: 'Fieldwork',
    icon: 'git-branch',
    link: '/eclectics/executions/fieldworks',
    // roles: ['Auditor', 'CIA','Director','External']
  },
  {
    label: 'Reporting',
    icon:'bar-chart',
    link: '/eclectics/analytic/reports',
    // roles: ['CIA', 'Auditor','Director']
  },
   {
    label: 'CAP Monitoring',
    icon: 'check-circle',
    link: '/eclectics/compliance/all',
    // roles: ['AuditUnit', 'CIA','Director']
  },

   {
    isTitle: true,
    label: 'ADMINISTRATION',
    // roles: ['CIA']
  },

  {
    label:'User Management',
    icon:'users',
    link: '/eclectics/user_managements/users',
    // roles: ['CIA'] 
  },
  {
    isTitle: true,
    label: 'SETTINGS',
  },
  {
    label: 'Settings', 
    icon: 'settings', 
    isSettings: true,
  },
  {
    label: 'Help Center',
    icon: 'help-circle', 
    link: '#', 
    isHelpCenter: true,
  },
  {
    label: 'Logout',
    icon: 'log-out',
    link: '#', 
    isLogout: true,
  }
];



