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
      benefit: ['', [Validators.required]],
      benefitCode: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });


    // this.getAllProductCategories();
  }

  public submitData(): void {
      this.createRecord();
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
}
