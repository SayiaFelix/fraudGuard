import {Component, OnInit, ViewChild,} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import { CustomValidators } from 'ngx-custom-validators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-list-requests',
  templateUrl: './list-requests.component.html',
  styleUrls: ['./list-requests.component.scss'],
  providers: [DatePipe],
})


/**
 * Starter-component
 */
export class ListRequestsComponent implements OnInit {
  public form: FormGroup;
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  errorMessage: string;
  modalRef: NgbModalRef;
  loading:boolean;
  standards: any = []
  // standards: any = [
  //   {
  //     id: '1',
  //     icon: "assets/images/3.png",
  //     name: 'Accommodation And Catering Establishment',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '2',
  //     icon: "assets/images/2.png",
  //     name: 'Meetings, Incentives, Conferences & Exhibitions Facilities And Services',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '3',
  //     icon: "assets/images/6.jpg",
  //     name: 'Standards For Food Safety And Hygiene Standards',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '4',
  //     icon: "assets/images/4.jpg",
  //     name: 'Standards For Safety And Security Standards',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '5',
  //     icon: "assets/images/5.jpg",
  //     name: ' Tour Guides And Hotel Employees Accommodation Standard',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '6',
  //     icon: "assets/images/3.png",
  //     name: 'Halal Compliance Standard For Accommodation And Catering Establishments',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '7',
  //     icon: "assets/images/7.jpg",
  //     name: 'Standards For Spa And Wellness Facilities',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '8',
  //     icon: "assets/images/1.jpg",
  //     name: 'Standards For Tourism Tours & Travel Enterprises',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '9',
  //     icon: "assets/images/2.png",
  //     name: 'Accommodation And Catering Establishment',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '10',
  //     icon: "assets/images/3.png",
  //     name: 'Meetings, Incentives, Conferences & Exhibitions Facilities And Services',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '11',
  //     icon: "assets/images/5.jpg",
  //     name: 'Standards For Food Safety And Hygiene Standards',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '12',
  //     icon: "assets/images/6.jpg",
  //     name: 'Standards For Safety And Security Standards',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '13',
  //     icon: "assets/images/4.jpg",
  //     name: ' Tour Guides And Hotel Employees Accommodation Standard',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '14',
  //     icon: "assets/images/3.png",
  //     name: 'Halal Compliance Standard For Accommodation And Catering Establishments',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '15',
  //     icon: "assets/images/1.jpg",
  //     name: 'Standards For Spa And Wellness Facilities',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '16',
  //     icon: "assets/images/7.jpg",
  //     name: 'Standards For Tourism Tours & Travel Enterprises',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '17',
  //     icon: "assets/images/4.jpg",
  //     name: 'Standards For Spa And Wellness Facilities',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '18',
  //     icon: "assets/images/1.jpg",
  //     name: 'Standards For Tourism Tours & Travel Enterprises',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '19',
  //     icon: "assets/images/3.png",
  //     name: 'Halal Compliance Standard For Accommodation And Catering Establishments',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '20',
  //     icon: "assets/images/1.jpg",
  //     name: 'Standards For Spa And Wellness Facilities',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  // ]
  constructor(private router: Router, 
    fb: FormBuilder,
    public modal: NgbModal,
    private httpService: HttpService,
    public activeModal: NgbActiveModal,) { 
      this.form = fb.group({
        email: ['',Validators.compose([Validators.required, CustomValidators.email])],
        subject: ['',Validators.compose([Validators.required])],
        message: ["", Validators.compose([Validators.required])],
        name: ["", Validators.compose([Validators.required])],
        phoneNumber: ["", Validators.compose([Validators.required])],
      });
    }

  ngOnInit(): void {
    this.loadData()
  }

  private loadData(): any {
    this.loading = true;
    this.httpService.customerPortalPost(`api/v1/portal/getStandards`,{}).subscribe(
      (res: any) => {

        if (res.status == '00') {
          this.standards = res['data'];
          console.log(this.standards)
          this.loading = false;
          this.loading = false;

        } else {
          Swal.fire('Failed', "Unable to fetch standards", 'error')
        }
      }, (error: any) => {
        Swal.fire("Error", error.message, "error");
      });
  }

  onleaveComment() {
    // this.hasError = false;
    // this.isLoading = true;
    // e.preventDefault();
  
    // const model = new HttpParams()
    //   // .set('grant_type', 'password')
    //   .set('username', this.form.value.username.trim())
    //   .set('password', this.form.value.password);
  
    // this.loginResponse$ = this.httpService
    //   .channelManagerLogin('oauth/token', model)
    //   .pipe(
    //     catchError((error: any) => {
    //       console.log(error);
    //       this.hasError = error.message;
    //       this.isLoading = false;
    //       return throwError(error);
    //     }),
    //     map((result) => {
    //       this.isLoading = false;
    //       if (result['status'] != 200) {
    //         this.hasError = true;
    //         this.errorMsg = result['message'];
    //         setTimeout(() => {
    //           this.hasError = false;
    //           this.errorMsg = '';
    //           this.form.reset();
    //         }, 4000);
    //       } else {
    //         setTimeout(() => {
  
    //           this.saveUsernameAndRolesOnLogin();
  
    //           if(result.firstTimeLogin) {
    //             this.router.navigate(['/auth/first-time-login']);
    //           } else{
    //             this.router.navigate(['/dashboard']);
    //           }
  
    //         }, 1000);
    //         return result;
    //       }
    //     })
    //   );
  }
  
  openModal(modalContent: any) {
    this.modalRef = this.modal.open(modalContent, {centered: true, size:"md"});
  }
  // closeModal() {
  //   this.activeModal.close();
  // }
  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }
  onRegister(e: Event) {
    e.preventDefault();
    localStorage.setItem('isLoggedin', 'true');
    if (localStorage.getItem('isLoggedin')) {
      this.router.navigate(['/']);
    }
  }

}
