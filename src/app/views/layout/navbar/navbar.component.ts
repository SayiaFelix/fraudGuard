import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Inject,
  Renderer2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/shared/services/http.service';
import { map, Observable } from 'rxjs';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  userData$: Observable<any>;
  companyEmail: string;
  companyPhone: string;
  companyRegistrationDate: string;
  country: string;
  taxPin: string;
  logo: string;

  // internationalization management
  selectedLanguage: any = "English";
  selectedLanguageFlag: any = "assets/images/flags/us.svg";

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,

    private translate: TranslateService,

    private router: Router,
    private httpService: HttpService
  ) {}

  ngOnInit(): void {
    this.userData$ = this.httpService.mobileBankingGetUserDetails().pipe(
      map((resp) => {
        console.log(resp);
        if (resp) {
          this.companyEmail = resp['companyEmail'];
          this.companyPhone = resp['companyPhone'];
          this.companyRegistrationDate = resp['companyRegistrationDate'];
          this.country = resp['country'];
          this.taxPin = resp['taxPin'];
          this.logo = 'https://images.unsplash.com/photo-1517404215738-15263e9f9178?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80';
          return resp;
        }
      })
    );
  }

  /**
   * Sidebar toggle on hamburger button click
   */
  toggleSidebar(e: Event) {
    e.preventDefault();
    this.document.body.classList.toggle('sidebar-open');
  }

  /**
   * Logout
   */
  onLogout(e: Event) {
    e.preventDefault();
    localStorage.clear();
    if (!localStorage.getItem('isLoggedin')) {
      this.router.navigate(['/auth/login']);
    }
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);

    if (lang === "en"){
      this.selectedLanguage = "English";
      this.selectedLanguageFlag = "assets/images/flags/us.svg";
    } else if (lang === "kis") {
      this.selectedLanguage = "Kiswahili";
      this.selectedLanguageFlag = "assets/images/flags/es.svg";
    }
  }
}
