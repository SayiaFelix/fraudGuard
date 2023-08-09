import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CustomValidators } from 'ngx-custom-validators';
import { Observable, map, of } from 'rxjs';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from "sweetalert2";
@Component({
  selector: 'app-all-standards',
  templateUrl: './all-standards.component.html',
  styleUrls: ['./all-standards.component.scss']
})
export class StandardsComponent implements OnInit {


  defaultImage: SafeResourceUrl = "assets/images/6.jpg";
  defaultIcon: SafeResourceUrl = "assets/images/icon.png";
  existingImage: SafeResourceUrl;
  // standards: any = []
  standards: any = [
    {
      id: '1',
      existingImage: "assets/images/3.png",
      title: 'Accommodation And Catering Establishment',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '2',
      existingImage: "assets/images/2.png",
      title: 'Meetings, Incentives, Conferences & Exhibitions Facilities And Services',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '3',
      existingImage: "assets/images/6.jpg",
      title: 'Standards For Food Safety And Hygiene Standards',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '4',
      existingImage: "assets/images/4.jpg",
      title: 'Standards For Safety And Security Standards',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '5',
      existingImage: "assets/images/5.jpg",
      title: ' Tour Guides And Hotel Employees Accommodation Standard',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '6',
      existingImage: "assets/images/3.png",
      title: 'Halal Compliance Standard For Accommodation And Catering Establishments',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '7',
      existingImage: "assets/images/7.jpg",
      title: 'Standards For Spa And Wellness Facilities',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
    {
      id: '8',
      existingImage: "assets/images/1.jpg",
      title: 'Standards For Tourism Tours & Travel Enterprises',
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    },
  ]
  SubClassData: any = [];
  // standards: Standard[] = [];
  filteredStandards: any = [];

  // SubClassData: any = [
  //   {

  //     "classId": 1,

  //     "className": "A",

  //     "subclasses": [

  //       {

  //         "subClassId": 1,

  //         "subClassName": "Hotels"

  //       },

  //       {

  //         "subClassId": 2,

  //         "subClassName": "Villas"

  //       },

  //       {

  //         "subClassId": 3,

  //         "subClassName": "Game lodges"

  //       },

  //       {

  //         "subClassId": 4,

  //         "subClassName": "Service apartments"

  //       }

  //     ]

  //   },
  //   {

  //     "classId": 2,

  //     "className": "B",

  //     "subclasses": [

  //       {

  //         "subClassId": 1,

  //         "subClassName": "Restaurants"

  //       },

  //       {

  //         "subClassId": 2,

  //         "subClassName": "Other foods and bevarages service"

  //       }

  //     ]

  //   },
  // ]
  selectedSubclassId: number | null = null;

  perPage = 100;
  page = 1
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  errorMessage: string;
  loading: boolean
  showLeaveCommentForm: boolean = false;
  selectedSubClassId: number | null = null;
  public form: FormGroup;
  modalRef: NgbModalRef;
  userData$: Observable<any>;
  profile: string | null;
  logo: string | null;
  showMenuItems: boolean = true;
  showDashbord: boolean = false;
  // filteredStandards: any;
  constructor(private router: Router,
    private httpService: HttpService,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    public modal: NgbModal,
    public activeModal: NgbActiveModal, fb: FormBuilder,) {
    this.form = fb.group({
      name: ["", Validators.compose([Validators.required])],
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['', Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      phone_number: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
    });
  }

  ngOnInit(): void {
    this.loadDatas(null)
    // this.loadData(null);
    this.getSubClassData(0);
    this.checkForToken();
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
  }
  // subClass: any | null

  phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneNumber = control.value;
    // Regular expression to check if the phone number starts with "254" and is followed by 9 digits.
    const phonePattern = /^254\d{9}$/;

    return phonePattern.test(phoneNumber) ? null : { invalidPhoneNumber: true };
  }
  private loadDatas(subClass: any | null): any {
    this.loading = true;
    let model = {
      page: this.page - 1,
      size: this.perPage
    };
    this.httpService.customerPortalPosts(`standard/portal/getall`, model).subscribe(
      (res: any) => {
        if (res.status == 200) {
          // this.standards = res['data'];
          const standard = res.data.standards.filter((request: any) => request.status === "PUBLISHED");
          this.standards = standard
          this.standards.forEach((standard: any) => {
            // Modify preview_image_url
            if (standard.previewImageUrl) {
              const filename = standard.previewImageUrl.split('?filename=')[1];
              standard.previewImageUrl = 'https://test-api.ekenya.co.ke/tra-backend/api/v1/standard/files/download?filename=' + encodeURIComponent(filename);
              standard.existingImage = this.sanitizer.bypassSecurityTrustResourceUrl(standard.previewImageUrl);
            } else {
              standard.existingImage = this.defaultImage;
            }

            // Modify preview_icon_url
            if (standard.previewIconUrl) {
              const filename = standard.previewIconUrl.split('?filename=')[1];
              standard.previewIconUrl = 'https://test-api.ekenya.co.ke/tra-backend/api/v1/standard/files/download?filename=' + encodeURIComponent(filename);
              standard.existingIcon = this.sanitizer.bypassSecurityTrustResourceUrl(standard.previewIconUrl);
              standard.iconWidth = '50px'; 
              standard.iconHeight = '40px'; 
            } else {
              standard.existingIcon = this.defaultIcon;
              standard.iconWidth = '35px';
              standard.iconHeight = '30px'; 
            }
          });

          if (subClass !== null) {
            this.filteredStandards = this.standards.filter((standard: any) => standard.enterpriseSubClass === subClass);
          } else {
            this.filteredStandards = this.standards;
          }

          console.log(this.filteredStandards);
          console.log(this.standards);
          this.loading = false;
        } else {
          console.log('Failed', 'Unable to fetch standards', 'error');
        }
      },
      (error: any) => {
        console.log('Error', error.message, 'error');
      }
    );
  }
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }

  getColumnClass(numItems: number): string {
    if (numItems === 1) {
      return 'col-md-4 col-sm-6 col-lg-4 col-xl-4';
    } else {
      return 'col-md-4 col-sm-6 col-lg-3 col-xl-3';
    }
  }
  // getSubClassData(): void {
  //   this.loading = true;
  //   this.httpService.getClassAndSubclassData().subscribe((res: any) => {
  //     console.log(res);
  //     if (res.data && res.data.classes) {
  //       this.loading = false;
  //       this.SubClassData = res.data.classes;
  //       console.log(this.SubClassData);
  //     } else {
  //       this.loading = false;
  //     }
  //   });
  // }

  onSubClassChange(event: any): void {
    const selectedSubClass = event.target.value;
    console.log(selectedSubClass);
    if (selectedSubClass === 'All') {
      this.filteredStandards = this.standards;
    } else {
      this.filteredStandards = this.standards.filter((std: any) => std.enterpriseSubClass === selectedSubClass);
    }

    console.log(this.filteredStandards);
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

  getSubClassData(event: number): void {
    this.loading = true;
    this.httpService
      .customerPortalPosts('standard/portal/class/getall', {})
      .subscribe((res: any) => {
        console.log(res)
        if (res.status === 200) {
          if (res.data && res.data.classes) {
            this.loading = false;
            this.SubClassData = res.data.classes;
            console.log(this.SubClassData);
          } else {
            this.loading = false;
          }
        } else {
          this.loading = false;
        }
      });
    this.loading = false;
  }

  viewStandard(standardId: number) {
    this.router.navigate(['/standards', standardId]);
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
    this.form.reset()
  }

  onleaveComment() {
    this.isLoading = true;
    const model = {
      name: this.form.value.name,
      phone_number: this.form.value.phone_number,
      subject: this.form.value.subject,
      message: this.form.value.message,
      email: this.form.value.email,
    };
    console.log(model)
    this.httpService.customerPortalPost(`api/v1/auth/customerEnquirer`, model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.hideLeaveCommentForm();
          // this.loadData()
          Swal.fire('Customer Enquire Successfully',
            'success').then(r => console.log(r))
        } else {
          this.hideLeaveCommentForm();
          Swal.fire('Customer Enquire  Failed, Try Again',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        this.hideLeaveCommentForm();
        Swal.fire('Customer Enquire error',
          'error')
      }
    );
  }

  openModal(modalContent: any) {
    this.modalRef = this.modal.open(modalContent, { centered: true, size: "md" });
  }

  closeModal() {
    this.activeModal.close();
  }

  onRegister(e: Event) {
    e.preventDefault();
    localStorage.setItem('isLoggedin', 'true');
    if (localStorage.getItem('isLoggedin')) {
      this.router.navigate(['/']);
    }
  }

}
