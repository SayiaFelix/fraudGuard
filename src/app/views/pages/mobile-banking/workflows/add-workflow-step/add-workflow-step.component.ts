import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-add-workflow-step',
    templateUrl: './add-workflow-step.component.html',
    styleUrls: ['./add-workflow-step.component.scss']
})
export class AddWorkflowStepComponent implements OnInit {
selectedprofiles: any = null;
selectedroles: any = null;
 profiles :any[] = ['System Admin','Corporate Admin'];
 users :any[] = ['Michael','Lilian'];
    @Input() title: any;
    @Input() formData: any;
    public loading = false;
    public hasErrors = false;
    public errorMessages: any;
    public workflowForm: FormGroup;
    public imageFile: File;
    public form:FormGroup;

    constructor(
        public activeModal: NgbActiveModal,
        public fb: FormBuilder,
        private _httpService: HttpService) {
    }

    ngOnInit() {
      console.log(this.formData)
      this.form = this.fb.group({
        stepNumber: [this.formData ? this.formData.productName : '', [Validators.required]],
        stepName: [this.formData ? this.formData.Name : '', [Validators.required]],
    });
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
  }
  private createRecord(): any {
  }

    }
