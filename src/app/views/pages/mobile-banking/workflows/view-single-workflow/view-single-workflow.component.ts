import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpService } from "../../../../../shared/services/http.service";
import { GlobalService } from "../../../../../shared/services/global.service";
import { NgbActiveModal, NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { AddWorkflowStepComponent } from "../add-workflow-step/add-workflow-step.component";
import { ConfirmDialogComponent } from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-view-single-workflow',
  templateUrl: './view-single-workflow.component.html',
  styleUrls: ['./view-single-workflow.component.scss']
})
export class ViewSingleWorkflowComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  actions = ["Edit", "Delete"]

  columns = [
    {name:'Step Number',prop:'id'},
    { name: 'Step Name', prop: 'stepName' },
    { name: 'Remarks', prop: 'remarks' },
    { name: 'Required Role ID', prop: 'requiredRoleId' },
    // { name: 'notificationEmail', prop: 'notificationEmail'},
    // { name: 'notificationEmailMessage', prop: 'notificationEmailMessage' },
    { name: 'Updated On', prop: 'createdOn' },
    { name: 'Actions', prop: 'id' },
  ];

  allColumns = [...this.columns];


  public workflowForm: FormGroup;
  public workflowItemData: any;
  public workflowId: any;
  public workflowSteps: any = [];
  public allProfilesList: any;
  public selectedWorkflowStep: any;
  public enableEditAndDeleteButtons: boolean;

  itemSelected: boolean = false;

  // formTitle: any = 'Add Workflow Step';
  isAdd: boolean = true;

  public modalRef: NgbModalRef;
  ColumnMode = ColumnMode;
  public formData:any;

  rows: any[];

  title: string = "Step";

  loading = true;

  constructor(
    public fb: FormBuilder,
    private httpService: HttpService,
    public globalService: GlobalService,
    public activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
  ) {
  }

  ngOnInit() {

    this.enableEditAndDeleteButtons = false;

    this.activatedRoute.params.subscribe(params => {
      if (typeof params.id !== 'undefined') {
        this.workflowId = params.id;
      }
    });

    this.loadData();
    this.loadAllProfiles();

    this.workflowForm = this.fb.group({
      stepNumber:[this.formData ? this.formData.id:'', [Validators.required]],
      stepName: [this.formData ? this.formData.stepName : '', [Validators.required]],
      remarks: [this.formData ? this.formData.remarks : '', [Validators.required]],
      requiredRoleId: [this.formData ? this.formData.requiredRoleId : '', [Validators.required]],

  });


  }

  submitAddData() {

    const model = {
      id: this.workflowForm.value.id,
      stepName: this.workflowForm.value.stepName,
      remarks: this.workflowForm.value.remarks,
      requiredRoleId: this.workflowForm.value.profile,
      workFlowId: parseInt(this.workflowId, 10),
      notificationEmail: this.workflowForm.value.notificationEmail,
      notificationEmailMessage: this.workflowForm.value.notificationEmailMessage,

    };

    // Create workflow step
    this.httpService.mobileBankingPost('api/v1/admin/workflow/create/step', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          Swal.fire('success', 'step created successfully', 'success')
            .then(r => (console.log(r)))
        } else {
          Swal.fire('error', 'unable to create step', 'error')
            .then(r => (console.log(r)))
        }
      });
  }

  submitEditData() {

    const model = {

      id: this.selectedWorkflowStep.id,
      stepName: this.workflowForm.value.name,
      remarks: this.workflowForm.value.remarks,
      profileId: this.workflowForm.value.profile,
      workFlowId: parseInt(this.workflowId, 10),
      notificationEmail: this.workflowForm.value.notificationEmail,
      notificationEmailMessage: this.workflowForm.value.notificationEmailMessage,
    };

    // Update workflow step
    this.httpService.mobileBankingPost('api/v1/corporate/workflow/update/step', model).subscribe(
      (result: any) => {
        if (result.status === 200) {

          this.getWorkflowSteps();
          this.loadData();

          this.workflowForm.reset();

        } else {

        }
      });
  }

  private loadData(): any {

    this.loading = true;
    const model = {
      // id: parseInt(this.workflowId, 10)
      id: this.workflowId
    };

    this.httpService.mobileBankingPost('api/v1/admin/workflow/get/id', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.loading = false;
          this.workflowItemData = result.data;
        } else {
          Swal.fire('unable to fetch data', 'unable to fetch workflow details', 'error')
            .then(r => console.log(r))
        }

      }
    );
  }

  private loadAllProfiles(): any {
    const model = {
      page: 0,
      size: 50
    };

    this.httpService.mobileBankingPost('api/v1/admin/profile/get/all', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.allProfilesList = result.data;
          this.getWorkflowSteps();
        } else {

        }


      });
  }

  private getWorkflowSteps() {
    const model = {
      id: this.workflowId,
    };

    this.httpService.mobileBankingPost('api/v1/admin/workflow/get/workflowSteps', model).subscribe(
      (result: any) => {
        if (result.status === 200) {

        let records = result.data.map((item:any) => {

            let profile = this.allProfilesList.find((profile:any) => {
              return profile.id === item.requiredRoleId
            })
            return {...item, requiredRoleId: profile.name }
          })

          this.rows = records;
        } else {
          Swal.fire('error fetching data', 'unable to fetch data', 'error')
            .then(r => console.log(r))
        }
      }
    );
  }

  getStepClicked(item: any) {
    this.selectedWorkflowStep = item;


    if (this.selectedWorkflowStep) {
      this.enableEditAndDeleteButtons = true;
    }
  }

  revertToAdd() {
    // this.formTitle = 'Add Workflow Step';

    this.workflowForm.patchValue({
      profile: '',
      name: '',
      remarks: '',
      isActive: '',
      notificationEmail: '',
      notificationEmailMessage: ''

    });

    this.isAdd = true;
  }
  navigateToViewProduct(data: any) {

  }

  // deleteWorkflowStep(formData:any) {
  //   this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true });
  //   this.modalRef.componentInstance.title = 'Delete Workflow Step'
  //   this.modalRef.componentInstance.body = "Do you want to delete this workflow step?";
  //   this.modalRef.result.then((result) => {
  //     if (result === 'success') {
  //       Swal.fire('Deleted Successfully', 'Workflow Step Deleted successfully.', 'success')
  //         .then
  //         (r => {
  //         })
  //     } else {
  //       console.log("Error occurred")
  //     }
  //   });
  // }

  openAddModal() {
    this.modalRef = this.modalService.open(AddWorkflowStepComponent, { centered: true });
    this.modalRef.componentInstance.title = 'Add Workflow Step';
    this.modalRef.componentInstance.workflowId = this.workflowId;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getWorkflowSteps();
      } else {
        console.log("Error occurred")
      }
    });
  }
  openEditModal(formData: any) {
    this.modalRef = this.modalService.open(AddWorkflowStepComponent, { centered: true });
    this.modalRef.componentInstance.title = 'Edit Workflow Step';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.workflowId = this.workflowId;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getWorkflowSteps();
      } else {
        console.log("Error occurred")
      }
    });
  }
  openDeleteWorkflowStep(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, { centered: true });
    this.modalRef.componentInstance.title = 'Delete Workflow step';
    this.modalRef.componentInstance.body = 'Do you want to delete this workflow step?'
    this.modalRef.componentInstance.formData = formData;
    console.log(formData)
    this.modalRef.result.then((ans) => {
      if (ans === 'success') {
        const model = {
          //  id:this.workflowForm.value.stepNumber,
           id:formData.id,
           workFlowId:this.workflowId
        }
       this.httpService.mobileBankingPost('api/v1/admin/workflow/delete/step',model).subscribe(
       (result:any)=>{
        if(result.status == 200){
          console.log(result)
          console.log(result.data)
          Swal.fire('workflow step deleted',result.message,'success')
          .then(r=>(console.log(r)))
          this.getWorkflowSteps();
        }
        else{
          Swal.fire('failed','workflow step could not be deleted','error')
          .then(r=>(console.log(r)))
        }
       },
         (error:any) =>{
          Swal.fire('failed',error.message,'error')
          .then(r=>(console.log(r)))
         }
       );
      }
    }
    )
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }
  triggerEvent(data: any) {
    let eventData = JSON.parse(data)

    // if (eventData.action == 'View') {
    //   this. navigateToViewProduct(eventData.row);
    // }
    if (eventData.action == 'Edit') {
      this.openEditModal(eventData.row);
    }
    if (eventData.action == 'Delete') {
      this.openDeleteWorkflowStep(eventData.row);
    }
  }
}
