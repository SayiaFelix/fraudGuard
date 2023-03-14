import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {HttpService} from '../../../../../shared/services/http.service';
import {GlobalService} from '../../../../../shared/services/global.service';

@Component({
  selector: 'app-product-category',
  templateUrl: './add-product-category.component.html',
  styleUrls: ['./add-product-category.component.scss']
})
export class AddProductCategoryComponent implements OnInit {
  @Input() title: any;
  @Input() formData: any;
  public loading = false;
  public hasErrors = false;
  public errorMessages: any;
  public form: FormGroup;

  public allProfiles: any[];
  public imageFile: File;

  public features = ['Get access up to 70% of your monthly salary'];
  public requirements = ['Minimum Salary KES 15,000 per month', 'Repayment period 1 month'];

  constructor(
    public activeModal: NgbActiveModal,
    public fb: FormBuilder,
    private httpService: HttpService,
    public globalService: GlobalService) {
  }

  ngOnInit() {
    this.loadProducts();


    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '',
        [Validators.required]],
      description: [this.formData ? this.formData.description : '',
        [Validators.required]],
      longDescription: [this.formData ? this.formData.longDescription : '',
        [Validators.required]],
      feature: [this.formData ? this.formData.feature : ''],
      requirement: [this.formData ? this.formData.requirement : '']
    });

  }

  public submitData(): void {
    if (this.formData) {
      this.saveChanges(this.formData);
    } else {
      this.createRecord();
    }
    this.loading = true;
  }

  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

  logForm() {
    // console.log(this.form);
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  addFeature() {
    this.features = [this.form.value.feature, ...this.features];
  }

  addRequirement() {
    this.requirements = [this.form.value.requirement, ...this.requirements];
  }

  private createRecord(): any {

    this.loading = true;

    const model = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      middleName: this.form.value.middleName,
      phoneNumber: this.form.value.phoneNumber,
      email: this.form.value.email,
      position: this.form.value.position,
      profileId: this.form.value.profile
    };


  }

  private saveChanges(data: any): any {

    this.loading = true;

    // console.log('prev data');
    // console.log(data);


    const model = {
      adminId: data.id,
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      middleName: this.form.value.middleName,
      phoneNumber: this.form.value.phoneNumber,
      email: data.email,
      position: this.form.value.position,
      profileId: this.form.value.profile
    };

    // console.log("here is the model");
    // console.log(model);

  }

  private loadProducts() {
    const model = {
      page: 0,
      size: 100
    };


  }
}
