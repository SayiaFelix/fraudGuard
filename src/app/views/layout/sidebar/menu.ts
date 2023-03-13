import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Main',
    isTitle: true
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Dashboard',
    icon: 'home',
    link: '/dashboard'
  },

  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Products',
    isTitle: true
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Products',
    icon: 'home',
    link: '/mobile-banking/products/list-customers'
  },

  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Customers Module',
    isTitle: true
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Customers',
    icon: 'file-text',
    link: '/mobile-banking/customers/list-customers'
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Failed Registrations',
    icon: 'home',
    link: '/mobile-banking/customers/list-failed-registrations'
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Send Bulk SMS',
    icon: 'home',
    link: '/mobile-banking/customers/send-bulk-sms'
  },

  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Setup',
    isTitle: true,
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Regions',
    icon: 'file-text',
    link: '/mobile-banking/setups/list-Regions'
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Branches',
    icon: 'file-text',
    link: '/mobile-banking/setups/list-branches'
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'ATMs',
    icon: 'file-text',
    link: '/mobile-banking/setups/list-atms'
  },

  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'User Management',
    isTitle: true
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Users',
    icon: 'file-text',
    link: '/mobile-banking/Users/list-users'
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Roles',
    icon: 'home',
    link: '/mobile-banking/rbac/all-roles'
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Profiles',
    icon: 'home',
    link: '/mobile-banking/rbac/all-profiles'
  }]

