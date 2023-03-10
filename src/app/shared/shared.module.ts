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
import {ConfirmDialogComponent} from './components/confirm-dialog/confirm-dialog.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import {TranslateModule} from "@ngx-translate/core";
import {CustomNgxTable} from "./components/ngx-table/custom-ngx-table.component";
import {TableHeaderComponent} from "./components/table-header/table-header.component";
import {TableFiltersComponent} from "./components/table-filters/table-filters.component";


@NgModule({
  declarations: [
    LabelBooleanComponent,
    LabelCompletedComponent,
    LabelActiveComponent,
    LabelOnlineComponent,
    LabelPassedComponent,
    ConfirmDialogComponent,
    CustomNgxTable,
    TableHeaderComponent,
    TableFiltersComponent
  ],
  entryComponents: [
    LabelBooleanComponent,
    LabelCompletedComponent,
    LabelActiveComponent,
    LabelOnlineComponent,
    LabelPassedComponent,
    ConfirmDialogComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    NgxDatatableModule,
    TranslateModule,
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
    LabelOnlineComponent,
    LabelPassedComponent,
    CustomNgxTable,
    TableHeaderComponent,
    TableFiltersComponent
  ]
})
export class SharedModule {
  constructor() {
  }
}
