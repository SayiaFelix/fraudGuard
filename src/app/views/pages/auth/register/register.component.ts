import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, catchError, map, throwError } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  public form: FormGroup;
  registerResponse$: Observable<any>;
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  enterpriseData: any;

  constructor(
    private router: Router,
    private httpService: HttpService,
    private http: HttpClient,
    fb: FormBuilder
  ) {
    // --- MODIFIED: Removed password, confirmPassword, and the custom validator ---
    this.form = fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    // Implementation remains the same
  }

  // --- REMOVED: The entire passwordMatchValidator function is no longer needed ---

  onRegister(e: Event) {
    this.hasError = false;
    this.isLoading = true;
    e.preventDefault();

    // --- MODIFIED: Removed the 'password' property from the model ---
    const model = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      name: `${this.form.value.firstName} ${this.form.value.lastName}`, // Keep for backward compatibility
      email: this.form.value.email
    };

    console.log('Register Payload:', model);

    this.registerResponse$ = this.httpService
      .customerPortalActivate('register', model)
      .pipe(
        catchError((error: any) => {
          console.error('Registration error:', error);
          this.hasError = true;
          this.errorMsg = error?.error?.message || 'Something went wrong during registration.';
          this.isLoading = false;
          return throwError(() => error);
        }),
        map((result: any) => {
          this.isLoading = false;

          if (result?.status !== '00') {
            this.hasError = true;
            this.errorMsg = result?.message || 'Registration failed.';
            setTimeout(() => {
              this.hasError = false;
              this.errorMsg = '';
              this.form.reset();
            }, 3000);
          } else {
            // The success message in the HTML already handles this flow
            // You can keep this navigation if you want to redirect after a delay
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 3000);
          }
          return result;
        })
      );
  }
}