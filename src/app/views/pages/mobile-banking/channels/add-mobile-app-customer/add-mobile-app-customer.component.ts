import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {PeoplesData, Person} from "../../../../../core/dummy-datas/peoples.data";

@Component({
    selector: 'app-add-mobile-app-customer',
    templateUrl: './add-mobile-app-customer.component.html',
    styleUrls: ['./add-mobile-app-customer.component.scss']
})
export class AddMobileAppCustomerComponent implements OnInit {

    @Input() title: any;
    @Input() formData: any;
    public loading = false;
    public hasErrors = false;
    public errorMessages: any;
    public form: FormGroup;
    public imageFile: File;

    selectedSimpleItem: any = null;
    selectedSearchPersonId: string = '';
    people: Person[] = [];





  constructor(
        public activeModal: NgbActiveModal,
        public fb: FormBuilder,
        private _httpService: HttpService) {
    }

    ngOnInit() {

      this.people = PeoplesData.peoples;

      this.form = this.fb.group({
            name: [this.formData ? this.formData.productName : '', [Validators.required]],
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
