import {NgModule} from '@angular/core';
// import {ProductsComponent} from './list-products-categories/products.component';
// import {ViewProductComponent} from "./view-product/view-product.component";

import {SharedModule} from "../../../../shared/shared.module";
import {FeatherIconModule} from "../../../../core/feather-icon/feather-icon.module";
import {NgxDatatableModule} from "@swimlane/ngx-datatable";
import {TranslateModule} from "@ngx-translate/core";
// import {AddProductComponent} from "./add-product/add-product.component";
// import { AddProductSubitemComponent } from './add-product-subitem/add-product-subitem.component';

import { AccountsRoutingModule } from './accounts-routing';
import { ListRegisteredAccountsComponent } from './AccountRegistration/list-registered-accounts/list-registered-accounts.component';
import { AddAccountComponent } from './AccountRegistration/add-account/add-account.component';
import { ListPendingApprovalComponent } from './AccountRegistration/list-pending-approval/list-pending-approval.component';

import { ManageLinkingAccountsComponent } from './AccountLinking/manage-linking-accounts/manage-linking-accounts.component';
import { BlockedAccountsComponent } from './AccountLinking/blocked-accounts/blocked-accounts.component';
import { UnblockedAccountsComponent } from './AccountLinking/unblocked-accounts/unblocked-accounts.component';
import { ClosedAccountsComponent } from './AccountLinking/closed-accounts/closed-accounts.component';
import { NewLinkedAccountsComponent } from './new-linked-accounts/new-linked-accounts.component';
import {ListFailedApprovalComponent} from "./AccountRegistration/list-failed-approval/list-failed-approval.component";
import {ViewAccountComponent} from "./AccountRegistration/view-account/view-account.component";
import {ApproveAccountComponent} from "./AccountRegistration/approve-account/approve-account.component";


@NgModule({
    imports: [
        SharedModule,
        AccountsRoutingModule,
        FeatherIconModule,
        NgxDatatableModule,
        TranslateModule
    ],
  declarations: [
    ListRegisteredAccountsComponent,
    AddAccountComponent,
    ApproveAccountComponent,
    ListPendingApprovalComponent,
    ListFailedApprovalComponent,
    NewLinkedAccountsComponent,
    ManageLinkingAccountsComponent,
    BlockedAccountsComponent,
    UnblockedAccountsComponent,
    ClosedAccountsComponent,
    ViewAccountComponent
  ]
  ,
  entryComponents: [
    ViewAccountComponent,
    AddAccountComponent,
    ApproveAccountComponent
    // AddProductComponent,
    // AddProductSubitemComponent
  ],
})
export class AccountsModule {
}
