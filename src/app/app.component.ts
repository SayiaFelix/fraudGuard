import { Component, OnInit } from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import { officerDisplayName } from './shared/services/auth.service';

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
    this.restoreSignedInOfficer();
  }

  private restoreSignedInOfficer(): void {
    const raw = sessionStorage.getItem('uba_demo_user');
    if (!raw) {
      if (localStorage.getItem('userDisplayName') === 'Demo User') {
        localStorage.removeItem('userDisplayName');
        localStorage.removeItem('userEmail');
      }
      return;
    }
    try {
      const user = JSON.parse(raw);
      const loginId = String(user?.email || user?.username || '').trim();
      if (!loginId) {
        return;
      }
      localStorage.setItem('userDisplayName', officerDisplayName(user, loginId));
      localStorage.setItem('userEmail', loginId);
      localStorage.setItem('userName', loginId);
      localStorage.setItem('userTitle', 'Bank Officer');
      localStorage.setItem('userRole', user?.role || 'analyst');
      localStorage.setItem('isLoggedin', 'true');
      localStorage.setItem('access_token', 'frontend-demo-token');
    } catch {
      sessionStorage.removeItem('uba_demo_user');
    }
  }

  ngOnInit(): void {}

}
