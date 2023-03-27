import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {catchError, map, Observable, throwError} from 'rxjs';
import {GlobalService} from 'src/app/shared/services/global.service';
import {HttpService} from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-delete-role-modal',
  templateUrl: './delete-role-modal.component.html',
  styleUrls: ['./delete-role-modal.component.scss']
})
export class DeleteRoleModalComponent implements OnInit {

  @Input() title: any;
  @Input() roleId: any;

  public loading = false;
  public hasErrors = false;
  public errorMessages = "";
  public form: FormGroup;

  public deleteRole$: Observable<any>;

  constructor(
    public activeModal: NgbActiveModal,
    public fb: FormBuilder,
    private httpService: HttpService,
    public globalService: GlobalService) {
  }

  ngOnInit(): void {

    this.form = this.fb.group({
      remark: ['', [Validators.nullValidator]]
    });

  }

  public submitData(): void {
    this.saveChanges();
  }

  saveChanges() {

    const model = {
      roleId: this.roleId,
      remarks: this.form.value.remark
    }

    this.deleteRole$ = this.httpService.mobileBankingPost('api/v1/admin/role/delete',
      model)
      .pipe(
        catchError((error: any) => {
          Swal.fire('Failed', "Unable to delete role", 'error')
          return throwError(error);
        }),
        map((res: any) => {
          if (res.status === 200) {
            this.activeModal.close('success');
            Swal.fire('success', 'role deleted successfully', 'success')
          } else {
            Swal.fire('Failed', res.message, 'error')
          }
        }))
  }


  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

}

