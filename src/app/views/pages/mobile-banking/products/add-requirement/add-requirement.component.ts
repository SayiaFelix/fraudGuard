import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {HttpService} from 'src/app/shared/services/http.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import Swal from "sweetalert2";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-requirement',
  templateUrl: './add-requirement.component.html',
  styleUrls: ['./add-requirement.component.scss']
})
export class AddRequirementComponent implements OnInit {

  @Input() title: any;
  @Input() formData: any;
  public loading = false;
  public hasErrors = false;
  public errorMessages: any;
  public form: FormGroup;

  public allProductCategories: any;

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
      requirement: ['', [Validators.required]],
      requirementCode: ['', [Validators.required]],
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

    const model = {
      id: this.formData.productId,
      productCode: this.formData.productCode,
      requirementCode: this.form.value.requirementCode,
      requirement: this.form.value.requirement,
      description: 'Desc',
      approvalId: 1
    };

    this._httpService.mobileBankingPost('product/portal/requirement/add', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.activeModal.close('success');
          Swal.fire('Product requirement created',
            'Product requirement has been created successfully.',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Record creation error',
            'Product requirement could not be created.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record creation error',
          `${error}`,
          'error')
      }
    );

  }

}
