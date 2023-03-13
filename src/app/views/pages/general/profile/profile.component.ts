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

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'Action', prop:'action' },
    { name: 'Description', prop:'description' },
    { name: 'CreatedOn', prop:'createdOn' },
  ];
  rows: any = [];

  constructor(private httpService: HttpService) {}

  ngOnInit(): void {
    this.userData$ = this.httpService.mobileBankingGetUserDetailsAndPermissions().pipe(
      map((resp) => {
        if (resp) {
          this.companyEmail = resp[0]['companyEmail'];
          this.companyPhone = resp[0]['companyPhone'];
          this.companyRegistrationDate = resp[0]['companyRegistrationDate'];
          this.country = resp[0]['country'];
          this.taxPin = resp[0]['taxPin'];
          this.registeredName = resp[0]['registeredName'];
          this.physicalAddress = resp[0]['physicalAddress'];
          return resp;
        }
      })
    );
  }
}
