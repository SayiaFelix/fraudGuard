import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-add-role',
    templateUrl: './add-role.component.html',
    styleUrls: ['./add-role.component.scss']
})
export class AddRoleComponent implements OnInit {

    @Input() title: any;
    @Input() formData: any;
    public loading = false;
    public hasErrors = false;
    public errorMessages: any;
    public form: FormGroup;
    public addRole$:Observable<any>

    constructor(
        public activeModal: NgbActiveModal,
        public fb: FormBuilder,
        private _httpService: HttpService) {
    }

    ngOnInit() {

      console.log("this.formData");
      console.log(this.formData);

        this.form = this.fb.group({
            roleName: [this.formData ? this.formData.roleName : '', [Validators.required]],
            description: [this.formData ? this.formData.description : '', [Validators.required]],
            is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
        });
       

  
    }

    public submitData(): void {
        if (this.formData) {
            this.saveChanges();
        } else {
            this.createRecord();
        }
        this.loading = true;
    }

    public closeModal(): void {
        this.activeModal.dismiss('Cross click');
    }

    private createRecord(): any {
        const model={
            name:this.form.value.roleName,
            remarks:this.form.value.description
        }
        this.addRole$ = this._httpService.mobileBankingPost("api/v1/admin/role/add",model).subscribe(
            (result: any) => {
                if (result.status === 200) {
                  this.activeModal.close('success');
                  Swal.fire('role created successfully',result.message,'success')
                  .then(r=>console.log(r))
                  console.log('result')
                } else {
                  this.activeModal.close('error');
                  Swal.fire(result.message,'error')
                  .then(r =>console.log(r))
                }
              }
          );
    }

    private saveChanges(): any {
     const model={
        roleId:this.formData.id,
        name:this.form.value.roleName,
        remarks:this.form.value.description
     }
     this._httpService.mobileBankingPost('api/v1/admin/role/edit',model)
     .subscribe(
        (result:any) =>{
            if (result.status==200){
                this.activeModal.close('success')
                Swal.fire('role edited successfully',result.mesage,'success')
                .then(r=>console.log(r))
            }
            else{
                this.activeModal.close('error')
                Swal.fire('failed','Unable to edit role','error')
                .then(r=>console.log(r))
            }
        }
     )
    }


}
