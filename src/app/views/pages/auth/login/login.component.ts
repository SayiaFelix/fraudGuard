import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CustomValidators } from 'ngx-custom-validators';
import { HttpParams } from '@angular/common/http';
import { HttpService } from '../../../../shared/services/http.service';
import {catchError, concat, Observable, of} from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  returnUrl: any;
  public form: FormGroup;
  public showingPassword = false;
  inputType = 'password';

  loginResponse$: Observable<any>;
  userDataResp$: Observable<any>;
  profileResp$: Observable<any>;
  combinedLoginResult$: Observable<any>;

  errorMsg: string;

  selectedLanguage: any = "English";
  selectedLanguageFlag: any = "assets/images/flags/us.svg";

  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    fb: FormBuilder,
    private _router: Router
  ) {
    this.form = fb.group({
      username: [
        '',
        Validators.compose([Validators.required, CustomValidators.email]),
      ],
      password: [
        '',
        Validators.compose([Validators.required, Validators.minLength(6)]),
      ],
    });
  }

  ngOnInit(): void {
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(e: Event) {
    e.preventDefault();

    const model = new HttpParams()
      .set('grant_type', 'password')
      .set('username', this.form.value.username.trim())
      .set('password', this.form.value.password);

    this.loginResponse$ = this.httpService.mobileBankingLogin(
      'api/v1/oauth/token',
      model
    );

    this.userDataResp$ = this.httpService.mobileBankingGetUserDetails();

    this.profileResp$ = this.httpService.mobileBankingGetUserPermissions();

    this.combinedLoginResult$ = concat(this.loginResponse$, this.userDataResp$, this.profileResp$);
  }

  toggleShowPassword() {
    this.showingPassword = !this.showingPassword;
    if (this.showingPassword) {
      this.inputType = 'text';
    } else {
      this.inputType = 'password';
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
