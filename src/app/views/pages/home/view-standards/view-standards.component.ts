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
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-view-standards',
  templateUrl: './view-standards.component.html',
  styleUrls: ['./view-standards.component.scss'],
})
export class ViewStandardsComponent implements OnInit {
  returnUrl: any;
  public form: FormGroup;
  public showingPassword = false;
  modalRef: NgbModalRef;
  inputType = 'password';
  errorMessage: string;
  currentDescription = 'Tourism Regulatory Authority (TRA) is a corporate body established under section 4 of the Tourism Act No.28 of 2011 and is mandated to regulate the tourism sector in Kenya. This entails developing regulations, standards and guidelines that are necessary to ensure an all-round quality service delivery in the tourism sector.This standard was developed by a select team drawn from relevant institutions, including; Tourism Regulatory Authority (TRA), Kenya Utalii College (KUC), Kenya Association of Hotels and Caterers (KAHC), Kenya Association of Tour Operators (KATO), Ministry of Health (MoH), Architectural of Association of Kenya (AAK) and Kenya Bureau of Standards (KEBS). This standard will ensure that the service provided by all the hospitality establishments in the country is of quality and meet the minimum expectations of the tourist. It will form the basis for quality control in the sector as well act as the essential item for the rating of hotels and restaurants in the country.'
  standards: any = [
    {
      id: '1',
      name: 'Part I - PRELIMINARY ',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '2',
      name: 'Part II - Statutory Obligations',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '3',
      name: ' Part III - Facility Requirements',
      describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
  ]

  loginResponse$: Observable<any>;
  // userDataResp$: Observable<any>;
  // profileResp$: Observable<any>;
  // combinedLoginResult$: Observable<any>;

  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;

  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';
  images: string[];
  currentIndex: number;
  changeIndex: (index: any) => void;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    public activeModal: NgbActiveModal,
    private _router: Router,
    private fb: FormBuilder,
    public modal: NgbModal,

  ) {
    this.form = fb.group({
      email: ['',Validators.compose([Validators.required, CustomValidators.email])],
      occupation: ['',Validators.compose([Validators.required])],
      purpose: ["", Validators.compose([Validators.required])],
      name: ["", Validators.compose([Validators.required])],
      phoneNumber: ["", Validators.compose([Validators.required])],
    });
  }

  ngOnInit(): void {

    localStorage.clear();
    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  
  }
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }
  onSubmit(e: Event) {
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

    //           // if(result.firstTimeLogin) {
    //           //   this.router.navigate(['/auth/first-time-login']);
    //           // } else{
    //           //   this.router.navigate(['/dashboard']);
    //           // }

    //         }, 1000);
    //         return result;
    //       }
    //     })
    //   );
  }

  toggleShowPassword() {
    this.showingPassword = !this.showingPassword;
    if (this.showingPassword) {
      this.inputType = 'text';
    } else {
      this.inputType = 'password';
    }
  }
  onRequestStandards() {
    // let body = {
    //   concern: this.f.concern?.value,
    //   groupId: this.param
    // }
    // this.subs.sink = this.memberService.raiseConcern(body).subscribe(
    //   res => {
    //     if (res["status"] == "success") {
    //       console.log(res);
    //       this.toastr.success('Concern Raised Successfully. Awaiting Approval!');
    //       this.closeModal();
    //       this.getGroup();
    //     } else {
    //       this.errorMessage = res["message"];
    //     }
    //   },
    //   err => {
    //     this.toastr.error('Something wrong happened. Try Again!!!')
    //   }
    // )
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
  openModal(modalContent: any) {
    this.modalRef = this.modal.open(modalContent, {centered: true, size:"md"});
  }
  closeModal() {
    this.activeModal.close();
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
  updateCurrentDescription(describe: string) {
    this.currentDescription = describe;
  }
}
