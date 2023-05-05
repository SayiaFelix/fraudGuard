import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from "sweetalert2";

@Component({
    selector: 'app-add-workflow',
    templateUrl: './add-workflow.component.html',
    styleUrls: ['./add-workflow.component.scss']
})
export class AddWorkflowComponent implements OnInit {

  processes:any[]

    @Input() title: any;
    @Input() formData: any;
    @Input() workflowId:any;
    public loading = false;
    public hasErrors = false;
    public errorMessages: any;
    public form: FormGroup;
    public imageFile: File;

    public allProcesses: any;

    constructor(
        public activeModal: NgbActiveModal,
        public fb: FormBuilder,
        private httpService: HttpService) {
    }

    ngOnInit() {


      this.loadAllProcesses();

      console.log("this.formData");
      console.log(this.formData);

        this.form = this.fb.group({
            name: [this.formData ? this.formData.name : '', [Validators.required]],
            process: [this.formData ? this.formData.process : '', [Validators.required]],
            remarks: [this.formData ? this.formData.remarks : '', [Validators.nullValidator]],
            status: [this.formData ? this.formData.status : '', [Validators.nullValidator]]
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
        process: this.form.value.process,
        remarks: this.form.value.remarks
      };

      this.httpService.mobileBankingPost('api/v1/admin/workflow/create', model).subscribe(
        (result: any) => {
          if (result.status === 200) {
            this.activeModal.close('success');
            Swal.fire('Success',result.mesage, "success")
              .then(r => console.log(r))
            console.log('result')
          } else {
            this.activeModal.close('error');
            Swal.fire('Error', result.message, "error")
              .then(r =>console.log(r))
          }
        }
      );
    }

  private saveChanges(): any {

    const model = {
      id: this.formData.id,
      name: this.form.value.name,
      remarks: this.form.value.remarks,
      process: this.form.value.process
    }

    this.httpService.mobileBankingPost('api/v1/admin/workflow/update', model)
      .subscribe(
        (result: any) => {
          if (result.status == 200) {
            this.activeModal.close('success')
            Swal.fire('workflow updated',result.message,'success')
       .then (r=>console.log(r))

     }
     else{
      this.activeModal.close('error')
       Swal.fire('failed','workflow update failed','error')
       .then(r=>console.log(r))
     }
   }

   )

    }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  private loadAllProcesses() {
    const model = {
      page: 0,
      size: 50

    }

    this.httpService.mobileBankingPost('api/v1/admin/role/AllProcesses', model)
      .subscribe(
        (result: any) => {
          if (result.status == 200) {
            this.allProcesses = result.data;

          }
          else{
            this.activeModal.close('error')
            Swal.fire('failed','workflow update failed','error')
              .then(r=>console.log(r))
          }
        }

      )
  }
}
