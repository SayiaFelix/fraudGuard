import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-add-workflow-step',
    templateUrl: './add-customer.component.html',
    styleUrls: ['./add-customer.component.scss']
})
export class AddCustomerComponent implements OnInit {

    @Input() title: any;
    @Input() formData: any;
    public loading = false;
    public hasErrors = false;
    public errorMessages: any;
    public form: FormGroup;
    public imageFile: File;

    constructor(
        public activeModal: NgbActiveModal,
        public fb: FormBuilder,
        private _httpService: HttpService) {
    }

    ngOnInit() {

      console.log("this.formData");
      console.log(this.formData);

        this.form = this.fb.group({
            name: [this.formData ? this.formData.name : '', [Validators.required]],
            process: [this.formData ? this.formData.process : '', [Validators.required]],
            remarks: [this.formData ? this.formData.remarks : '', [Validators.nullValidator]]
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
        name:this.form.value.name,
        process:this.form.value.process,
        remarks:this.form.value.remarks
        
      }
      this._httpService.mobileBankingPost('api/v1/admin/workflow/get/workflows',model).
      subscribe(
        (res:any) =>{
          if (res.status === 200){
              this.activeModal.close('success')
              Swal.fire('success','workflow created successfully','success')
              .then ( r=>console.log(r))
          }
          else{
            this.activeModal.close('error')
            Swal.fire('error','unable to create workflow','error')
            .then (r=>console.log(r))
          }
        }
      )
    }

    private saveChanges(): any {

    const model={
      id:this.form.value.id,
      name:this.form.value.name,
      remarks:this.form.value.remarks
    }

    this._httpService.mobileBankingPost('api/v1/admin/workflow/update',model)
    .subscribe(
      (res:any) =>{
        if (res.status===200){
          this.activeModal.close('success')
          Swal.fire('success','workflow updated successfully','success')
          .then(r=>(console.log(r)))
        }
        else{
          this.activeModal.close('error')
          Swal.fire('error','unable to update workflow','error')
          .then(r=>(console.log(r)))
        }
      }
    )
    }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }
}
