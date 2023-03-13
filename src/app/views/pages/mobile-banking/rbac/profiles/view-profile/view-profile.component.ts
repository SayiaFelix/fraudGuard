import { Component, OnInit } from '@angular/core';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';


@Component({
  selector: 'app-view-profile',
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.scss']
})
export class ViewProfileComponent implements OnInit {
  private dataSet: any;
  private tempData = [
    {
      id: 1,
      createdOn: '2022-07-24T11:03:15.865326',
      softDelete: false,
      active: false,
      name: 'SUPER-ADMIN',
      remarks: 'super admin',
      userType: 'BANK_ADMIN',
      corporateId: 0
    }
  ];

  constructor(private httpService: HttpService,
              public globalService: GlobalService) { }

  ngOnInit(): void {
    this.loadData();


  }

  private loadData(): any {

    const model = {
        page: 0,
        size: 100
    };

    // this.httpService.advancysPost('api/v1/bank/profile/all', model).subscribe(
    //     result => {
    //       this.dataSet =
    //           this.tempData;
    //           result.data.content;
    //     },
    //     error => {
    //     },
    //     complete => {
    //     }
    // );
  }
}
