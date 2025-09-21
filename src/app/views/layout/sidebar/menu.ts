import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [

  {
    label: 'Dashboard',
    icon: 'home',
    link: '/dashboard',
    // roles: ['Auditor', 'CIA', 'AuditUnit']
  },
  {
    label: 'Inbox',
    icon: 'inbox',
    link: '/eclectics/user/inbox',
    // roles: ['CIA', 'AuditUnit']
  },
  {
    isTitle: true,
    label: 'MAIN MENU',
    roles: ['Auditor', 'CIA', 'AuditUnit']
  },
  {
    label: 'Audit Management',
    icon: 'calendar', 
    link: '/eclectics/audit_management/audits',
    roles: ['Auditor', 'CIA']
  },
    {
    label: 'Audit Execution',
    icon: 'git-branch',
    link: '/eclectics/executions/workflows',
    roles: ['Auditor', 'CIA'] // workflow part of execution
  },
  {
    label:'User Management',
    icon:'users',
    link: '/eclectics/user_managements/users',
    roles: ['CIA'] // CIA can manage users
  },

  {
    label: 'MIS Reports',
    icon:'bar-chart',
    link: '/eclectics/analytic/reports',
    // roles: ['CIA'] // only CIA
  },
  {
    label: 'Compliance',
    icon: 'check-circle',
    link: '/eclectics/compliance/all',
    roles: ['AuditUnit']
  },

  {
    isTitle: true,
    label: 'SETTINGS',
    // roles: ['Auditor', 'CIA', 'AuditUnit']
  },
  {
    label: 'Settings', 
    icon: 'settings', 
    isSettings: true,
    // roles: ['Auditor', 'CIA', 'AuditUnit']
  },
  {
    label: 'Help Center',
    icon: 'help-circle', 
    link: '#', 
    isHelpCenter: true,
    // roles: ['Auditor', 'CIA', 'AuditUnit']
  },
  {
    label: 'Logout',
    icon: 'log-out',
    link: '#', 
    isLogout: true,
    // roles: ['Auditor', 'CIA', 'AuditUnit']
  }
];
