import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {HttpService} from "../../../../../shared/services/http.service";
import {GlobalService} from "../../../../../shared/services/global.service";
import {AddMobileAppCustomerComponent} from "../../channels/add-mobile-app-customer/add-mobile-app-customer.component";
import {NgbActiveModal, NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {AddWorkflowStepComponent} from "../add-workflow-step/add-workflow-step.component";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';

@Component({
    selector: 'app-view-single-workflow',
    templateUrl: './view-single-workflow.component.html',
    styleUrls: ['./view-single-workflow.component.scss']
})
export class ViewSingleWorkflowComponent implements OnInit {
    @ViewChild('table') table: DatatableComponent;
    actions=["Edit"]
    tempProductData = [
      {
        Steps: 1,
        Name: 'Step 1',
        isFinal:'Create User',
        isActive: 'true',
        sendSms: '12-02-2023',
      },
      {
        Steps:2,
        Name: 'Step 2',
        isFinal:'Create Signatory',
        isActive: 'false',
        sendSms: '12-02-2023',
      },
  
    ];

    columns = [
        { name: 'stepName', prop: 'stepName' },
        { name: 'Name', prop: 'Name' },
        {name:'isFinal',prop:'isFinal'},
        { name: 'isActive', prop: 'isActive' },
        { name: 'sendSms', prop: 'sendSms' },
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

    formTitle: any = 'Add Workflow Step';
    isAdd: boolean = true;

    public modalRef: NgbModalRef;
    ColumnMode = ColumnMode;


    rows:any[];
    
  title: string = "Step";

    constructor(
        public fb: FormBuilder,
        private httpService: HttpService,
        public globalService: GlobalService,
        public activatedRoute: ActivatedRoute,
        private modalService: NgbModal,  
        public activeModal: NgbActiveModal,

    ) {
    }

    ngOnInit() {

        this.enableEditAndDeleteButtons = false;

        this.activatedRoute.params.subscribe(params => {
            if (typeof params.id !== 'undefined') {
                this.workflowId = params.id;
            }
        });

        this.loadAllProfiles();

        this.getWorkflowSteps();

        this.loadData();

        this.workflowForm = this.fb.group({
            stepName: ['', [Validators.required]],
            remarks: ['', [Validators.required]],
            profile: ['', [Validators.required]],
            isActive: [0],
            notificationEmail: ['', [Validators.required]],
            notificationEmailMessage: ['', [Validators.required]],
        });
    }

    submitAddData() {

        const model = {
                id:this.workflowForm.value.id,
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
                  this.activeModal.close('success')
                  Swal.fire('success','step created successfully','success')
                  .then (r =>(console.log(r)))
                } else {
                  this.activeModal.close('error')
                  Swal.fire('error','unable to create step','error')
                  .then (r=>(console.log(r)))
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
          (result:any) => {
                if (result.status === 200) {

                    this.getWorkflowSteps();
                    this.loadData();

                    this.workflowForm.reset();

                } else {

                }
            });
    }

    private loadData(): any {
        this.rows = this.tempProductData;
        
        const model = {
                id: parseInt(this.workflowId, 10)
        };

        this.httpService.mobileBankingPost('api/v1/corporate/workflow/get/id', model).subscribe(
          (result:any) => {
                if (result.status === 200) {
                    this.workflowItemData = result.data;
                } else {

                }

            }
        );
    }

    private loadAllProfiles(): any {
        const model = {
                page: 0,
                size: 100
        };

        this.httpService.mobileBankingPost('api/v1/corporate/admin/profiles/all', model).subscribe(
          (result:any) => {
                if (result.status === 200) {
                    this.allProfilesList = result.data;
                } else {

                }


            });
    }

    private getWorkflowSteps() {
        const model = {
                id: this.workflowId
        };

        this.httpService.mobileBankingPost('api/v1/corporate/workflow/get/workflow/steps/', model).subscribe(
          (result:any) => {
                if (result.status === 200) {
                    this.workflowSteps = result.data;
                } else {

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

    editWorkflowStep() {

        this.formTitle = `Editing Workflow Step`;

        // send contents to form for editing
        this.workflowForm.patchValue({
            profile: this.selectedWorkflowStep.requiredApprovalId,
            name: this.selectedWorkflowStep.stepName,
            remarks: this.selectedWorkflowStep.remarks,
            isActive: this.selectedWorkflowStep.isActive,
            notificationEmail: this.selectedWorkflowStep.notificationEmail,
            notificationEmailMessage: this.selectedWorkflowStep.notificationEmailMessage,
        });

        // Change button to edit button
        this.isAdd = false;

    }

    revertToAdd() {
        this.formTitle = 'Add Workflow Step';

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
    navigateToViewProduct(data:any){

    }

    deleteWorkflowStep() {
      this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
      this.modalRef.componentInstance.title = 'Delete Workflow Step'
      this.modalRef.componentInstance.body= "Do you want to delete this workflow step?";
      this.modalRef.result.then((result) => {
        if (result === 'success') {
          Swal.fire('Deleted Successfully',  'Workflow Step Deleted successfully.',  'success')
            .then
            (r => {
            })
        } else {
          console.log("Error occurred")
        }
      });



        // const model = {
        //         id: this.selectedWorkflowStep.id,
        //         workFlowId: this.workflowId
        // };
        //
        // // Delete workflow step
        // this.httpService.mobileBankingPost('api/v1/corporate/workflow/delete/step', model).subscribe(
        //   (result:any) => {
        //         if (result.status === 200) {
        //
        //             this.getWorkflowSteps();
        //
        //             // reset center div
        //             this.selectedWorkflowStep = null;
        //
        //             this.workflowForm.reset();
        //
        //         } else {
        //
        //         }
        //     });
    }

  openAddModal() {
    this.modalRef = this.modalService.open(AddWorkflowStepComponent, {centered: true, size:'lg'});
    this.modalRef.componentInstance.title = 'Add Workflow Step';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
      } else {
        console.log("Error occurred")
      }
    });
  }
  openEditModal(data:any) {
    this.modalRef = this.modalService.open(AddWorkflowStepComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Workflow Step';
    this.modalRef.componentInstance.formData = data;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
      } else {
        console.log("Error occurred")
      }
    });
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }
  triggerEvent(data:any){
    let eventData = JSON.parse(data)

    // if (eventData.action == 'View') {
    //   this. navigateToViewProduct(eventData.row);
    // }
     if (eventData.action == 'Edit') {
      this.openEditModal(eventData.row);
    }
  }
}
