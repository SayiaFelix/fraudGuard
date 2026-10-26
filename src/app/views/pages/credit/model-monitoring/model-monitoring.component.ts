import { Component } from '@angular/core';
import { MODEL_METRICS } from '../credit-demo.data';

@Component({
  selector: 'app-model-monitoring',
  templateUrl: './model-monitoring.component.html'
})
export class ModelMonitoringComponent {
  model = MODEL_METRICS;

  drift(actual: number, expected: number): number {
    return actual - expected;
  }
}
