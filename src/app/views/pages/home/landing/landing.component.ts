import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CustomValidators } from 'ngx-custom-validators';
import { HttpParams } from '@angular/common/http';

import {catchError, concat, Observable, of, throwError} from 'rxjs';
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
  inputType = 'password';
  modalRef: NgbModalRef;
  standards: any = [
    {
      id: '1',
      icon: "assets/images/3.png",
      name: 'Accommodation And Catering Establishment',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '2',
      icon: "assets/images/2.png",
      name: 'Meetings, Incentives, Conferences & Exhibitions Facilities And Services',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '3',
      icon: "assets/images/6.jpg",
      name: 'Standards For Food Safety And Hygiene Standards',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '4',
      icon: "assets/images/4.jpg",
      name: 'Standards For Safety And Security Standards',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '5',
      icon: "assets/images/5.jpg",
      name: ' Tour Guides And Hotel Employees Accommodation Standard',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '6',
      icon: "assets/images/3.png",
      name: 'Halal Compliance Standard For Accommodation And Catering Establishments',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '7',
      icon: "assets/images/7.jpg",
      name: 'Standards For Spa And Wellness Facilities',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '8',
      icon: "assets/images/1.jpg",
      name: 'Standards For Tourism Tours & Travel Enterprises',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    // {
    //   id: '9',
    //   icon: "assets/images/3.png",
    //   name: 'Accommodation And Catering Establishment',
    //   describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
  ]

  autoPlayOptions: OwlOptions = {
    items:4,
    loop:true,
    margin:5,
    autoplay:true,
    autoWidth:true,
    mouseDrag: false,
    touchDrag: false,
    dots: true,
    autoplayTimeout:2000,
    autoplayHoverPause:true,
    responsive:{
      0:{
          items:2
      },
      600:{
          items:3
      },
      1000:{
          items:4
      }
    }
  }

  slidesStore = [
    {
      id:'1',
      src:'assets/images/5.jpg',
      title:'Halal Compliance Standard For Accommodation And Catering Establishments'
    },
    {
      id:'2',
      src:'assets/images/1.jpg',
      title:'Standards For Tourism Tours & Travel Enterprises'
    },
    {
      id:'3',
      src:'assets/images/3.png',
      title:'Standards For Spa And Wellness Facilities',
    },
    {
      id:'4',
      src:'assets/images/7.jpg',
      title:'Tour Guides And Hotel Employees Accommodation Standard'
    },
    {
      id:'5',
      src:'assets/images/2.png',
      title:'Meetings, Incentives, Conferences & Exhibitions Facilities And Services'
    },
    {
      id:'6',
      src:'assets/images/4.jpg',
      title:'Accommodation And Catering Establishment',
    },
    {
      id:'7',
      src:'assets/images/6.jpg',
      title:'Standards For Safety And Security Standards'
    },
  ]
  loginResponse$: Observable<any>;
  // userDataResp$: Observable<any>;
  // profileResp$: Observable<any>;
  // combinedLoginResult$: Observable<any>;

  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  errorMessage: string;

  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';

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
      email: ['',Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['',Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      name: ["", Validators.compose([Validators.required])],
      phoneNumber: ["", Validators.compose([Validators.required])],
    });
  }

  ngOnInit(): void {

    localStorage.clear();



    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
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
        Swal.fire('Error',  'Unable to fetch user details.',  'error');
      }
    })


  }
}
