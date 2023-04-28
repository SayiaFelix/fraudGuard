import {Component, Input, OnDestroy, OnInit, TemplateRef} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import { NgbModal,NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';
import {ConfirmDialogComponent} from "../../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {catchError, map, Observable, Subscription, throwError} from "rxjs";
import { ChangeProfileModalComponent } from '../change-profile-modal/change-profile-modal.component';

@Component({
  selector: 'app-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss'],
})
export class ViewUserComponent implements OnInit, OnDestroy {
  public myProductList = [
    {
      icon: '',
      name: 'Email:test@gmail.com',
      value: 8,
      text: 'danger',
    },
    {
      icon: '',
      name: 'Phone Number:0734567865',
      text: 'danger',
      value: 8,
    },
  ];
  breadCrumbItems: Array<{}>;
  rows: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'AuditMessage', prop: 'AuditMessage' },
    { name: 'CreatedOn', prop: 'CreatedOn' },
    // { name: 'IsActive', prop:'isActive' },
    // { name: 'Actions', prop: 'id' }
  ];

  // public productDetails = {
  //   columns = [
  //     { name: 'ID', prop: 'id' },
  //     { name: 'BranchName', prop:'branchName' },
  //     { name: 'BranchCode', prop:'branchCode' },
  //     { name: 'IsActive', prop:'isActive' },
  //     { name: 'Actions', prop: 'id' }
  //   ];
  // };
  public mainProduct: any;
  public subcategoryTitle: any;

  @Input() formData: any;
  public form: FormGroup;

  ColumnMode = ColumnMode;
  public currentUser:any;
  public imageFile: File;
  public modalRef: NgbModalRef;
  public userId: number;


  public userDetails: any;
  public resetPassword$: Observable<any>;

  subs: Subscription[] = [];


  constructor(
    private httpService: HttpService,
    public globalService: GlobalService,
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
  ) {

  }

  ngOnInit(): void {

    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        this.userId = params.id;
      }
    });

    this.loadData();

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [
        this.formData ? this.formData.description : '',
        [Validators.required],
      ],
      longDescription: [
        this.formData ? this.formData.longDescription : '',
        [Validators.required],
      ],
      feature: [this.formData ? this.formData.feature : ''],
      requirement: [this.formData ? this.formData.requirement : ''],
    });
  }

  private loadData(): any {

    const model = {
      id: this.userId
    }

    let loadUserDetails = this.httpService
      .mobileBankingPost('api/v1/admin/user/id', model)
      .subscribe((res: any) => {
        if (res.status === 200) {
            this.userDetails = res.data;
        } else {

        }
      }, (error: any) => {
        Swal.fire('Failed', error, 'error')
      });

    this.subs.push(loadUserDetails);

  }

  isAsideNavCollapsed: any;

  openAddProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService
      .open(content, { centered: true, size: 'md' })
      .result.then((result) => {
        console.log('Modal closed' + result);
      })
      .catch((res) => {});
  }

  openChangeProfileModal() {
    this.modalRef = this.modalService.open( ChangeProfileModalComponent, {centered: true} );
    this.modalRef.componentInstance.title = 'Change Profile';

    this.modalRef.componentInstance.body = "Do you want to change this user's profile?";
    this.modalRef.componentInstance.userId = this.userId;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        Swal.fire('Update Successful',
          'Profile has been updated successfully.',
          'success')
        this.loadData();
      }
    })


  }
  openResetPasswordModal() {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Reset Password';

    this.modalRef.componentInstance.body = "Do you want to reset this user's password?";

    this.modalRef.result.then((result) => {
      if (result === 'success') {


        let model = {
          userId: this.userId
        }

        this.resetPassword$ = this.httpService.mobileBankingPost('api/v1/admin/user/reset',
          model).pipe(
            catchError((error: any) => {
              Swal.fire('Failed', "Password could not be reset", 'error')
              return throwError(error);
            }),
            map((res: any) => {
              if (res.status === 200) {
                setTimeout(() => {
                  Swal.fire('Success', 'User Password Reset Successfully.', 'success')
                  this.router.navigate(['/mobile-banking/Users/list-users']);
                }, 10);
              } else {
                Swal.fire('Failed', res.message, 'error')
              }
            }))
      }
    })
  }
  openEnableUserModal(){
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Unblock user';
    this.modalRef.componentInstance.body = 'Do you want to unblock this User?';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        // on success, send request to backend
        const model = {
          id: this.userId
        };

        this.httpService.mobileBankingPost('api/v1/admin/user/unblock', model).subscribe(
            (result:any)=> {
              if (result.status === 200) {
                this.loadData();
                Swal.fire('Success','user unblocked successfully','success')
                .then(r =>(console.log(r)))
                this.router.navigate(['/mobile-banking/Users/list-users']);
              } else {
               Swal.fire(result.message.error)
               .then(r =>(console.log(r)))
              }
            }
        );


      }
    });
  }
  openDisableUserModal() {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Block User';

    this.modalRef.componentInstance.body = "Do you want to block this user?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {

        let model = {
          "id": this.userId
        }

         this.httpService.mobileBankingPost('api/v1/admin/user/block',
          model).subscribe((res: any) => {

          if (res.status === 200) {
            setTimeout(() => {
              Swal.fire('Blocked Successfully', 'User has been blocked successfully.', 'success')
              this.router.navigate(['/mobile-banking/Users/list-users']);
              this.loadData();
            }, 10);
          } else {
            Swal.fire('Block Failed', res.message, 'error')
          }
        }, (error: any) => {
          Swal.fire('Block Failed', 'User deletion failed.', 'error')
        });


      }
    })
  }
  openDeleteUserModal() {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Delete User';

    this.modalRef.componentInstance.body = "Do you want to delete this user?";
    this.modalRef.result.then((result) => {
      if (result === 'success') {

        let model = {
          id: this.userId
        }

        this.httpService.mobileBankingPost('api/v1/admin/user/delete',
          model).subscribe((res: any) => {

          if (res.status === 200) {
            setTimeout(() => {
              Swal.fire('Deleted Successfully', 'User has been deleted successfully', 'success')
              this.router.navigate(['/mobile-banking/Users/list-users']);
            }, 10);
          } else {
            Swal.fire('Deletion Failed', res.message, 'error')
          }
        }, (error: any) => {
          Swal.fire('Deletion Failed', 'User deletion failed.', 'error')
        });


      }
    })
  }

  openEditProductSubcategoryModal(content: TemplateRef<any>) {
    this.modalService
      .open(content, { centered: true, size: 'md' })
      .result.then((result) => {
        console.log('Modal closed' + result);
      })
      .catch((res) => {});
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  private createRecord(): any {
    const model = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      middleName: this.form.value.middleName,
      phoneNumber: this.form.value.phoneNumber,
      email: this.form.value.email,
      // position: this.form.value.position,
      profileId: this.form.value.profile,
    };

    // this.httpService
    //   .mobileBankingPost('api/v1/corporate/admin/create', model)
    //   .subscribe((result: any) => {
    //     if (result.status === 200) {
    //     } else {
    //     }
    //   });
  }

  getFullName(firstName: any, lastName: any) {
    let fullname: string = `${firstName} ${lastName}`;

    fullname = fullname.slice(0, 16)
    return fullname;
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe())
  }
}
