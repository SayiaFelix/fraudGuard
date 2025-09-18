import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [

  {
    // profiles: ['CORPORATE_ADMIN'],
    label: 'Dashboard',
    icon: 'home',
    link: '/dashboard',
  },
  {
    // profiles: ['CORPORATE_ADMIN'],
    label: 'Inbox',
    icon: 'bell',
    link: '/eclectics/user/inbox'
  },
  {
    isTitle: true,
    label: 'MAIN MENU'
  },
  {
  //// profiles: ['CORPORATE_ADMIN'],
    label: 'Audit Management',
    icon: 'calendar', 
    link: '/eclectics/chatbot/user_bot',
    // subItems: [
    //     {
    //       // profiles: ['CORPORATE_ADMIN'],
    //       label: 'Planning',
    //       // icon: 'calendar',
    //       link: '/eclectics/chatbot/list-requests'
    //     },
    //     {
    //       // profiles: ['CORPORATE_ADMIN'],
    //       label: 'Observations',
    //       // icon: 'file-text',
    //       link: '/eclectics/chatbot/list-failed-registrations'
    //     },
        // {
        //   // profiles: ['CORPORATE_ADMIN'],
        //   label: 'Notifications',
        //   link: '/tra-client/customers/send-bulk-sms'
        // },
      // ]
  },
    {
    //  profiles:['CORPORATE_ADMIN'],
     label:'User Management',
     icon:'users',
     link: '/eclectics/analytics/people',
    //  subItems: [
    //   {
    //     profiles: ['CORPORATE_ADMIN'],
    //     label: 'Account Registration',
    //     subItems: [
    //       {
    //         profiles: ['CORPORATE_ADMIN'],
    //         label:'All Accounts',
    //         link:'/mobile-banking/accounts/list-accounts'
    //       },
    //       {
    //         profiles: ['CORPORATE_ADMIN'],
    //         label:'Pending Account Openings',
    //         link:'/mobile-banking/accounts/list-pending'
    //       },
    //       {
    //         profiles: ['CORPORATE_ADMIN'],
    //         label:'Failed Account Openings',
    //         link:'/mobile-banking/accounts/list-failed'
    //       },

    //     ]
    //   },]
    },

  {
    // profiles: ['CORPORATE_ADMIN'],
    label: 'Execution (Workflow)',
    icon: 'git-branch',
    link: '/eclectics/customer/livechats'
    // subItems: [
    //   {
    //     profiles: ['CORPORATE_ADMIN'],
    //     label: 'Inbox',
    //     link: '/tra-client/Users/list-users'
    //   },
    //   // {
    //   //   profiles: ['CORPORATE_ADMIN'],
    //   //   label: 'Roles',
    //   //   link: '/mobile-banking/rbac/all-roles'
    //   // },
    //   {
    //     profiles: ['CORPORATE_ADMIN'],
    //     label: 'Profiles',
    //     link: '/tra-client/rbac/all-profiles'
    //   }
    // ]
  },
  // {
  //   // profiles: ['CORPORATE_ADMIN'],
  //   label: 'Tickets',
  //   icon: 'tag',
  //   link: '/eclectics/customer/tickets',
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


    {
      //   profiles: ['CORPORATE_ADMIN'],
      label: 'MIS Reports',
      icon:'bar-chart',
      link: '/eclectics/analytic/all',
     

      //    subItems: [
      //     {
      //       profiles: ['CORPORATE_ADMIN'],
      //       label:'New Account',
      //       link:'/mobile-banking/accounts/linked-accounts'
      //     },
      //     // {
      //     //   profiles: ['CORPORATE_ADMIN'],
      //     //   label:'Approve Account',
      //     //   link:'/mobile-banking/accounts/account-registration/account-opening'
      //     // },
      //     //    {
      //     //   profiles: ['CORPORATE_ADMIN'],
      //     //   label:'Rejected Accounts',
      //     //   link:'/mobile-banking/accounts/account-registration/account-opening'
      //     // },
      //        {
      //       profiles: ['CORPORATE_ADMIN'],
      //       label:'Manage Accounts',
      //       link:'/mobile-banking/accounts/manage-accounts'
      //     },
      //        {
      //       profiles: ['CORPORATE_ADMIN'],
      //       label:'Blocked Accounts',
      //       link:'/mobile-banking/accounts/blocked-accounts'
      //     },
      //           {
      //       profiles: ['CORPORATE_ADMIN'],
      //       label:'Unblocked Accounts',
      //       link:'/mobile-banking/accounts/unblocked-accounts'
      //     },
      //     {
      //       profiles: ['CORPORATE_ADMIN'],
      //       label:'Close Accounts',
      //       link:'/mobile-banking/accounts/closed-accounts'
      //     },

      //   ]
      // }
  //    ]

  },

  
  {
  //// profiles: ['CORPORATE_ADMIN'],
    label: 'Compliance',
    icon: 'check-circle',
    link: '/eclectics/ai_analytics/ai_chat'
  //// subItems: [
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
{
    isTitle: true,
    label: 'SETTINGS'
  },
  {
    label: 'Settings', 
    icon: 'settings', 
    isSettings: true 
  },
  {
    label: 'Help Center',
    icon: 'help-circle', 
    link: '#', 
    isHelpCenter: true
  },
  {
    label: 'Logout',
    icon: 'log-out',
    link: '#', 
    isLogout: true
  }


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
  //   label: 'Chats',
  //   icon: 'settings',
  //   link: '/eclectics/setups/list-Regions'
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

