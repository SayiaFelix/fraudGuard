import { Component, OnDestroy } from '@angular/core';

interface ScoreBand {
  band: string;
  expected: number;
  actual: number;
}

interface BuildRow {
  version: string;
  date: string;
  auc: number;
  state: string;
}

interface FeatureShift {
  name: string;
  psi: number;
}

interface CreditModel {
  id: string;
  name: string;
  code: string;
  algorithm: string;
  role: string;
  status: string;
  summary: string;
  trained: string;
  next: string;
  sample: string;
  auc: number;
  gini: number;
  ks: number;
  brier: number;
  psi: number;
  fpr: number;
  fnr: number;
  baseRate: number;
  weightGood: number;
  weightDefault: number;
  cutoff: number;
  validationN: number;
  ensembleShare: string;
  roc: string;
  bands: ScoreBand[];
  builds: BuildRow[];
  features: FeatureShift[];
}

interface LiveCut {
  fpr: number;
  fnr: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  approved: number;
  precision: number;
  recall: number;
  approvalRate: number;
  badRate: number;
}

@Component({
  selector: 'app-model-monitoring',
  templateUrl: './model-monitoring.component.html',
  styleUrls: ['./model-monitoring.component.scss']
})
export class ModelMonitoringComponent implements OnDestroy {
  readonly models: CreditModel[] = [
    {
      id: 'origination',
      name: 'Origination scorecard',
      code: 'PD-XGB-4.2',
      algorithm: 'XGBoost',
      role: 'Scores a new application',
      status: 'Production',
      summary: 'Ranks a first-time request from bureau, income, tenor, and channel, before any repayment exists.',
      trained: '12 Oct 2026',
      next: '09 Nov 2026',
      sample: '186,420 funded loans · 12-month default',
      auc: 0.812,
      gini: 0.624,
      ks: 41.8,
      brier: 0.058,
      psi: 0.07,
      fpr: 18.6,
      fnr: 26.4,
      baseRate: 0.104,
      weightGood: 1,
      weightDefault: 8.6,
      cutoff: 640,
      validationN: 24000,
      ensembleShare: '46% of the blend',
      roc: 'M2,98 C14,74 24,48 40,30 C56,14 74,8 98,3',
      bands: [
        { band: '300–579', expected: 18, actual: 19 },
        { band: '580–639', expected: 22, actual: 23 },
        { band: '640–699', expected: 27, actual: 26 },
        { band: '700–900', expected: 33, actual: 32 }
      ],
      builds: [
        { version: '4.2', date: '12 Oct 2026', auc: 0.812, state: 'Champion' },
        { version: '4.1', date: '14 Sep 2026', auc: 0.804, state: 'Retired' },
        { version: '4.0', date: '18 Aug 2026', auc: 0.791, state: 'Retired' }
      ],
      features: [
        { name: 'Bureau utilisation', psi: 0.04 },
        { name: 'Income residual', psi: 0.08 },
        { name: 'Requested tenor', psi: 0.03 },
        { name: 'Channel', psi: 0.06 }
      ]
    },
    {
      id: 'behaviour',
      name: 'Behavioural default',
      code: 'PD-LGBM-2.8',
      algorithm: 'LightGBM',
      role: 'Updates standing risk',
      status: 'Production',
      summary: 'Re-scores an open loan from days past due, utilisation, and how the limit has moved.',
      trained: '18 Oct 2026',
      next: '15 Nov 2026',
      sample: '94,110 live accounts · 90-day default',
      auc: 0.847,
      gini: 0.694,
      ks: 48.2,
      brier: 0.041,
      psi: 0.04,
      fpr: 12.4,
      fnr: 18.8,
      baseRate: 0.082,
      weightGood: 1,
      weightDefault: 11.2,
      cutoff: 620,
      validationN: 18400,
      ensembleShare: '38% of the blend',
      roc: 'M2,98 C10,58 20,32 36,16 C52,6 72,3 98,2',
      bands: [
        { band: '300–579', expected: 14, actual: 14 },
        { band: '580–639', expected: 21, actual: 20 },
        { band: '640–699', expected: 29, actual: 30 },
        { band: '700–900', expected: 36, actual: 36 }
      ],
      builds: [
        { version: '2.8', date: '18 Oct 2026', auc: 0.847, state: 'Champion' },
        { version: '2.7', date: '20 Sep 2026', auc: 0.839, state: 'Retired' },
        { version: '2.6', date: '23 Aug 2026', auc: 0.828, state: 'Retired' }
      ],
      features: [
        { name: 'Days past due', psi: 0.03 },
        { name: 'Limit utilisation', psi: 0.05 },
        { name: 'On-time streak', psi: 0.02 },
        { name: 'Limit change', psi: 0.04 }
      ]
    },
    {
      id: 'ensemble',
      name: 'Decision ensemble',
      code: 'ENS-STACK-1.6',
      algorithm: 'Stacked logistic',
      role: 'Sets the decision score',
      status: 'Production',
      summary: 'Blends the two probabilities with a thin set of policy features. Cutoffs sit on this score.',
      trained: '19 Oct 2026',
      next: '16 Nov 2026',
      sample: '186,420 applications · behaviour filled when present',
      auc: 0.861,
      gini: 0.722,
      ks: 51.4,
      brier: 0.037,
      psi: 0.06,
      fpr: 9.8,
      fnr: 16.1,
      baseRate: 0.097,
      weightGood: 1,
      weightDefault: 7.4,
      cutoff: 660,
      validationN: 24000,
      ensembleShare: 'Final decision',
      roc: 'M2,98 C8,48 16,24 32,12 C50,4 70,2 98,1',
      bands: [
        { band: '300–579', expected: 16, actual: 17 },
        { band: '580–639', expected: 20, actual: 20 },
        { band: '640–699', expected: 28, actual: 27 },
        { band: '700–900', expected: 36, actual: 36 }
      ],
      builds: [
        { version: '1.6', date: '19 Oct 2026', auc: 0.861, state: 'Champion' },
        { version: '1.5', date: '21 Sep 2026', auc: 0.854, state: 'Retired' },
        { version: '1.4', date: '24 Aug 2026', auc: 0.846, state: 'Retired' }
      ],
      features: [
        { name: 'Origination PD', psi: 0.05 },
        { name: 'Behaviour PD', psi: 0.03 },
        { name: 'Affordability', psi: 0.07 },
        { name: 'Policy flags', psi: 0.02 }
      ]
    }
  ];

  selectedId = 'ensemble';
  cutoff = 660;
  fresh = true;
  job: { model: string; phase: string; detail: string } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private frame: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
    if (this.frame) {
      clearTimeout(this.frame);
    }
  }

  get selected(): CreditModel {
    return this.models.find(model => model.id === this.selectedId) || this.models[2];
  }

  get live(): LiveCut {
    const model = this.selected;
    const shift = (this.cutoff - model.cutoff) / 80;
    const fpr = this.clamp(model.fpr + shift * 9, 3, 46);
    const fnr = this.clamp(model.fnr - shift * 8, 4, 55);
    const bad = Math.round(model.validationN * model.baseRate);
    const good = model.validationN - bad;
    const fn = Math.round(bad * fnr / 100);
    const tp = bad - fn;
    const fp = Math.round(good * fpr / 100);
    const tn = good - fp;
    const approved = tn + fn;
    return {
      fpr,
      fnr,
      tp,
      fp,
      tn,
      fn,
      approved,
      precision: tp + fp === 0 ? 0 : tp / (tp + fp),
      recall: bad === 0 ? 0 : tp / bad,
      approvalRate: approved / model.validationN,
      badRate: approved === 0 ? 0 : fn / approved
    };
  }

  select(id: string): void {
    if (this.selectedId === id) {
      return;
    }
    this.selectedId = id;
    this.cutoff = this.selected.cutoff;
    this.job = null;
    this.clearTimer();
    this.replay();
  }

  setCutoff(value: string | number): void {
    this.cutoff = Number(value);
  }

  retrain(): void {
    this.clearTimer();
    const steps = [
      { phase: 'Queued', detail: 'Feature snapshot pinned. The outcome window stays locked to the champion definition.' },
      { phase: 'Fitting', detail: 'Loss on defaults is scaled by the class weight. Live applications are still scored by the champion.' },
      { phase: 'Validating', detail: 'Holdout ROC-AUC, KS, and PSI are checked against the promotion gate.' },
      { phase: 'Held', detail: 'Demo fit finished. Champion weights stay as they are until model risk signs off.' }
    ];
    let index = 0;
    const tick = () => {
      this.job = { model: this.selected.name, ...steps[index] };
      index += 1;
      if (index < steps.length) {
        this.timer = setTimeout(tick, 850);
      }
    };
    tick();
  }

  drift(actual: number, expected: number): number {
    return actual - expected;
  }

  psiTone(value: number): string {
    if (value < 0.1) {
      return 'stable';
    }
    if (value < 0.25) {
      return 'watch';
    }
    return 'shift';
  }

  weightWidth(weight: number): number {
    return Math.max(8, Math.min(100, (weight / 12) * 100));
  }

  private replay(): void {
    this.fresh = false;
    if (this.frame) {
      clearTimeout(this.frame);
    }
    this.frame = setTimeout(() => {
      this.fresh = true;
    }, 0);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
