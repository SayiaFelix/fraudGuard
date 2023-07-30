import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CustomValidators } from 'ngx-custom-validators';
import { HttpClient, HttpParams } from '@angular/common/http';

import { catchError, concat, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from "sweetalert2";
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
@Component({
  selector: 'app-view-standards',
  templateUrl: './view-standards.component.html',
  styleUrls: ['./view-standards.component.scss'],
})
export class ViewStandardsComponent implements OnInit {
  
  returnUrl: any;
  public form: FormGroup;
  public forms: FormGroup;
  public showingPassword = false;

  modalRef: NgbModalRef;
  inputType = 'password';
  errorMessage: string;
  loading: boolean;
  standard: any;
  private brochureUrl = 'assets/images/certificate.png';
  // Store the sanitized URL
  public downloadLink: SafeUrl;
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

  // certificateId: number = this.standardId
  previewImageUrl: string = '';
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  defaultImage: SafeResourceUrl = "assets/images/4.png";
  existingImage: SafeResourceUrl;

  defaultParts: any[] = [
    { partOrder: 'I', part_title: 'Preliminary' },
    { partOrder: 'II', part_title: 'Statutory Obligations' },
    { partOrder: 'III', part_title: 'Facility Requirements' }
  ];

  defaultTerms: any[] = [
    { term_title: 'A-la-carte:', term_definition: 'means a menu in a restaurant that offers individual priced' },
    { partOrder: 2, part_title: 'Statutory Obligations' },
    { partOrder: 3, part_title: 'Facility Requirements' }
  ];

  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';
  images: string[];
  currentIndex: number;
  changeIndex: (index: any) => void;
  public standardId: number;
  showLeaveCommentForm: boolean = false;
  showRequestForm : boolean  = false;
  file: any;
  certificateData: any;
  selectedPart: any;
  userData$: Observable<any>;
  profile: string | null;
  logo: string | null;
  showMenuItems: boolean = true;
  showDashbord: boolean = false;
  parts: any[] = [];
  terms: any;
  isOffline: any;
  files: any;
  // selectedPart: StandardPart | null;

  constructor(
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute,
    private httpService: HttpService,
    public activatedRoute: ActivatedRoute,
    public activeModal: NgbActiveModal,
    private _router: Router,
    private fb: FormBuilder,
    public modal: NgbModal,
    private sanitizer: DomSanitizer,
    private http: HttpClient,

  ) {
    this.downloadLink = this.sanitizer.bypassSecurityTrustUrl(this.brochureUrl);
    this.form = fb.group({
      name: ["", Validators.compose([Validators.required])],
      email: ['',Validators.compose([Validators.required, CustomValidators.email])],
      occupation: ['',Validators.compose([Validators.required])],
      purpose: ["", Validators.compose([Validators.required])],
      phone_number: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
    });
    this.forms = fb.group({
      comment: ["", Validators.compose([Validators.required])],
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        console.log('query-params');
        console.log(params);
        this.standardId = params.id;
        console.log(this.standardId)
        // this.categoryId = params.categoryId;
      }
    });
    this.checkForToken();
    this.loadData();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    let userDetails = {
      profile: localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')!)['user']['name'] : "Eka Hotel Nairobi",

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

    this.loadData(); {
      this.loading = true;
      let model = {
        id: this.standardId
      };
      this.httpService.customerPortalPost(`api/v1/portal/standard/${this.standardId}`, {}).subscribe(
        (res: any) => {
          if (res.status === '00') {
            this.parts = res['data']['parts'];
            this.terms = res['data']['terms'];

            if (this.parts.length > 0) {
              this.selectedPart = this.parts[0];
            }
          } else {
            this.parts = res.length > 0 ? res : this.defaultParts;
            this.terms = res.length > 0 ? res : this.defaultTerms;
            this.selectedPart = {
              partOrder: 1,
              partTitle: 'Preliminary',
              partDescription: 'Preliminary description.',
            };
          }
        }, (error: any) => {
          Swal.fire("Error", error.message, "error");
          console.error('Error fetching parts:', error);
          // Swal.fire('Failed', "Unable to fetch standards", 'error');
        });
    }
    if (this.parts.length > 0) {
      this.selectedPart = this.parts[0];
    }
    // this.parts = this.isOffline ? this.defaultParts : this.parts ;
  }
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }

  phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneNumber = control.value;
    // Regular expression to check if the phone number starts with "254" and is followed by 9 digits.
    const phonePattern = /^254\d{9}$/;
  
    return phonePattern.test(phoneNumber) ? null : { invalidPhoneNumber: true };
  }
//  phoneNumberValidator(): ValidatorFn {
//     return (control: AbstractControl): { [key: string]: any } | null => {
//       const phoneNumber = control.value;
//       const kenyaCountryCode = '254';

//       if (!phoneNumber.startsWith(kenyaCountryCode) || phoneNumber.length !== 12) {
//         return { invalidPhoneNumber: true };
//       }
//       return null;
//     };
//   }
  
  isPartSelected(part: any): boolean {
    return this.selectedPart === part;
  }

  showDescription(part: any) {
    this.selectedPart = part;
  }

  private loadData(): any {
    this.loading = true;
    let model = {
      id: this.standardId
    };
    this.httpService.customerPortalPost(`api/v1/portal/standard/${this.standardId}`, {}).subscribe(
      (res: any) => {
        if (res.status === '00') {
          this.standard = res['data'];
          this.previewImageUrl = res.data.preview_image_url;
          this.existingImage = "http://".concat(
            this.standards['previewImageUrl']
          );
          if (this.standard.preview_image_url) {
            this.existingImage = this.sanitizer.bypassSecurityTrustResourceUrl("http://" + this.standard.preview_image_url);
          } else {
            this.existingImage = this.defaultImage;
          }
          console.log(this.existingImage)
          this.loading = false;
          this.parts = res['data']['parts'];
          this.terms = res['data']['terms'];
          this.files = res['data']['files'];

          console.log(this.standard);
          console.log('parts', this.parts);
          console.log('terms', this.terms);
          console.log('files', this.files);
          this.loading = false;
        } else {
          Swal.fire('Failed', "Unable to fetch standards", 'error');
        }
      }, (error: any) => {
        Swal.fire("Error", error.message, "error");
      });
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


  downloadCertificate(fileUrl: string) {
    const normalizedFileUrl = fileUrl.startsWith('http://') ? fileUrl : 'http://' + fileUrl;
    const link = document.createElement('a');
    link.href = normalizedFileUrl;
    link.target = '_blank';
    link.click();
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
    this.showRequestForm = false
  }

  onSubmit(): any {
    this.isLoading = true;
    let email = JSON.parse(localStorage.getItem('data')!)['user']['businessEmail'];
    const model = {
      email,
      standardId: this.standardId,
      comment: this.forms.value.comment,
    };
    console.log(model)
    this.httpService.customerPortalPost(`api/v1/portal/comment`, model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.activeModal.close('success');
          Swal.fire('Comment Added Successfully',
            'success').then(r => console.log(r))
          this.form.reset()
          this.loadData()
        } else {
          this.activeModal.close('error');
          Swal.fire('Add Comment Failed, Try Again',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Add Comment error',
          'error')
      }
    );

  }

  toggleShowPassword() {
    this.showingPassword = !this.showingPassword;
    if (this.showingPassword) {
      this.inputType = 'text';
    } else {
      this.inputType = 'password';
    }
  }

  hideRequestForm() {
    this.showRequestForm = false;
    this.form.reset();
  }
  openRequestForm() {
    if (this.showRequestForm) {
      this.hideLeaveCommentForm();
    } else {
      this.showRequestForm = true;
    }
  }

  onRequestStandards() {
    this.isLoading = true;
    const model = {
      standard_id: this.standardId,
      name: this.form.value.name,
      phone_number: this.form.value.phone_number, 
      occupation: this.form.value.occupation, 
      purpose: this.form.value.purpose,
      email: this.form.value.email,
    };
    console.log(model)
    this.httpService.customerPortalPost(`api/v1/portal/requestStandard`, model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.hideRequestForm()
          this.loadData()
          Swal.fire('Standard Request Made Successfully',
            'success').then(r => console.log(r))
        } else {
          this.hideRequestForm()
          Swal.fire('Standard Request Failed, Try Again',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        this.hideRequestForm()
        Swal.fire('Request Standard error',
          'error')
      }
    );
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

  onleaveComment() { }

  openModal(modalContent: any) {
    this.modalRef = this.modal.open(modalContent, { centered: true, size: "md" });
  }

  closeModal() {
    this.activeModal.close();
  }
}
