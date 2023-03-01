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
import { JwtModule } from '@auth0/angular-jwt';

@NgModule({
  declarations: [
    LabelBooleanComponent,
    LabelCompletedComponent,
    LabelActiveComponent,
    LabelOnlineComponent,
    LabelPassedComponent,
    ConfirmDialogComponent,
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
  ],
  exports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    LabelBooleanComponent,
    LabelCompletedComponent,
    LabelActiveComponent,
    LabelOnlineComponent,
    LabelPassedComponent,
  ]
})
export class SharedModule {
  constructor() {
  }
}
