import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-benefit',
  templateUrl: './add-benefit.component.html',
  styleUrls: ['./add-benefit.component.scss']
})
export class AddBenefitComponent implements OnInit {
  @Input() title: any;
  @Input() formData: any;
  public loading = false;
  public hasErrors = false;
  public errorMessages: any;
  public form: FormGroup;

  public allProductCategories: any;
  isLoading: boolean;

  constructor(
    public activeModal: NgbActiveModal,
    private activatedRoute:ActivatedRoute,
    public fb: FormBuilder,
    private _httpService: HttpService) {
  }

  ngOnInit() {

    console.log("this.formData");
    console.log(this.formData);

    this.form = this.fb.group({
      benefit: [this.formData ? this.formData.benefit : '', [Validators.required]],
      benefitCode: [this.formData ? this.formData.benefitCode : '', [Validators.required]],
      description: [this.formData ? this.formData.description : '', [Validators.required]],
    });


    // this.getAllProductCategories();
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
    this.isLoading =true;
    const model = {
      productId: this.formData.id,
      // productCode: this.formData.productCode,
      benefitCode: this.form.value.benefitCode,
      benefit: this.form.value.benefit,
      description: this.form.value.description,
      // approvalId: 1
    };
      console.log(this.formData)
    this._httpService.mobileBankingPost('product/portal/benefits/add', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.isLoading =false;
          this.activeModal.close('success');
          Swal.fire('Benefit created',
            'Benefit has been created successfully.',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Record creation error',
            'Benefit could not be created.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record creation error',
          `Record creation error`,
          'error')
      }
    );

  }

  private saveChanges() {
    this.isLoading =true;
    const model = {
      id: this.formData.id,
      name: this.form.value.benefit,
      code: this.form.value.benefitCode,
      description: this.form.value.description,
    };
    console.log(this.formData)
    this._httpService.mobileBankingPost('product/portal/benefit/update', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.activeModal.close('success');
          Swal.fire('Benefit Edited',
            'Benefit has been edited successfully.',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Record editing error',
            'Benefit could not be edited.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record editing error',
          `Record editing error`,
          'error')
      }
    );

  }
}
