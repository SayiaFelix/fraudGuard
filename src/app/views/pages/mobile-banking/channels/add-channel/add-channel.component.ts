import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-add-channel',
    templateUrl: './add-channel.component.html',
    styleUrls: ['./add-channel.component.scss']
})
export class AddChannelComponent implements OnInit {

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
            name: [this.formData ? this.formData.channel : '', [Validators.required]],
            client_id: [this.formData ? this.formData.client_id : '', [Validators.required]],
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
