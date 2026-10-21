import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, catchError, map, throwError, Subscription } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, OnDestroy {
  public form: FormGroup;
  registerResponse$: Observable<any>;
  errorMsg: string = '';
  hasError: boolean = false;
  isLoading: boolean = false;
  successMsg: string = '';
  hasSuccess: boolean = false;
  enterpriseData: any;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router,
    private httpService: HttpService,
    private http: HttpClient,
    private fb: FormBuilder // Fix: make fb private and inject properly
  ) {
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],

    });
  }

  ngOnInit(): void {
    // Initialization logic if needed
  }

  onRegister(e: Event) {
    e.preventDefault();
    
    // Reset states
    this.resetStates();
    
    // Check form validity
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    const model = {
      first_name: this.form.value.first_name,
      last_name: this.form.value.last_name,
      email: this.form.value.email,
      role: "CREATOR"
    };

    console.log('Register Payload:', model);

    // Use subscription instead of storing observable
    const registerSub = this.httpService
      .customerPortalActivate('auth/register', model)
      .pipe(
        catchError((error: any) => {
          console.error('Registration error:', error);
          this.handleError(error);
          return throwError(() => error);
        }),
        map((result: any) => {
          this.handleSuccess(result);
          return result;
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Registration successful:', result);
        },
        error: (error) => {
          console.error('Subscription error:', error);
        }
      });

    this.subscription.add(registerSub);
  }

  private resetStates(): void {
    this.hasError = false;
    this.hasSuccess = false;
    this.errorMsg = '';
    this.successMsg = '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });
  }

  private handleError(error: any): void {
    this.isLoading = false;
    this.hasError = true;
    
    // Handle different error scenarios
    if (error?.status === 409 || error?.error?.message?.toLowerCase().includes('already exists') || 
        error?.error?.message?.toLowerCase().includes('email already registered')) {
      this.errorMsg = 'This email is already registered. Please use a different email or try signing in.';
    } else if (error?.status === 0) {
      this.errorMsg = 'Unable to connect to server. Please check your internet connection.';
    } else {
      this.errorMsg = error?.error?.message || 'Something went wrong during registration. Please try again.';
    }

    // Auto-clear error after 5 seconds
    setTimeout(() => {
      this.resetStates();
    }, 5000);
  }

  private handleSuccess(result: any): void {
    this.isLoading = false;
    
    if (result?.status !== '00') {
      // Handle API-level errors
      this.hasError = true;
      this.errorMsg = result?.message || 'Registration failed. Please try again.';
      
      setTimeout(() => {
        this.resetStates();
        this.form.reset();
      }, 5000);
    } else {
      // Success case
      this.hasSuccess = true;
      this.successMsg = 'Account created successfully! Redirecting to login...';
      
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 2000); // Reduced from 3000ms to 2000ms
    }
  }

  onSubmit(): void {
    this.onRegister(new Event('submit'));
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    // Cleanup subscriptions
    this.subscription.unsubscribe();
  }
}