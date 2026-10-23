import { Component } from '@angular/core';
import { COUNTRY_MIX, PRODUCT_MIX } from '../credit-demo.data';
import { CreditDataService } from '../credit-data.service';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html'
})
export class PortfolioComponent {
  products = PRODUCT_MIX;
  countries = COUNTRY_MIX;
  constructor(public credit: CreditDataService) {}
}
