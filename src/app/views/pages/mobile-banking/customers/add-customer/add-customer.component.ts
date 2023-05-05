import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

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
            firstName: [this.formData ? this.formData.firstName : '', [Validators.required]],
            middleName: [this.formData ? this.formData.middleName : '', [Validators.required]],
            lastName: [this.formData ? this.formData.lastName : '', [Validators.required]],
            accountNumber: [this.formData ? this.formData.accountNumber : '', [Validators.required]],
            phoneNumber: [this.formData ? this.formData.phoneNumber : '', [Validators.required]],
            imeiNumber: [this.formData ? this.formData.imeiNumber : '', [Validators.required]],
            email: [this.formData ? this.formData.email : '', [Validators.required]],
            idNumber: [this.formData ? this.formData.idNumber : '', [Validators.required]],
            description: [this.formData ? this.formData.remarks : '', [Validators.required]],
            image: [this.formData ? this.formData.image : '', [Validators.nullValidator]]
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
    }

    private saveChanges(): any {
    }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }
}
