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
  }

  ngOnInit(): void {}

}
