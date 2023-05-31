import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import { ListPendingApprovalComponent } from './AccountRegistration/list-pending-approval/list-pending-approval.component';
import { ListRegisteredAccountsComponent } from './AccountRegistration/list-registered-accounts/list-registered-accounts.component';
import { ManageLinkingAccountsComponent } from './AccountLinking/manage-linking-accounts/manage-linking-accounts.component';
import { BlockedAccountsComponent } from './AccountLinking/blocked-accounts/blocked-accounts.component';
import { UnblockedAccountsComponent } from './AccountLinking/unblocked-accounts/unblocked-accounts.component';
import { ClosedAccountsComponent } from './AccountLinking/closed-accounts/closed-accounts.component';
import { NewLinkedAccountsComponent } from './new-linked-accounts/new-linked-accounts.component';
import {ListFailedApprovalComponent} from "./AccountRegistration/list-failed-approval/list-failed-approval.component";
import {ViewAccountComponent} from "./AccountRegistration/view-account/view-account.component";


// import {ViewProductComponent} from './list-products/view-customer/view-customer.component';

const routes: Routes = [

  {
    path: 'list-accounts',
    component: ListRegisteredAccountsComponent
  },
  {
    path:'list-pending',
    component:ListPendingApprovalComponent

  },
  {
    path:'list-failed',
    component:ListFailedApprovalComponent
  },
  {
    path: 'linked-accounts',
    component: NewLinkedAccountsComponent
  },
  {
    path: 'manage-accounts',
    component: ManageLinkingAccountsComponent
  },
  {
    path: 'blocked-accounts',
    component: BlockedAccountsComponent
  },
  {
    path: 'unblocked-accounts',
    component: UnblockedAccountsComponent
  },
  {
    path: 'closed-accounts',
    component: ClosedAccountsComponent
  },
  {
    path: 'account/:id',
    component: ViewAccountComponent
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountsRoutingModule {
}
