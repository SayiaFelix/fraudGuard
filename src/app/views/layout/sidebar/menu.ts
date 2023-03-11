import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Main',
    isTitle: true
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Dashboard',
    icon: 'home',
    link: '/dashboard'
  },

  {
    profiles: ['SUPER_ADMIN'],
    label: 'Products',
    isTitle: true
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Products',
    icon: 'home',
    link: '/mobile-banking/products/list-customers'
  },

  {
    profiles: ['SUPER_ADMIN'],
    label: 'Customers Module',
    isTitle: true
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Customers',
    icon: 'file-text',
    link: '/mobile-banking/customers/list-customers'
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Failed Registrations',
    icon: 'home',
    link: '/mobile-banking/customers/list-failed-registrations'
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Send Bulk SMS',
    icon: 'message',
    link: '/mobile-banking/customers/send-bulk-sms'
  },

  {
    profiles: ['SUPER_ADMIN'],
    label: 'Setup',
    isTitle: true,
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Regions',
    icon: 'file-text',
    link: '/mobile-banking/setups/list-Regions'
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Branches',
    icon: 'file-text',
    link: '/mobile-banking/setups/list-branches'
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'ATMs',
    icon: 'file-text',
    link: '/mobile-banking/setups/list-atms'
  },

  {
    profiles: ['SUPER_ADMIN'],
    label: 'User Management',
    isTitle: true
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Users',
    icon: 'file-text',
    link: '/mobile-banking/Users/list-users'
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Roles',
    icon: 'home',
    link: '/mobile-banking/rbac/all-roles'
  },
  {
    profiles: ['SUPER_ADMIN'],
    label: 'Profiles',
    icon: 'home',
    link: '/mobile-banking/rbac/all-profiles'
  }]

