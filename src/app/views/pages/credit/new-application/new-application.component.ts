import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreditApplication } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-new-application',
  templateUrl: './new-application.component.html'
})
export class NewApplicationComponent {
  created: CreditApplication | null = null;
  form = this.fb.group({
    applicant: ['', Validators.required],
    phone: ['', Validators.required],
    nationalId: ['', Validators.required],
    country: ['Nigeria', Validators.required],
    branch: ['Lagos', Validators.required],
    product: ['Personal Loan', Validators.required],
    amount: [250000, [Validators.required, Validators.min(10000)]],
    tenorMonths: [12, [Validators.required, Validators.min(1), Validators.max(60)]],
    income: [350000, [Validators.required, Validators.min(1)]],
    obligations: [40000, [Validators.required, Validators.min(0)]],
    employment: ['Salaried', Validators.required],
    bureau: ['Clean', Validators.required],
    channel: ['Mobile app', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    public credit: CreditDataService,
    private router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.created = this.credit.submitApplication({
      applicant: value.applicant || '',
      phone: value.phone || '',
      nationalId: value.nationalId || '',
      country: value.country || '',
      branch: value.branch || '',
      product: value.product || '',
      amount: Number(value.amount),
      tenorMonths: Number(value.tenorMonths),
      income: Number(value.income),
      obligations: Number(value.obligations),
      employment: value.employment || '',
      bureau: value.bureau || '',
      channel: value.channel || ''
    });
  }

  factorBar(impact: number): number {
    return Math.max(8, Math.min(100, Math.abs(impact)));
  }

  openCase(): void {
    if (!this.created) return;
    if (this.created.decision === 'Refer') {
      this.router.navigate(['/alerts'], { queryParams: { id: this.created.id } });
      return;
    }
    this.router.navigate(['/applications', this.created.id]);
  }
}
