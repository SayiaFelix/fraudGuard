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

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  userData$: Observable<any>;
  companyEmail: string;
  employeeNumber: string;
  profile:string;
  companyRegistrationDate: string;
  country: string;
  taxPin: string;
  logo: string;

  public modalRef: NgbModalRef;


  // internationalization management
  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';
  public notifications: Notification[];

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


    // let userDetails = JSON.parse(localStorage.getItem('userData')!);
    let userDetails = {
      companyEmail: "testEmail@gmail.com",
      employeeNumber: "E334",
      profile: "Admin",
      companyRegistrationDate: "24-12-1999",
      country: "Kenya",
      taxPin: "A029384794G",
    };
    if (userDetails) {
      this.companyEmail = userDetails['companyEmail'];
      this.employeeNumber = userDetails['employeeNumber'];
      this.profile = userDetails['profile'];
      this.companyRegistrationDate = userDetails['companyRegistrationDate'];
      this.country = userDetails['country'];
      this.taxPin = userDetails['taxPin'];
      this.logo =
        'https://images.unsplash.com/photo-151740421573-15263e9f9178?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80';

      this.userData$ = of(userDetails);
    } else {
      this.userData$ = this.httpService.mobileBankingGetUserDetailsAndPermissions().pipe(
        map((resp) => {
          console.log(resp);
          if (resp) {
            this.companyEmail = resp[0]['companyEmail'];
            this.employeeNumber = resp[0]['employeeNumber'];
            this.profile = resp[0]['profile'];
            this.companyRegistrationDate = resp[0]['companyRegistrationDate'];
            this.country = resp[0]['country'];
            this.taxPin = resp[0]['taxPin'];
            return resp[0];
          }
        })
      );
    }
  }

  updatedNotificationList(newList: any[]) {
    this.notificationService.updateNotifications(newList);
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

    // this.modalRef = this.modalService.open(NotificationModalComponent, {centered: true, size:"lg"});
    // this.modalRef.componentInstance.title = 'Approve Create User';
    // this.modalRef.result.then((result) => {
    //   if (result === 'success') {
    //   } else {
    //     console.log("Error occurred")
    //   }
    // });
  }
}
