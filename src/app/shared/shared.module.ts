import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LabelBooleanComponent } from './components/label-boolean/label-boolean.component';
import { LabelCompletedComponent } from './components/label-completed/label-completed.component';
import { LabelActiveComponent } from './components/label-active/label-active.component';
import { LabelOnlineComponent } from './components/label-online/label-online.component';
import { LabelPassedComponent } from './components/label-passed/label-passed.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TranslateModule } from '@ngx-translate/core';
import { CustomNgxTable } from './components/ngx-table/custom-ngx-table.component';
import { TableHeaderComponent } from './components/table-header/table-header.component';
import { TableFiltersComponent } from './components/table-filters/table-filters.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { NotificationModalComponent } from './components/notification-modal/notification-modal.component';
import { LabelSystemCustomRoleComponent } from './components/label-system-custom-role/label-system-custom-role.component';
import { LabelTaskStatusComponent } from './components/label-task-status/label-task-status.component';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import {ChannelDetailsWrapper} from "./services/channelDetailsWrapper";
import {CompareImageComponent} from "./components/compare-image-component/compare-image.component";
import { SettingsModalComponent } from './settings-modal/settings-modal.component';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
};

@NgModule({
  declarations: [
    LabelBooleanComponent,
    LabelCompletedComponent,
    LabelActiveComponent,
    LabelOnlineComponent,
    LabelPassedComponent,
    LabelSystemCustomRoleComponent,
    LabelTaskStatusComponent,
    ConfirmDialogComponent,
    NotificationModalComponent,
    CustomNgxTable,
    TableHeaderComponent,
    TableFiltersComponent,
    CompareImageComponent,
    SettingsModalComponent
  ],
  entryComponents: [
    LabelBooleanComponent,
    LabelCompletedComponent,
    LabelActiveComponent,
    LabelSystemCustomRoleComponent,
    LabelTaskStatusComponent,
    LabelOnlineComponent,
    LabelPassedComponent,
    ConfirmDialogComponent,
    NotificationModalComponent,
    CompareImageComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxDatatableModule,
    TranslateModule,
    NgxPaginationModule,
    PerfectScrollbarModule,
    BsDatepickerModule.forRoot(),
  ],
  exports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    NgbModule,
    LabelBooleanComponent,
    LabelCompletedComponent,
    LabelActiveComponent,
    LabelSystemCustomRoleComponent,
    LabelTaskStatusComponent,
    LabelOnlineComponent,
    LabelPassedComponent,
    CustomNgxTable,
    TableHeaderComponent,
    TableFiltersComponent,
    SettingsModalComponent
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG,
    },
  ],
})
export class SharedModule {
  constructor() {}
}
