import {Component, OnInit, ViewChild,} from '@angular/core';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { APP_BASE_HREF, DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {AbstractControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';
import {DataExportationService} from 'src/app/shared/services/data-exportation.service';
import {HttpService} from 'src/app/shared/services/http.service';
import { CustomValidators } from 'ngx-custom-validators';
import Swal from 'sweetalert2';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Inject } from '@angular/core';
import { APP_BASE_HREF_TOKEN } from '../constants';
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
  defaultProfileImage: SafeResourceUrl = "assets/images/5.jpg";
  existingImage: SafeResourceUrl;
  hasError: boolean = false;
  isLoading: boolean = false;
  errorMessage: string;
  modalRef: NgbModalRef;
  loading:boolean;
  perPage = 5;
  page = 1
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

  constructor(private router: Router,
    @Inject(APP_BASE_HREF_TOKEN) private appBaseHref: string,
    fb: FormBuilder,
    public modal: NgbModal,
    private httpService: HttpService,
    private sanitizer: DomSanitizer,
    public activeModal: NgbActiveModal,) {
      this.form = fb.group({
        name: ["", Validators.compose([Validators.required])],
        email: ['',Validators.compose([Validators.required, CustomValidators.email])],
        subject: ['',Validators.compose([Validators.required])],
        message: ["", Validators.compose([Validators.required])],
        phone_number: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
      });
    }

  ngOnInit(): void {
    this.loadData()
  }

  phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneNumber = control.value;
    // Regular expression to check if the phone number starts with "254" and is followed by 9 digits.
    const phonePattern = /^254\d{9}$/;
  
    return phonePattern.test(phoneNumber) ? null : { invalidPhoneNumber: true };
  }
  showLeaveCommentForm: boolean = false;
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
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }

  // openStandardInNewTab(standardId: number) {
  //   const baseUrl = this.appBaseHref || 'tra-customer-portal';
  //   const urlTree = this.router.createUrlTree([baseUrl, 'standards', standardId]);
  //   const url = this.router.serializeUrl(urlTree);
  //   window.open(url, '_blank');
  // }

  openStandardInNewTab(standardId: number) {
    const baseUrl = this.appBaseHref || 'tra-customer-portal';
    const urlTree = this.router.createUrlTree([baseUrl, 'standards', standardId]);
    const url = this.router.serializeUrl(urlTree);
  
    if (document.getElementsByTagName('base')[0].hasAttribute('href')) {
      const win = window.open();
      if (win) {
        win.opener = null;
        win.location.href = url;
      }
    } else {
      window.open(url, '_blank');
    }
  }

  // openStandardInNewTab(standardId: number) {
  //   const urlTree = this.router.createUrlTree(['/standards', standardId]);
  //   const url = this.router.serializeUrl(urlTree);
  //   window.open(url, '_blank');
  // }
  // viewStandard(standardId: number) {
  //   this.router.navigate(['/standards', standardId]);
  // }
  private loadData(): any {
    this.loading = true;
    let model = {
      page: this.page - 1,
      size: this.perPage
    };
    this.httpService.customerPortalPost(`api/v1/portal/getStandards`, {}).subscribe(
      (res: any) => {
        if (res.status == '00') {
          this.standards = res['data'];
          this.standards.forEach((standard: any) => {
            if (standard.preview_image_url) {
              standard.preview_image_url = 'http://' + standard.preview_image_url;
              standard.existingImage = this.sanitizer.bypassSecurityTrustResourceUrl(standard.preview_image_url);
            } else {
              standard.existingImage = this.defaultProfileImage;
            }
          });
 
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
          this.loadData()
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
