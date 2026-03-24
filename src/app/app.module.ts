import { BrowserModule } from '@angular/platform-browser';
import { Inject, NgModule,  CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { LayoutModule } from './views/layout/layout.module';
import { MatTableModule } from '@angular/material/table';
import { AppComponent } from './app.component';
import { ErrorPageComponent } from './views/pages/error-page/error-page.component';
import { HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';
import {HTTP_INTERCEPTORS, HttpClient, HttpClientModule} from "@angular/common/http";
import {AgmCoreModule} from "@agm/core";
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {CheckTokenValidityInterceptor} from "./shared/services/checkTokenValidity.interceptor";
import { CarouselModule } from 'ngx-owl-carousel-o';
import { Ng2TelInputModule } from 'ng2-tel-input';
import { APP_BASE_HREF_TOKEN } from './views/pages/mobile-banking/requests/constants';
import { APP_BASE_HREF } from '@angular/common';
import { ToastrModule,ToastrConfig, ToastrService } from 'ngx-toastr';
import { SettingsModalComponent } from './layout/settings-modal/settings-modal.component';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthInterceptor } from './shared/services/auth.interceptor';
import { AuthGuard } from './shared/services/auth.guard';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    ErrorPageComponent,
    SettingsModalComponent,
  ],
  imports: [
    BrowserModule,
    Ng2TelInputModule,
    NgbDatepickerModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    CarouselModule ,
    MatTableModule, 
    ToastrModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    LayoutModule,
    AgmCoreModule.forRoot({
      apiKey: "AIzaSyCeXaOKfJXQZuh-3wZmMmYSt5NruUJPVgU",
      libraries: ["places", "drawing", "geometry"]}),
  ],
  providers: [
    { provide: APP_BASE_HREF_TOKEN, useValue: '/tra-customer-portal-uat' }, 
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: CheckTokenValidityInterceptor,
    //   multi: true
    // },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    AuthGuard,
    {
      provide: HIGHLIGHT_OPTIONS,
      useValue: {
        coreLibraryLoader: () => import('highlight.js/lib/core'),
        languages: {
          xml: () => import('highlight.js/lib/languages/xml'),
          typescript: () => import('highlight.js/lib/languages/typescript'),
          scss: () => import('highlight.js/lib/languages/scss'),
        }
      }
    }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
