import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    // profiles: ['CORPORATE_ADMIN'],
    label: 'DASHBOARD',
    icon: 'home',
    link: '/dashboard',
    // subItems: [
    //   {
    //     profiles: ['CORPORATE_ADMIN'],
    //     label: 'Dashboard',
    //     link: '/dashboard'
    //   },
      // {
      //   profiles: ['CORPORATE_ADMIN'],
      //   label: 'Chat( Comments )',
      //   link: '/mobile-banking/channels/ussd-ussd-channel-dashboard'
      // },
      // {
      //   profiles: ['CORPORATE_ADMIN'],
      //   label: 'Mobile Banking IB',
      //   link: '/mobile-banking/channels/ib-ussd-channel-dashboard'
      // },
      // {
      //   profiles: ['CORPORATE_ADMIN'],
      //   label: 'Mobile Banking APP',
      //   link: '/mobile-banking/channels/app-ussd-channel-dashboard'
      // },
    // ]
  },
  {
    // profiles: ['CORPORATE_ADMIN'],
    label: 'PROFILES',
    icon: 'bar-chart',
    link: '/eclectics/analytics/all-analytics'
    // subItems: [
    //   {
    //     profiles: ['CORPORATE_ADMIN'],
    //     label: 'All Standards',
    //     link: '/tra-client/standards/all-standards'
    //   },
    // ]
  },
  {
  //   // profiles: ['CORPORATE_ADMIN'],
    label: 'QUANTRA AI',
    icon: 'message-circle',
    link: '/eclectics/ai_analytics/ai_chat'
  //   // subItems: [
  //   //   // {
  //   //   //   // profiles: ['CORPORATE_ADMIN'],
  //   //   //   label: 'All Classifications',
  //   //   //   link: '/tra-client/customers/list-requests'
  //   //   // },
  //   //   // {
  //   //   //   profiles: ['CORPORATE_ADMIN'],
  //   //   //   label: 'Classification Results',
  //   //   //   link: '/tra-client/customers/list-failed-registrations'
  //   //   // },
  //   //   {
  //   //     // profiles: ['CORPORATE_ADMIN'],
  //   //     label: 'Notifications',
  //   //     link: '/tra-client/customers/send-bulk-sms'
  //   //   },
  //   // ]
  },
  // {
  //   // profiles: ['CORPORATE_ADMIN'],
  //   label: 'CUSTOMERS',
  //   icon: 'users',
  //   link: '/cyton/new_customer_analytics/new_customers'
  //   // subItems: [
  //   //   {
  //   //     profiles: ['CORPORATE_ADMIN'],
  //   //     label: 'Inbox',
  //   //     link: '/tra-client/Users/list-users'
  //   //   },
  //   //   // {
  //   //   //   profiles: ['CORPORATE_ADMIN'],
  //   //   //   label: 'Roles',
  //   //   //   link: '/mobile-banking/rbac/all-roles'
  //   //   // },
  //   //   {
  //   //     profiles: ['CORPORATE_ADMIN'],
  //   //     label: 'Profiles',
  //   //     link: '/tra-client/rbac/all-profiles'
  //   //   }
  //   // ]
  // },
  // {
  //   // profiles: ['CORPORATE_ADMIN'],
  //   label: 'BILLED',
  //   icon: 'file-text',
  //   link: '/cyton/analytic/all'
  //   // subItems: [
  //   //   {
  //   //     // profiles: ['CORPORATE_ADMIN'],
  //   //     label: 'All Requests',
  //   //     link: '/tra-client/requests/all'
  //   //   },
  //     // {
  //     //   // profiles: ['CORPORATE_ADMIN'],
  //     //   label: 'All Requests',
  //     //   link: '/tra-client/requests/all-accreditations'
  //     // },
  //   // ]
  // },

  // {
  //   //  profiles:['CORPORATE_ADMIN'],
  //    label:'LOGS',
  //    icon:'activity',
  //    link: '/cyton/analytics_logs/logs',
  //   //  subItems: [
  //   //   {
  //   //     profiles: ['CORPORATE_ADMIN'],
  //   //     label: 'Account Registration',
  //   //     subItems: [
  //   //       {
  //   //         profiles: ['CORPORATE_ADMIN'],
  //   //         label:'All Accounts',
  //   //         link:'/mobile-banking/accounts/list-accounts'
  //   //       },
  //   //       {
  //   //         profiles: ['CORPORATE_ADMIN'],
  //   //         label:'Pending Account Openings',
  //   //         link:'/mobile-banking/accounts/list-pending'
  //   //       },
  //   //       {
  //   //         profiles: ['CORPORATE_ADMIN'],
  //   //         label:'Failed Account Openings',
  //   //         link:'/mobile-banking/accounts/list-failed'
  //   //       },

  //   //     ]
  //   //   },]
  //   },
  //     // {
  //     //   profiles: ['CORPORATE_ADMIN'],
  //     //   label: 'Account Linking',

  //     //    subItems: [
  //     //     {
  //     //       profiles: ['CORPORATE_ADMIN'],
  //     //       label:'New Account',
  //     //       link:'/mobile-banking/accounts/linked-accounts'
  //     //     },
  //     //     // {
  //     //     //   profiles: ['CORPORATE_ADMIN'],
  //     //     //   label:'Approve Account',
  //     //     //   link:'/mobile-banking/accounts/account-registration/account-opening'
  //     //     // },
  //     //     //    {
  //     //     //   profiles: ['CORPORATE_ADMIN'],
  //     //     //   label:'Rejected Accounts',
  //     //     //   link:'/mobile-banking/accounts/account-registration/account-opening'
  //     //     // },
  //     //        {
  //     //       profiles: ['CORPORATE_ADMIN'],
  //     //       label:'Manage Accounts',
  //     //       link:'/mobile-banking/accounts/manage-accounts'
  //     //     },
  //     //        {
  //     //       profiles: ['CORPORATE_ADMIN'],
  //     //       label:'Blocked Accounts',
  //     //       link:'/mobile-banking/accounts/blocked-accounts'
  //     //     },
  //     //           {
  //     //       profiles: ['CORPORATE_ADMIN'],
  //     //       label:'Unblocked Accounts',
  //     //       link:'/mobile-banking/accounts/unblocked-accounts'
  //     //     },
  //     //     {
  //     //       profiles: ['CORPORATE_ADMIN'],
  //     //       label:'Close Accounts',
  //     //       link:'/mobile-banking/accounts/closed-accounts'
  //     //     },

  //     //   ]
  //     // }
  //    ]
  // },


  // {
  //   profiles: ['CORPORATE_ADMIN'],
  //   label: 'Channel Management',
  //   icon: 'airplay',
  //   subItems: [
  //     {
  //       profiles: ['CORPORATE_ADMIN'],
  //       label: 'Channels',
  //       link: '/mobile-banking/channels/all-channels'
  //     },
  //     // {
  //     //   profiles: ['CORPORATE_ADMIN'],
  //     //   label: 'Mobile Banking USSD',
  //     //   link: '/mobile-banking/channels/ussd-ussd-channel-dashboard'
  //     // },
  //     // {
  //     //   profiles: ['CORPORATE_ADMIN'],
  //     //   label: 'Mobile Banking IB',
  //     //   link: '/mobile-banking/channels/ib-ussd-channel-dashboard'
  //     // },
  //     // {
  //     //   profiles: ['CORPORATE_ADMIN'],
  //     //   label: 'Mobile Banking APP',
  //     //   link: '/mobile-banking/channels/app-ussd-channel-dashboard'
  //     // },
  //   ]
  // },
  //   {
  //   // profiles: ['CORPORATE_ADMIN'],
  //   label: 'CHATS',
  //   icon: 'settings',
  //   link: '/tra-client/setups/list-Regions'
  //   // subItems: [
  //   //   {
  //   //     profiles: ['CORPORATE_ADMIN'],
  //   //     label: 'Regions',
  //   //     link: '/mobile-banking/setups/list-Regions'
  //   //   },
  //   //   {
  //   //     profiles: ['CORPORATE_ADMIN'],
  //   //     label: 'Branches',
  //   //     link: '/mobile-banking/setups/list-branches'
  //   //   },
  //   //   {
  //   //     profiles: ['CORPORATE_ADMIN'],
  //   //     label: 'ATMs',
  //   //     link: '/mobile-banking/setups/list-services'
  //   //   },
  //   //   {
  //   //     profiles: ['CORPORATE_ADMIN'],
  //   //     label: 'Services',
  //   //     link: '/mobile-banking/setups/list-services'
  //   //   },
  //   // ]
  // },
  // {
  //   profiles: ['CORPORATE_ADMIN'],
  //   label:'AUDIT TRAIL',
  //   icon:'file-text',
  //   subItems: [
  //     {
  //       profiles: ['CORPORATE_ADMIN'],
  //       label: 'Audit Logs',
  //       link:'/mobile-banking/audit-trail/list-audits',
  //     },
  //     {
  //       profiles: ['CORPORATE_ADMIN'],
  //       label: 'System Logs',
  //       link:'/mobile-banking/audit-trail/list-audits',
  //     },
  //   ]
  // },


  // {
  //   profiles: ['CORPORATE_ADMIN'],
  //   label: 'Workflows Module',
  //   icon: 'briefcase',
  //   subItems: [
  //     {
  //       profiles: ['CORPORATE_ADMIN'],
  //       label: 'Workflows',
  //       link: '/mobile-banking/workflows/list-workflow-menu'
  //     }
  //   ]
  // }
  ]

