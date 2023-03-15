import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Main',
    icon: 'home',
    subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Dashboard',
        link: '/dashboard'
      },
    ]
  },

  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Products',
    icon: 'home',
    subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Products',
        link: '/mobile-banking/products/list-ussd'
      },
    ]
  },

  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Customers Module',
    icon: 'home',
    subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Customers',
        link: '/mobile-banking/customers/list-ussd'
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Failed Registrations',
        link: '/mobile-banking/customers/list-internet-banking'
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Send Bulk SMS',
        link: '/mobile-banking/customers/send-bulk-sms'
      },
    ]
  },


  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Channel Management',
    icon: 'home',
    subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'USSD',
        link: '/mobile-banking/channels/list-ussd'
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Internet Banking',
        link: '/mobile-banking/channels/list-internet-banking'
      },
      {
        profiles: ['CORPORATE_ADMIN', 'ADMIN'],
        label: 'Mobile App',
        link: '/mobile-banking/channels/list-mobile-app'
      },
    ]
  },


  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Setup',
    icon: 'file-text',
    subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Regions',
        link: '/mobile-banking/setups/list-Regions'
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Branches',
        link: '/mobile-banking/setups/list-branches'
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'ATMs',
        link: '/mobile-banking/setups/list-atms'
      },
    ]
  },

  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'User Management',
    icon: 'file-text',
    subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Users',
        link: '/mobile-banking/Users/list-users'
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Roles',
        link: '/mobile-banking/rbac/all-roles'
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Profiles',
        link: '/mobile-banking/rbac/all-profiles'
      }
    ]
  }
  ]

