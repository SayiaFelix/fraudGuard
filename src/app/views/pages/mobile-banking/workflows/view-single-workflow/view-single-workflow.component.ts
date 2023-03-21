import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {HttpService} from "../../../../../shared/services/http.service";
import {GlobalService} from "../../../../../shared/services/global.service";
import {AddMobileAppCustomerComponent} from "../../channels/add-mobile-app-customer/add-mobile-app-customer.component";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {AddWorkflowStepComponent} from "../add-workflow-step/add-workflow-step.component";

@Component({
    selector: 'app-view-single-workflow',
    templateUrl: './view-single-workflow.component.html',
    styleUrls: ['./view-single-workflow.component.scss']
})
export class ViewSingleWorkflowComponent implements OnInit {


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

        this.loadAllProfiles();

        this.getWorkflowSteps();

        this.loadData();

        this.workflowForm = this.fb.group({
            profile: ['', [Validators.required]],
            name: ['', [Validators.required]],
            remarks: ['', [Validators.required]],
            isActive: [0],
            notificationEmail: ['', [Validators.required]],
            notificationEmailMessage: ['', [Validators.required]],
        });
    }

    submitAddData() {

        const model = {
                stepName: this.workflowForm.value.name,
                remarks: this.workflowForm.value.remarks,
                profileId: this.workflowForm.value.profile,
                workFlowId: parseInt(this.workflowId, 10),
                notificationEmail: this.workflowForm.value.notificationEmail,
                notificationEmailMessage: this.workflowForm.value.notificationEmailMessage,

        };

        // Create workflow step
        this.httpService.mobileBankingPost('api/v1/corporate/workflow/create/step', model).subscribe(
            (result: any) => {
                if (result.status === 200) {
                    this.getWorkflowSteps();

                    this.workflowForm.reset();

                } else {
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

    deleteWorkflowStep() {
        const model = {
                id: this.selectedWorkflowStep.id,
                workFlowId: this.workflowId
        };

        // Delete workflow step
        this.httpService.mobileBankingPost('api/v1/corporate/workflow/delete/step', model).subscribe(
          (result:any) => {
                if (result.status === 200) {

                    this.getWorkflowSteps();

                    // reset center div
                    this.selectedWorkflowStep = null;

                    this.workflowForm.reset();

                } else {

                }
            });
    }

  openAddModal() {
    this.modalRef = this.modalService.open(AddWorkflowStepComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Workflow Step';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
      } else {
        console.log("Error occurred")
      }
    });
  }
}
