import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, map, Observable, throwError } from 'rxjs';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-change-profile-modal',
  templateUrl: './change-profile-modal.component.html',
  styleUrls: ['./change-profile-modal.component.scss']
})
export class ChangeProfileModalComponent implements OnInit {

  @Input() title: any;
  @Input() formData: any;
  @Input() userId:any;
  public loading = false;
  public hasErrors = false;
  public errorMessages = "";
  public form: FormGroup;
  public editUser$: Observable<any>;
  public allProfiles: any = [];
  public changeProfile$: Observable<any>;
  constructor(
    public activeModal: NgbActiveModal,
    public fb: FormBuilder,
    private httpService: HttpService,
    public globalService: GlobalService) {
  }
  ngOnInit(): void {
    this.form = this.fb.group({
      profile: ['', [Validators.nullValidator]]
    });
 localStorage.setItem('name','Lilian')

    const model = {
      page: 0,
      size: 50
    }

    this.changeProfile$ = this.httpService.mobileBankingPost('api/v1/admin/profile/get/all',
      model)
      .pipe(
        catchError((error: any) => {
          Swal.fire('Failed', 'Unable to fetch profiles', 'error')
          return throwError(error);
        }),
        map((res: any) => {
          if (res.status === 200) {
            this.allProfiles = res.data;
          } else {
            Swal.fire('Failed', res.message, 'error')
          }
        }))

  }

  public submitData(): void {
    this.saveChanges();

  }
  saveChanges() {

    const model = {
    "id": this.userId,
    "profileId":this.form.value.profile
    }

    this.changeProfile$ = this.httpService.mobileBankingPost('api/v1/admin/user/update',
      model)
      .pipe(
        catchError((error: any) => {
          Swal.fire('Failed', "Unable to update profile", 'error')
          return throwError(error);
        }),
        map((res: any) => {
          if (res.status === 200) {
            this.activeModal.close("success");
          } else {
            Swal.fire('Failed', res.message, 'error')
          }
        }))
  }


  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

}

