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

  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';
  images: string[];
  currentIndex: number;
  changeIndex: (index: any) => void;
  public standardId: number;
  showLeaveCommentForm: boolean = false;
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

  ) {
    this.downloadLink = this.sanitizer.bypassSecurityTrustUrl(this.brochureUrl);
    this.form = fb.group({
      // email: ['',Validators.compose([Validators.required, CustomValidators.email])],
      // occupation: ['',Validators.compose([Validators.required])],
      // purpose: ["", Validators.compose([Validators.required])],
      comment: ["", Validators.compose([Validators.required])],
      // phoneNumber: ["", Validators.compose([Validators.required])],
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
            if (this.parts.length > 0) {
              this.selectedPart = this.parts[0];
            }
          } else {
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
  }
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
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
          // this.file = res['data']['standard']['files'];

          console.log(this.standard);
          console.log('parts', this.parts);
          console.log('terms', this.terms);
          // console.log(this.file);
          // console.log(this.previewImageUrl);
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

  // downloadCertificate(): void {
  //   if (this.previewImageUrl) {
  //     // Create an anchor element and initiate the download
  //     const link = document.createElement('a');
  //     link.href = this.previewImageUrl;
  //     link.download = 'assets/images/certificate.png'; 
  //     link.click();
  //   } else {
  //     console.error('Preview image URL not available.');
  //   }
  // }


  // Function to initiate the download of the certificate
  // downloadCertificate(): void {
  //   if (this.previewImageUrl) {
  //     const certificateUrl = this.previewImageUrl;
  //     const certificateFileName = 'certificate.png';

  //     // Create a Blob from the fetched certificate data and initiate the download
  //     fetch(certificateUrl)
  //       .then((response) => response.blob())
  //       .then((blob) => {
  //         const blobUrl = URL.createObjectURL(blob);
  //         const link = document.createElement('a');
  //         link.href = blobUrl;
  //         link.download = certificateFileName;
  //         link.click();
  //       })
  //       .catch((error) => {
  //         console.error('Error fetching the certificate data:', error);
  //       });
  //   } else {
  //     console.error('Certificate data is not available.');
  //   }
  // }

  downloadCertificate(): void {
    if (this.previewImageUrl) {
      const certificateUrl = this.previewImageUrl;
      const certificateFileName = 'certificate.png';

      // Extract the relative path from the certificate URL
      const relativePathRegex = /\/\/[^/]+(\/.+)/;
      const matches = certificateUrl.match(relativePathRegex);
      if (!matches || matches.length < 2) {
        console.error('Invalid certificate URL:', certificateUrl);
        return;
      }
      const relativePath = matches[1];

      // Create a Blob from the fetched certificate data and initiate the download
      fetch(relativePath)
        .then((response) => response.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = certificateFileName;
          link.click();
        })
        .catch((error) => {
          console.error('Error fetching the certificate data:', error);
        });
    } else {
      console.error('Certificate data is not available.');
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
  }

  showDescription(part: any) {
    this.selectedPart = part;
  }

  onSubmit(): any {
    this.isLoading = true;
    let email = JSON.parse(localStorage.getItem('data')!)['user']['businessEmail'];
    const model = {
      email,
      standardId: this.standardId,
      comment: this.form.value.comment,
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

  onleaveComment() { }

  openModal(modalContent: any) {
    this.modalRef = this.modal.open(modalContent, { centered: true, size: "md" });
  }

  closeModal() {
    this.activeModal.close();
  }
}
