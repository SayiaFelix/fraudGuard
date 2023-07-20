import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
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
  @Input() productDetails: any;
  @Input() formData: any;
  public loading = false;
  public hasErrors = false;
  public errorMessages: any;
  public form: FormGroup;
  questionsPerPage = 1; // Display 1 question per page for this example
  currentPage = 1;
  totalPages: number;
  public allProductCategories: any;
  isLoading: boolean;
  SubClassData: any;
  ClassData: any;
  selectedClass: any;
  enterpriseItems: any;


  constructor(
    public activeModal: NgbActiveModal,
    private activatedRoute: ActivatedRoute,
    public fb: FormBuilder,
    private _httpService: HttpService) {
  }

  ngOnInit() {
    this.form = this.fb.group({
      class_name: [this.formData ? this.formData.class_name : '', [Validators.required]],
      requestType: [this.formData ? this.formData.request_category : '', [Validators.required]],
      subClass_Id: [{ value: this.formData ? this.formData.subClass_Id : '', disabled: true }, [Validators.required]],
      question1: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required)
      }),
      question2: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required)
      }),
      question3: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question4: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required)
      }),
      question5: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question6: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question7: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question8: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question9: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question10: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question11: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required)
      }),
      question12: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question13: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question14: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question15: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question16: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
      }),
      question17: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question18: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question19: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question20: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
        subQuestion5: new FormControl(false, Validators.required),
        subQuestion6: new FormControl(false, Validators.required)
      }),
      question21: this.fb.group({
        subQuestion1: new FormControl(false, Validators.required),
        subQuestion2: new FormControl(false, Validators.required),
        subQuestion3: new FormControl(false, Validators.required),
        subQuestion4: new FormControl(false, Validators.required),
      }),
      // Add more questions and sub-questions as needed
    });
   
    // this.initializeForm();
    this.getClassData(0);
    this.getSubClassData(0);
  }

  toggleCheckbox(mainQuestion: string, subQuestion: string, event: Event) {
    const formControl = this.form.get(mainQuestion)?.get(subQuestion) as FormControl;
    if (event.target instanceof HTMLInputElement) {
      // Get the checked property of the checkbox
      const isChecked = event.target.checked;
      // Update the form control value based on the checkbox state
      formControl.setValue(isChecked);
      // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
      if (isChecked && subQuestion === 'subQuestion1') {
        const noFormControl = this.form.get(mainQuestion)?.get('subQuestion2') as FormControl;
        if (noFormControl) {
          noFormControl.setValue(false);
        }
      } else if (isChecked && subQuestion === 'subQuestion2') {
        // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
        const noFormControl = this.form.get(mainQuestion)?.get('subQuestion1') as FormControl;
        if (noFormControl) {
          noFormControl.setValue(false);
        }
      } else if (isChecked && subQuestion === 'subQuestion3') {
        // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
        const noFormControl = this.form.get(mainQuestion)?.get('subQuestion4') as FormControl;
        if (noFormControl) {
          noFormControl.setValue(false);
        }
      } else if (isChecked && subQuestion === 'subQuestion4') {
        // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
        const noFormControl = this.form.get(mainQuestion)?.get('subQuestion3') as FormControl;
        if (noFormControl) {
          noFormControl.setValue(false);
        }
      }else if (isChecked && subQuestion === 'subQuestion5') {
        // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
        const noFormControl = this.form.get(mainQuestion)?.get('subQuestion6') as FormControl;
        if (noFormControl) {
          noFormControl.setValue(false);
        }
      } else if (isChecked && subQuestion === 'subQuestion6') {
        // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
        const noFormControl = this.form.get(mainQuestion)?.get('subQuestion5') as FormControl;
        if (noFormControl) {
          noFormControl.setValue(false);
        }
      }
    }
  }
  
  getFormControl(mainQuestion: string, subQuestion: string): FormControl {
    const formControl = this.form.get(mainQuestion)?.get(subQuestion) as FormControl;
    if (formControl) {
      return formControl;
    }
    // If the form control is not found, return a new FormControl
    return new FormControl(false, Validators.required);
  }
  
  getClassData(event: number): void {
    this.loading = true;
    this._httpService
      .customerPortalPost('api/v1/portal/getClassAndSubclasses', {})
      .subscribe((res: any) => {
        console.log(res)
        if (res.status === '00') {
          this.loading = false;
          setTimeout(() => {
            this.ClassData = res.data
            console.log(this.ClassData)
          }, 10);
        } else {
          this.loading = false;
        }
      });
    this.loading = false;
  }

  getSubClassData(event: number): void {
    this.loading = true;
    this._httpService
      .customerPortalPost('api/v1/portal/getSubClassesAndClasses', {})
      .subscribe((res: any) => {
        console.log(res)
        if (res.status === '00') {
          this.loading = false;
          setTimeout(() => {
            this.SubClassData = res.data
            console.log(this.SubClassData)
          }, 10);
        } else {
          this.loading = false;
        }
      });
    this.loading = false;
  }

  nextPage() {
    this.currentPage++;
  }

  prevPage() {
    this.currentPage--;
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.form.value;
      console.log(formData); // Handle the form data as needed
    } else {
      console.log("Please answer all questions.");
    }
  }

  public submitData(): void {
    if (this.formData) {
      this.saveChanges();
    } else {
      this.createRecord();
    }
    this.loading = true;
  }

  private createRecord(): any {
    this.isLoading = true;
    let userId = JSON.parse(localStorage.getItem('data')!)['user']['id']
    const model = {
      userId,
      requestType: this.form.value.requestType,
      subClass_Id: this.form.value.subClass_Id,
    };
    console.log(model)
    this._httpService.customerPortalPost('api/v1/portal/requestAccreditation', model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.activeModal.close('success');
          Swal.fire('Request Recieved Successfully',
            'success').then(r => console.log(r))
        } else {
          this.activeModal.close('error');
          Swal.fire('Request Failed, Try Again',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Request error',
          'error')
      }
    );

  }

  private editRecord(): any {

    // this.isLoading = true;
    // const model = {
    //   id: this.formData.id,
    //   name: this.form.value.name,
    //   description: this.form.value.description,
    //   parentCategoryId: this.form.value.parentId,
    // };

    // let formData=new FormData;
    // formData.append('category',
    //   new Blob([JSON.stringify(model)], {type: "application/json"} ));
    // formData.append('file', this.imageFile);
    // console.log(formData)

    // this._httpService.mobileBankingPostFormData('product/portal/category/update', formData).subscribe(
    //   (result: any) => {
    //     if (result.status === 200) {
    //       this.activeModal.close('success');
    //       this.isLoading = false;

    //       Swal.fire('Product Category Edited',
    //         'Product Category has been edited successfully.',
    //         'success').then(r => console.log(r))
    //     } else {
    //       this.activeModal.close('error');
    //       Swal.fire('Record editing error',
    //         'Product Category could not be edited.',
    //         'error').then(r => console.log(r))
    //     }
    //   },
    //   (error: any) => {
    //     Swal.fire('Record editing error',
    //       `Record deletion error`,
    //       'error')
    //   }
    // );
  }

  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

  // private createRecord(): any {
  //   this.isLoading =true;
  //   const model = {
  //     productId: this.productDetails.id,
  //     // productCode: this.formData.productCode,
  //     benefitCode: this.form.value.benefitCode,
  //     benefit: this.form.value.benefit,
  //     description: this.form.value.description,
  //     // approvalId: 1
  //   };
  //     console.log(this.productDetails)
  //   this._httpService.mobileBankingPost('product/portal/benefits/add', model).subscribe(
  //     (result: any) => {
  //       if (result.status === 200) {
  //         this.isLoading =false;
  //         this.activeModal.close('success');
  //         Swal.fire('Benefit created',
  //           'Benefit has been created successfully.',
  //           'success').then(r => console.log(r))
  //       } else {
  //         this.activeModal.close('error');
  //         Swal.fire('Record creation error',
  //           'Benefit could not be created.',
  //           'error').then(r => console.log(r))
  //       }
  //     },
  //     (error: any) => {
  //       Swal.fire('Record creation error',
  //         `Record creation error`,
  //         'error')
  //     }
  //   );

  // }

  private saveChanges() {
    this.isLoading = true;
    const model = {
      id: this.formData.id,
      name: this.form.value.benefit,
      code: this.form.value.benefitCode,
      description: this.form.value.description,
    };
    console.log(this.productDetails)
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

  public checkFormValue(event: any) {
    console.log(event.target.value);
    // filter
    this.selectedClass = this.ClassData.filter((item: any) => {
      console.log(item);
      console.log(item.id)
      return parseInt(item.id) == parseInt(event.target.value)
    })

    this.enterpriseItems = this.selectedClass.map((item: any) => item.subEnterprises);
    console.log(this.enterpriseItems);
    if (this.form.value.class_name) {
      this.getSubClassData(event.target.value);
      this.form.controls['subClass_Id'].enable()
    } else {
      this.form.controls['subClass_Id'].disable()
    }
  }
}
