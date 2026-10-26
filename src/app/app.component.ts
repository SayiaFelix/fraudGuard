import { Component, OnInit } from '@angular/core';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'nobleui-angular';

  constructor(translate: TranslateService) {
    translate.addLangs(['en', 'kis']);
    translate.setDefaultLang('en');
    translate.use('en');
    document.body.classList.add('uba-credit');
    localStorage.setItem('userDisplayName', 'Demo User');
    localStorage.setItem('userTitle', 'Bank Officer');
    localStorage.setItem('userRole', 'analyst');
    localStorage.setItem('userEmail', 'demo.user@eclectics.io');
    localStorage.setItem('isLoggedin', 'true');
    localStorage.setItem('access_token', 'frontend-demo-token');
  }

  ngOnInit(): void {}

}
