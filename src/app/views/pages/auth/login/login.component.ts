import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ngx-custom-validators";
import {HttpParams} from "@angular/common/http";
import {HttpService} from "../../../../shared/services/http.service";
import {catchError, Observable, of} from "rxjs";
import {map} from "rxjs/operators";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  returnUrl: any;
  public form: FormGroup;
  public showingPassword = false;
  inputType = 'password';

  loginResponse$: Observable<any>;
  errorMsg: string;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private httpService: HttpService,
              fb: FormBuilder,
              private _router: Router) {
    this.form = fb.group({
      username: ['', Validators.compose([Validators.required, CustomValidators.email])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(6)]),
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

    this.loginResponse$ = this.httpService.mobileBankingLogin('api/v1/oauth/token', model)


    // this.loginResponse$.subscribe(data => {
    //   // Handle data
    //   console.log(data)
    // }, error => {
    //   // Handle error
    //   console.log(error)
    // },(complete: any) => {
    //   console.log(complete)
    // });
    localStorage.setItem('isLoggedin', 'true');
    if (localStorage.getItem('isLoggedin')) {
      this.router.navigate([this.returnUrl]);
    }
  }

  toggleShowPassword() {
    this.showingPassword = !this.showingPassword;
    if (this.showingPassword) {
      this.inputType = "text";
    } else {
      this.inputType = "password";
    }
  }
}
