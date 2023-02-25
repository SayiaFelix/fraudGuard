import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {AbstractControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ngx-custom-validators";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  returnUrl: any;
  public form: FormGroup;

  constructor(private router: Router,
              private route: ActivatedRoute,
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

    console.log("this.form.value");
    console.log(this.form.value);

    localStorage.setItem('isLoggedin', 'true');
    if (localStorage.getItem('isLoggedin')) {
      this.router.navigate([this.returnUrl]);
    }
  }

}
