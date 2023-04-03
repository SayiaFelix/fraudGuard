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
    label: 'Requests',
    icon: 'home',
    subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'View All Requests',
        link: '/mobile-banking/requests/list-requests'
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
        link: '/mobile-banking/products/list-requests'
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
        link: '/mobile-banking/customers/list-requests'
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
     profiles:['CORPORATE_ADMIN'],
     label:'Accounts',
     icon:'home',
     subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Account Registration',
        subItems: [
          {
            profiles: ['CORPORATE_ADMIN'],
            label:'Registered Accounts',
            link:'/mobile-banking/accounts/list-accounts'
          },
          {
            profiles: ['CORPORATE_ADMIN'],
            label:'Approve Account ',
            link:'/mobile-banking/accounts/list-pending'
          },

        ]
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Account Linking',

         subItems: [
          {
            profiles: ['CORPORATE_ADMIN'],
            label:'New Account',
            link:'/mobile-banking/accounts/linked-accounts'
          },
          {
            profiles: ['CORPORATE_ADMIN'],
            label:'Approve Account',
            link:'/mobile-banking/accounts/account-registration/account-opening'
          },
             {
            profiles: ['CORPORATE_ADMIN'],
            label:'Rejected Accounts',
            link:'/mobile-banking/accounts/account-registration/account-opening'
          },
             {
            profiles: ['CORPORATE_ADMIN'],
            label:'Manage Accounts',
            link:'/mobile-banking/accounts/manage-accounts'
          },
             {
            profiles: ['CORPORATE_ADMIN'],
            label:'Blocked Accounts',
            link:'/mobile-banking/accounts/blocked-accounts'
          },
                {
            profiles: ['CORPORATE_ADMIN'],
            label:'Unblocked Accounts',
            link:'/mobile-banking/accounts/unblocked-accounts'
          },
          {
            profiles: ['CORPORATE_ADMIN'],
            label:'Close Accounts',
            link:'/mobile-banking/accounts/closed-accounts'
          },

        ]
      }
     ]
  },


  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Channel Management',
    icon: 'home',
    subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Mobile Banking USSD',
        link: '/mobile-banking/channels/list-requests'
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Mobile Banking Internet Banking',
        link: '/mobile-banking/channels/list-internet-banking'
      },
      {
        profiles: ['CORPORATE_ADMIN', 'ADMIN'],
        label: 'Mobile Banking Mobile App',
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
  },
  {
    profiles: ['CORPORATE_ADMIN'],
    label:'AUDIT TRAIL',
    icon:'file-text',
    subItems: [
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Audit Logs',
        link:'/mobile-banking/audit-trail/list-audits',
      },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'System Logs',
        link:'/mobile-banking/audit-trail/list-audits',
      },
    ]
  },


  {
    profiles: ['CORPORATE_ADMIN'],
    label: 'Workflows Module',
    icon: 'file-text',
    subItems: [
      // {
      //   profiles: ['CORPORATE_ADMIN'],
      //   label: 'Workflows',
      //   link: '/mobile-banking/workflows/list-workflow-menu'
      // },
      {
        profiles: ['CORPORATE_ADMIN'],
        label: 'Workflows',
        link: '/mobile-banking/workflows/test'
      }
    ]
  }
  ]

