import {
  Component,
  OnInit,
  Inject,
  Renderer2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { HttpService } from 'src/app/shared/services/http.service';
import { map, Observable, of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import {AddProductComponent} from "../../pages/mobile-banking/products/add-product/add-product.component";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {NotificationModalComponent} from "../../../shared/components/notification-modal/notification-modal.component";
import {NotificationService} from "../../../shared/services/NotificationService";
import {Notification} from "../../../shared/services/Notification";
import {compareSegments} from "@angular/compiler-cli/src/ngtsc/sourcemaps/src/segment_marker";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  userData$: Observable<any>;
  companyEmail: string | null;
  licenceNumber: string | null;
  profile:string | null;
  companyRegistrationDate: string | null;
  county: string | null;
  taxPin: string | null;
  logo: string | null;

  public modalRef: NgbModalRef;


  // internationalization management
  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';
  public notifications: Notification[];
  enterpriseData: any;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,

    private translate: TranslateService,

    private router: Router,
    private httpService: HttpService,
    private modalService: NgbModal,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to notification service observable
    this.notificationService.castNotifications.subscribe((notifications: Notification[]) => {
      this.notifications = notifications;
    });

    this.updateNotificationList();

    // let userDetails = JSON.parse(localStorage.getItem('userData')!);
    let userDetails = {
      companyEmail: localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')!)['businessEmail'] : "test@gmail.com",
      licenceNumber: localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')!)['licenceNumber']  : "87654321",
      profile: localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')!)['user']['name']  : "Eka Hotel Nairobi",
      companyRegistrationDate: "24-12-1999",
      county: localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')!)['user']['county']  : "Nairobi",
      taxPin: "A029384794G",
    };
    if (userDetails) {
      this.companyEmail = userDetails['companyEmail'];
      this.licenceNumber = userDetails['licenceNumber'];
      this.profile = userDetails['profile'];
      this.companyRegistrationDate = userDetails['companyRegistrationDate'];
      this.county = userDetails['county'];
      this.taxPin = userDetails['taxPin'];
      this.logo =
        'https://images.unsplash.com/photo-151740421573-15263e9f9178?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80';

      this.userData$ = of(userDetails);
    } else {
      this.userData$ = this.httpService.customerUserDetails().pipe(
        map((resp) => {
          console.log(resp);
          if (resp) {
            this.companyEmail = resp[0]['email'];
            this.licenceNumber = resp[0]['licenceNo'];
            this.profile = resp[0]['enterpriseName'];
            this.companyRegistrationDate = resp[0]['enterpriseName'];
            this.county = resp[0]['country'];
            return resp[0];
          }
        })
      );
    }
  }

  updateNotificationList() {
    console.log("Nmechapa toggle")
    this.pullNotificationsList();
  }

  /**
   * Sidebar toggle on hamburger button click
   */
  toggleSidebar(e: Event) {
    e.preventDefault();
    this.document.body.classList.toggle('sidebar-open');
  }

  /**
   * Logout
   */
  onLogout(e: Event) {
    e.preventDefault();
    localStorage.clear();
    if (!localStorage.getItem('isLoggedin')) {
      this.router.navigate(['/auth/login']);
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

  openNotificationModal() {

    this.router.navigateByUrl(`/mobile-banking/workflows/my-task/${7}`);

    this.modalRef = this.modalService.open(NotificationModalComponent, {centered: true, size:"lg"});
    this.modalRef.componentInstance.title = 'Approve Create User';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
      } else {
        console.log("Error occurred")
      }
    });
  }

//   changePassword() {
// this.modalRef = this.modalService.open(NotificationModalComponent, {centered: true, size:"lg"});
//     this.modalRef.componentInstance.title = 'Approve Create User';
//     this.modalRef.result.then((result) => {
//       if (result === 'success') {
//       } else {
//         console.log("Error occurred")
//       }
//     });
//   }
  private pullNotificationsList() {

    const model = {
      userName: "maina.alex@eclectics.io"
    }

    this.httpService.mobileBankingPost('workflow/staged', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          console.log("workflow result");
          console.log(result);

          let response = result['data'].map((item: any, index: any) => {
            let res = {...item,
              stagerDetails: JSON.parse(item.stagingUserDetails)
            };
            return res;
          })

          let updatedResult = response;


          this.notificationService.updateNotifications(updatedResult);
        } else {

        }
      }
    );

  }
}
