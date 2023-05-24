import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-workflow-step',
  templateUrl: './add-workflow-step.component.html',
  styleUrls: ['./add-workflow-step.component.scss']
})
export class AddWorkflowStepComponent implements OnInit {
  selectedprofiles: any = null;
  selectedroles: any = null;
  profiles: any[] = ['System Admin', 'Corporate Admin'];
  users: any[] = ['Michael', 'Lilian'];
  @Input() title: any;
  @Input() formData: any;
  @Input() workflowId: any;
  public loading = false;
  public hasErrors = false;
  public errorMessages: any;
  public allProfiles: any;
  public workflowForm: FormGroup;
  public imageFile: File;
  public form: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    public fb: FormBuilder,
    private _httpService: HttpService) {
  }

  ngOnInit() {

    console.log(this.workflowId);

    this.fetchAllProfiles();

    this.workflowForm = this.fb.group({
      stepNumber:[this.formData ? this.formData.id:'', [Validators.required]],
      stepName: [this.formData ? this.formData.stepName : '', [Validators.required]],
      remarks: [this.formData ? this.formData.remarks : '', [Validators.required]],
      requiredRoleId: [this.formData ? this.formData.requiredRoleId : '', [Validators.required]],

  });
  }
  fetchAllProfiles() {
    const model = {
      page:0,
      size:50
    };

    this._httpService.mobileBankingPost('api/v1/admin/profile/get/all', model)
      .subscribe(
        (result: any) => {
          if(result['status'] === 200){
             this.allProfiles = result['data']
          } else {
            Swal.fire("Error", "Unable to Fetch profiles", "error");
          }
        })
    }


  onAdd(item: any) {
    console.log('tag added: value is ' + item.value);
  }

  onSelect(item: any) {
    console.log('tag selected: value is ' + item);
  }

  onTextChange(text: any) {
    console.log('text changed: value is ' + text);
  }

  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

  public submitData(): void {
    if (this.formData) {
      this.editRecord();
    } else {
      this.createRecord();
    }
    this.loading = true;
  }


  private editRecord(): any {
    const model={
      id:this.workflowForm.value.stepNumber,
      stepName:this.workflowForm.value.stepName,
      remarks:this.workflowForm.value.remarks,
      workFlowId:this.workflowId,
      requiredRoleId:this.workflowForm.value.requiredRoleId
    }
  this._httpService.mobileBankingPost('workflow/update/step',model).subscribe(
    (result:any) =>{
      this.activeModal.close('success')
      if(result.status === 200){
         Swal.fire('step updated successfully',result.message,'success')
         .then(r=>(console.log(r)))
      }
      else{
        this.activeModal.close('error')
        Swal.fire('failed','unable to update step','error')
      }
    }
  )

  }

  private createRecord(): any {
    const model={
      id: this.workflowForm.value.stepNumber,
      stepName:this.workflowForm.value.stepName,
      remarks:this.workflowForm.value.remarks,
      workFlowId:this.workflowId,
      requiredRoleId: this.workflowForm.value.requiredRoleId,
    }
    this._httpService.mobileBankingPost('workflow/create/step',model).subscribe(
      (result:any) =>{
        this.activeModal.close('success')
        if(result.status === 200){
           Swal.fire('step created successfully',result.message,'success')
           .then(r=>(console.log(r)))
        }
        else{
          this.activeModal.close('error')
          Swal.fire('failed','unable to create step','error')
        }
      }
    )


  }

}
