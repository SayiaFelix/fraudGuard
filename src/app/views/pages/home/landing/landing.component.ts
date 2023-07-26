import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CustomValidators } from 'ngx-custom-validators';
import { HttpParams } from '@angular/common/http';

import { catchError, concat, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from "sweetalert2";
import { OwlOptions } from 'ngx-owl-carousel-o';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  returnUrl: any;
  public form: FormGroup;
  public showingPassword = false;
  showLeaveCommentForm: boolean = false;
  inputType = 'password';
  modalRef: NgbModalRef;
  // standards: any = [];
  standards: any = [
    {
      id: '1',
      previewImageUrl: "assets/images/3.png",
      title: 'Accommodation And Catering Establishment',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '2',
      previewImageUrl: "assets/images/2.png",
      title: 'Meetings, Incentives, Conferences & Exhibitions Facilities And Services',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '3',
      previewImageUrl: "assets/images/6.jpg",
      title: 'Standards For Food Safety And Hygiene Standards',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '4',
      previewImageUrl: "assets/images/4.jpg",
      title: 'Standards For Safety And Security Standards',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '5',
      previewImageUrl: "assets/images/5.jpg",
      title: ' Tour Guides And Hotel Employees Accommodation Standard',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '6',
      previewImageUrl: "assets/images/3.png",
      title: 'Halal Compliance Standard For Accommodation And Catering Establishments',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '7',
      previewImageUrl: "assets/images/7.jpg",
      title: 'Standards For Spa And Wellness Facilities',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '8',
      previewImageUrl: "assets/images/1.jpg",
      title: 'Standards For Tourism Tours & Travel Enterprises',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
  ]

  autoPlayOptions: OwlOptions = {
    items: 2,
    loop: true,
    margin: 5,
    autoplay: true,
    autoWidth: true,
    mouseDrag: false,
    touchDrag: false,
    dots: true,
    autoplayTimeout: 2000,
    autoplayHoverPause: true,
    responsive: {
      0: {
        items: 2
      },
      600: {
        items: 2
      },
      1000: {
        items: 2
      }
    }
  }

  slidesStore = [
    {
      id: '1',
      src: 'assets/images/5.jpg',
      title: 'Halal Compliance Standard For Accommodation And Catering Establishments'
    },
    {
      id: '2',
      src: 'assets/images/1.jpg',
      title: 'Standards For Tourism Tours & Travel Enterprises'
    },
    {
      id: '3',
      src: 'assets/images/3.png',
      title: 'Standards For Spa And Wellness Facilities',
    },
    {
      id: '4',
      src: 'assets/images/7.jpg',
      title: 'Tour Guides And Hotel Employees Accommodation Standard'
    },
    {
      id: '5',
      src: 'assets/images/2.png',
      title: 'Meetings, Incentives, Conferences & Exhibitions Facilities And Services'
    },
    {
      id: '6',
      src: 'assets/images/4.jpg',
      title: 'Accommodation And Catering Establishment',
    },
    {
      id: '7',
      src: 'assets/images/6.jpg',
      title: 'Standards For Safety And Security Standards'
    },
  ]
  loginResponse$: Observable<any>;
  // userDataResp$: Observable<any>;
  // profileResp$: Observable<any>;
  // combinedLoginResult$: Observable<any>;
  perPage = 5;
  page = 1
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  errorMessage: string;

  userData$: Observable<any>;
  profile:string | null;
  logo: string | null;
  showMenuItems: boolean = true;
  showDashbord: boolean = false;

  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';
  loading: boolean;



  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    fb: FormBuilder,
    private _router: Router,
    public modal: NgbModal,
    public activeModal: NgbActiveModal,

  ) {
    this.form = fb.group({
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['', Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      name: ["", Validators.compose([Validators.required])],
      phoneNumber: ["", Validators.compose([Validators.required])],
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.checkForToken();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    let userDetails = {
      profile: localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')!)['user']['name']  : "Eka Hotel Nairobi",

    };
    if (userDetails) {
      this.profile = userDetails['profile'];
      this.logo =
        'https://images.unsplash.com/photo-151740421573-15263e9f9178?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80';

      this.userData$ = of(userDetails);
    } else {
      this.userData$ = this.httpService.customerUserDetails().pipe(
        map((resp) => {
          console.log(resp);
          if (resp) {
            this.profile = resp[0]['enterpriseName'];
            return resp[0];
          }
        })
      );
    }
  }

  // viewStandard(id: number) {
  //   this.router.navigate([`standards/${id}`]);
  // }

  viewStandard(standardId: number) {
    this.router.navigate(['/standards', standardId]);
  }


  private loadData(): any {
    this.loading = true;
    let model ={
        page: this.page-1,
        size: this.perPage
    }
    this.httpService.customerPortalPosts(`getall`, model).subscribe(
      (res: any) => {

        if (res.status == 200) {
          this.standards = res['data']['standards'];
          console.log(this.standards)
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


  toggleLeaveCommentForm() {
    if (this.showLeaveCommentForm) {
      this.hideLeaveCommentForm();
    } else {
      this.showLeaveCommentForm = true;
    }
  }
  hideLeaveCommentForm() {
    this.showLeaveCommentForm = false;
  }

  // Function to hide the form when clicking outside of it
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const formElement = document.getElementById('leave-comment-form');

    if (formElement && !formElement.contains(event.target as Node)) {
      this.hideLeaveCommentForm();
    }
  }

  checkForToken() {
    if (!!localStorage.getItem('access_token')) {
      // Token exists, hide the first div and show the second div
      this.showMenuItems = false;
      this.showDashbord = true;
    } else {
      // Token doesn't exist, show the first div and hide the second div
      this.showMenuItems = true;
      this.showDashbord = false;
    }
  }

  closeModal() {
    this.modalRef.dismiss();
    this.showLeaveCommentForm = false;
  }

  toggleShowPassword() {
    this.showingPassword = !this.showingPassword;
    if (this.showingPassword) {
      this.inputType = 'text';
    } else {
      this.inputType = 'password';
    }
  }

  changeLanguage(lang: string) {
    this.translate.use(lang);
    if (lang === 'en') {
      this.selectedLanguage = 'English';
      this.selectedLanguageFlag = 'assets/images/flags/us.svg';
    } else if (lang === 'kis') {
      this.selectedLanguage = 'Kiswahili';
      this.selectedLanguageFlag = 'assets/images/flags/ke.svg';
    }
  }

  private saveUsernameAndRolesOnLogin() {

    let accessToken = localStorage.getItem("access_token");

    // decode token to get response
    let model = {
      token: accessToken,
    };
    // console.log("remove model: ", model);
    this.httpService.mobileBankingPost('oauth/validate', model).subscribe((res: any) => {
      if (res.status === 200) {

        console.log(res.data);

        localStorage.setItem('userName', res.data.username);
        localStorage.setItem('roles', res.data.roles);

      } else {
        Swal.fire('Error', 'Unable to fetch user details.', 'error');
      }
    })


  }
}
