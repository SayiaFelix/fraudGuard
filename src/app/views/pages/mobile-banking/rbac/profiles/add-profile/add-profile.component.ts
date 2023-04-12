import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { catchError, map, Observable, throwError } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-add-role',
    templateUrl: './add-profile.component.html',
    styleUrls: ['./add-profile.component.scss']
})
export class AddProfileComponent implements OnInit {

    @Input() title: any;
    @Input() formData: any;
    public loading = false;
    public hasErrors = false;
    public errorMessages: any;
    public form: FormGroup;
    public editProfile$: Observable<any>;

    constructor(
        public activeModal: NgbActiveModal,
        public fb: FormBuilder,
        private _httpService: HttpService) {
    }

    ngOnInit() {

      this.form = this.fb.group({
        name: [this.formData ? this.formData.name : '', [Validators.required]],
        code: [this.formData ? this.formData.code : '', [Validators.required]],
        description: [this.formData ? this.formData.remarks : '', [Validators.required]],
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
        const model = {
            name: this.form.value.name,
            remarks: this.form.value.description
        }
        this._httpService.mobileBankingPost('api/v1/admin/profile/add', model).subscribe(
            (result:any) => {
                if(result.status === 200){
                    this.activeModal.close('success');
                    Swal.fire('Success', result.message, "success")
                    .then(r => console.log(r))
                    console.log('result');
                } else 
                    this.activeModal.close('error');
                    Swal.fire('Error',"Unable to create profile","error")
                    .then(r => console.log(r))
                }
                )
            }

    private saveChanges(): any {
        const model = {
            id: this.formData.id,
            remarks: this.form.value.description
        }
        this._httpService.mobileBankingPost('api/v1/admin/profile/edit',model)
        .subscribe(
            (result:any) =>{
                if(result.status === 200){
                    this.activeModal.close('success')
                    Swal.fire('Profile edited successfully',result.data,'success')
                    .then(r=>console.log(r))
                }
                else{
                    this.activeModal.close('error')
                    Swal.fire('failed','unable to edit profile','error')
                    .then(r=>console.log(r))
                }
            }
        )
    }
}