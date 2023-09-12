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
  public formC: FormGroup;
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
  defaultImage: SafeResourceUrl = "assets/images/no_I.png";
  defaultProfileImage: SafeResourceUrl = "assets/images/p7.png";
  existingImage: SafeResourceUrl = "assets/images/no_I.png";;
  existingProfileImage: SafeResourceUrl;

  defaultParts: any[] = [
    { partOrder: 'I', partTitle: 'Preliminary' },
    { partOrder: 'II', partTitle: 'Statutory Obligations' },
    { partOrder: 'III', partTitle: 'Facility Requirements' }
  ];

  defaultTerms: any[] = [
    { termTitle: 'A-la-carte:', termDefinition: 'means a menu in a restaurant that offers individual priced' },
    { partOrder: 2, partTitle: 'Statutory Obligations' },
    { partOrder: 3, partTitle: 'Facility Requirements' }
  ];
  showAssessors: boolean = false;

  assessors: any = [
    // {
    //   id: '1',
    //   existingProfileImage: "assets/images/p7.png",
    //   title:"Assessor",
    //   firstName: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '2',
    //   existingProfileImage: "assets/images/p7.png",
    //   title:"Assessor",
    //   firstName: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '3',
    //   existingImage: "assets/images/p3.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '4',
    //   existingImage: "assets/images/p4.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '5',
    //   existingImage: "assets/images/p5.png",
    //   title:"Assessor",
    //   first_name: ' Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '6',
    //   existingImage: "assets/images/p6.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '7',
    //   existingImage: "assets/images/p7.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '8',
    //   existingImage: "assets/images/p8.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
  ]
  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';
  selectedAssessor: any;
  images: string[];
  currentIndex: number;
  changeIndex: (index: any) => void;
  public standardId: number;
  showLeaveCommentForm: boolean = false;
  showRequestForm: boolean = false;
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
  isImageFromServer: boolean;
  // defaultProfileImage: SafeResourceUrl = "assets/images/landing2.png";
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
    this.formC = fb.group({
      name: ["", Validators.compose([Validators.required])],
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['', Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      phone_number: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
    });
    this.form = fb.group({
      name: ["", Validators.compose([Validators.required])],
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      occupation: ['', Validators.compose([Validators.required])],
      purpose: ["", Validators.compose([Validators.required])],
      phoneNumber: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
    });
    this.forms = fb.group({
      comment: ["", Validators.compose([Validators.required])],
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        // console.log('query-params');
        // console.log(params);
        this.standardId = params.id;
        // console.log(this.standardId)
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
          // console.log(resp);
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
      this.httpService.customerPortalPosts(`standard/portal/getById`, model).subscribe(
        (res: any) => {
          if (res.status === 200) {
            this.parts = res['data']['standard']['parts'];
            this.terms = res['data']['standard']['terms'];

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
          console.error('Error fetching parts:', error);
        });
    }
    if (this.parts.length > 0) {
      this.selectedPart = this.parts[0];
    }

  }

  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }
  get fs(): { [p: string]: AbstractControl } {
    return this.formC.controls;
  }



  phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneNumber = control.value;
    const phonePattern = /^(254\d{9}|0\d{9})$/;
    return phonePattern.test(phoneNumber) ? null : { invalidPhoneNumber: true };
  }

  isPartSelected(part: any): boolean {
    return this.selectedPart === part;
  }

  showDescription(part: any) {
    this.selectedPart = part;
    this.showAssessors = false;
  }

  private loadData(): any {
    this.loading = true;
    let model = {
      id: this.standardId
    };
    this.httpService.customerPortalPosts(`standard/portal/getById`, model).subscribe(
      (res: any) => {
        if (res.status === 200) {
          this.standard = res['data']['standard']['standard'];
          this.previewImageUrl = res.data.standard.standard.previewImageUrl;
       
          if (!/^https?:\/\//i.test(this.previewImageUrl)) {
            this.existingImage = 'https://' + this.previewImageUrl;
          }

     
          if (!this.previewImageUrl) {
            this.existingImage = this.defaultImage;
          }
          // this.existingImage = this.standard["previewImageUrl"].replace("10.20.2.19:7600", "https://test-api.ekenya.co.ke/tra-backend");
          this.loading = false;
          this.isImageFromServer = this.existingImage !== this.defaultImage;
          // console.log(this.existingImage)
          this.parts = res['data']['standard']['parts'];
          this.terms = res['data']['standard']['terms'];
          this.files = res['data']['standard']['files'];
          this.assessors = res['data']['standard']['assessorList'];

          this.assessors.forEach((assessor: any) => {
            if (assessor.profileImg) {

              assessor.profileImg = assessor.profileUrl.replace('10.20.2.19:7600', '');
              assessor.profileImg = 'https://test-api.ekenya.co.ke/tra-backend' + assessor.profileImg;
              // console.log(assessor.profile_url)
              assessor.existingProfileImage = this.sanitizer.bypassSecurityTrustResourceUrl(assessor.profileImg);
            } else {
              assessor.existingProfileImage = this.defaultProfileImage;

            }
          });

          // console.log(this.standard);
          // console.log('parts', this.parts);
          // console.log('terms', this.terms);
          // console.log('files', this.files);
          //  console.log('assessors', this.assessors);
          this.loading = false;
        } else {
          console.log('Failed', "Unable to fetch standards", 'error');
        }
      }, (error: any) => {
        console.log("Error", error.message, "error");
      });
  }
  // private loadData(): any {
  //   this.loading = true;
  //   let model = {
  //     id: this.standardId
  //   };
  //   this.httpService.customerPortalPosts(`standard/portal/getById`, model).subscribe(
  //     (res: any) => {
  //       if (res.status === 200) {
  //         this.standard = res['data']['standard']['standard'];
  //         this.previewImageUrl = res.data.standard.standard.previewImageUrl;

  //         // Check if previewImageUrl starts with "https://" or "http://"
  //         if (!/^https?:\/\//i.test(this.previewImageUrl)) {
  //           this.previewImageUrl = 'https://' + this.previewImageUrl;
  //           this.existingImage = this.previewImageUrl
  //         }

  //         // Check if the previewImageUrl is empty or undefined
  //         if (!this.previewImageUrl) {
  //           this.existingImage= this.defaultImage;
  //         }

  //         this.existingImage = this.previewImageUrl; // Use the modified URL

  //         this.loading = false;
  //         this.isImageFromServer = this.existingImage !== this.defaultImage;
  //         // Rest of your code...
  //       } else {
  //         console.log('Failed', "Unable to fetch standards", 'error');
  //       }
  //     },
  //     (error: any) => {
  //       console.log("Error", error.message, "error");
  //     }
  //   );
  // }

  getColumnClass(numItems: number): string {
    if (numItems === 1) {
      return 'col-md-6 col-sm-6 col-lg-4 col-xl-4';
    } else {
      return 'col-md-6 col-sm-6 col-lg-6 col-xl-6';
    }
  }


  showAssessorsList() {
    this.showAssessors = !this.showAssessors;
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


  // downloadCertificate(fileUrl: string, fileType: string) {
  //   if (fileType === 'PDF') {
  //     const traServerBaseUrl = 'https://test-api.ekenya.co.ke/tra-backend';
  //     const normalizedFileUrl = fileUrl.replace("10.20.2.19:7600", traServerBaseUrl);

  //     console.log(normalizedFileUrl);
  //     const link = document.createElement('a');
  //     link.href = normalizedFileUrl;
  //     link.target = '_blank';
  //     link.click();
  //   }

  // }


  downloadCertificate(fileUrl: string, fileType: string) {
    if (fileType === 'PDF') {
      const traServerBaseUrl = 'https://test-api.ekenya.co.ke/tra-backend';
      const normalizedFileUrl = fileUrl.replace("10.20.2.19:7600", traServerBaseUrl);

      // Initiating the download
      const link = document.createElement('a');
      link.href = normalizedFileUrl;
      link.target = '_blank';
      link.click();

      this.standard.downloadCount += 1;
      // console.log(this.standard.downloadCount)
    }
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
    this.formC.reset()
  }

  onSubmit(): any {
    this.isLoading = true;
    let email = JSON.parse(localStorage.getItem('data')!)['user']['businessEmail'];
    const model = {
      email,
      standardId: this.standardId,
      comment: this.forms.value.comment,
    };
    // console.log(model)
    this.httpService.customerPortalPosts(`standard/portal/comments/add`, model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.isLoading = false;
          this.activeModal.close('success');
          Swal.fire('Comment Added Successfully',
            'success').then(r => console.log(r))
          this.forms.reset()
          this.loadData()
          this.isLoading = false;
        } else {
          this.activeModal.close('error');
          this.forms.reset()
          Swal.fire('Add Comment Failed, Try Again',
            'error').then(r => console.log(r))
          this.isLoading = false;
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
      standardId: this.standardId,
      name: this.form.value.name,
      phoneNumber: this.form.value.phoneNumber,
      occupation: this.form.value.occupation,
      purpose: this.form.value.purpose,
      email: this.form.value.email,
    };

    // console.log(model)
    this.httpService.customerPortalPosts(`standard/request`, model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.isLoading = false;
          this.hideRequestForm()
          this.loadData()
          Swal.fire('Standard Request Made Successfully',
            'success').then(r => console.log(r))
        } else {
          this.hideRequestForm()
          Swal.fire('Standard Request Failed, Try Again',
            'error').then(r => console.log(r))
          this.isLoading = false;
        }
      },
      (error: any) => {
        this.hideRequestForm()
        Swal.fire('Request Standard error',
          'error')
        this.isLoading = false;
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

  onleaveComment() {
    this.isLoading = true;
    const model = {
      name: this.formC.value.name,
      phone_number: this.formC.value.phone_number,
      subject: this.formC.value.subject,
      message: this.formC.value.message,
      email: this.formC.value.email,
    };
    // console.log(model)
    this.httpService.customerPortalPost(`api/v1/auth/customerEnquirer`, model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.hideLeaveCommentForm();
          this.loadData()
          Swal.fire('Customer Enquire Successfully',
            'success').then(r => console.log(r))
        } else {
          this.hideLeaveCommentForm();
          Swal.fire('Customer Enquire  Failed, Try Again',
            'error').then(r => console.log(r))
          this.isLoading = false;
        }
      },
      (error: any) => {
        this.hideLeaveCommentForm();
        Swal.fire('Customer Enquire error',
          'error')
        this.isLoading = false;
      }
    );
  }

  openModal(modalContent: any) {
    this.modalRef = this.modal.open(modalContent, { centered: true, size: "md" });
  }

  closeModal() {
    this.activeModal.close();
  }
}
