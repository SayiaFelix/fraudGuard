import { Component, OnInit } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  userData$: Observable<any>;
  companyEmail: string;
  companyPhone: string;
  companyRegistrationDate: string;
  country: string;
  taxPin: string;
  logo: string;
  physicalAddress: string;
  registeredName: string;

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.userData$ = this.httpService.mobileBankingGetUserDetails().pipe(
      map((resp) => {
        if (resp) {
          this.companyEmail = resp['companyEmail'];
          this.companyPhone = resp['companyPhone'];
          this.companyRegistrationDate = resp['companyRegistrationDate'];
          this.country = resp['country'];
          this.taxPin = resp['taxPin'];
          this.registeredName = resp['registeredName'];
          this.physicalAddress = resp['physicalAddress'];
          this.logo =
            'https://images.unsplash.com/photo-1517404215738-15263e9f9178?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80';
          return resp;
        }
      })
    );
  }
}
