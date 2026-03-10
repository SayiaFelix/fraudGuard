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
import { NgbActiveModal, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { NotificationService } from "../../../shared/services/NotificationService";
import { InboxItem } from '../../pages/mobile-banking/requests/list-requests/list-requests.component'; // Adjust path if needed
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';
import Swal from "sweetalert2";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  userData$: Observable<any>;
  profile: string | null;
  ChangePassword: boolean = false;

  companyEmail: string | null;
  licenceNumber: string | null;
  county: string | null;

  public modalRef: NgbModalRef;
  public form: FormGroup;

  selectedLanguage: any = 'English';
  selectedLanguageFlag: any = 'assets/images/flags/us.svg';
  public notifications: InboxItem[] = [];

  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;

  public showingPassword = false;
  inputType = 'password';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    fb: FormBuilder,
    private translate: TranslateService,
    private router: Router,
    private httpService: HttpService,
    public activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private notificationService: NotificationService
  ) {
    this.form = fb.group({
      password: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
      newPassword: ['', Validators.compose([Validators.required, Validators.minLength(8), this.complexPasswordValidator()])],
      confirmPassword: ['', Validators.compose([Validators.required, Validators.minLength(8)])],
    },
    {
      validators: this.MatchPassword('newPassword', 'confirmPassword')
    });
  }

  ngOnInit(): void {
    
    this.notificationService.currentNotifications.subscribe((notifications: InboxItem[]) => {
      this.notifications = notifications;
    });

    this.profile = "FinGuard AI System";
    this.userData$ = of({ profile: this.profile });
  }


  MatchPassword(passName: string, confirmPassName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[passName];
      const matchingControl = formGroup.controls[confirmPassName];
      if (matchingControl.errors && !matchingControl.errors['MatchPass']) {
        return
      }
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ MatchPassword: true });
      }
      else {
        matchingControl.setErrors(null);
      }
    }
  }

  complexPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
      const isComplex = hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
      return isComplex ? null : { complexPassword: true };
    };
  }
  
  openChangePassword(){
    this.ChangePassword = !this.ChangePassword;
  }

  hideChangePassForm() {
    this.ChangePassword = false;
    this.form.reset();
  }

  // This function is still called by your HTML, so we keep it.
  updateNotificationList() {
    console.log("Notification dropdown toggled");
  }

  toggleSidebar(e: Event) {
    e.preventDefault();
    this.document.body.classList.toggle('sidebar-open');
  }

  onLogout(e: Event) {
    e.preventDefault();
    localStorage.clear();
    this.router.navigate(['/auth/login']);
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
    this.router.navigateByUrl(`/fraudsentinelAi/user/inbox`); 
  }

  onSubmit(e: Event) {
    e.preventDefault();
    this.setPassword();
  }

  setPassword(){
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Change Password';

    this.modalRef.componentInstance.body= "Do you want to Set this as your new password?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        
      }
    });
  }

  openModal(modalContent: any) {
    this.modalRef = this.modalService.open(modalContent, {centered: true, size:"md"});
  }
  
  closeModal() {
    if (this.activeModal) {
      this.activeModal.close();
    }
  }

  toggleShowPassword() {
    this.showingPassword = !this.showingPassword;
    this.inputType = this.showingPassword ? 'text' : 'password';
  }

  showForm(){
    console.log(this.form);
  }
}