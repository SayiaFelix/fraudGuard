import { Component } from '@angular/core';
import { INTEGRATIONS } from '../credit-demo.data';

@Component({
  selector: 'app-integrations',
  templateUrl: './integrations.component.html'
})
export class IntegrationsComponent {
  integrations = INTEGRATIONS;
}
