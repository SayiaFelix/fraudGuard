import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { log } from 'console';
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
  public formRequest: FormGroup;
  totalPages: number;
  currentPage = 1;
  questionsPerPage = 2;

  isFirstFormSubmitted = false;

  public allProductCategories: any;
  isLoading: boolean;
  SubClassData: any;
  ClassData: any;
  selectedClass: any;
  enterpriseItems: any;
  questionnaireData: any;
  selectedOptions: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private activatedRoute: ActivatedRoute,
    public fb: FormBuilder,
    private _httpService: HttpService) {
  }

  ngOnInit() {
    this.form = this.fb.group({
      class_name: [this.formData ? this.formData.class_name : '', [Validators.required]],
      request_type: [this.formData ? this.formData.request_type : '', [Validators.required]],
      subClassName: [{ value: '', disabled: true }, Validators.required]
    });



    // this.formRequest = this.fb.group({formDetails});
    this.questionnaireData = { questions: [] };

    const questions = this.getQuestionsForCurrentPage();
    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        this.addQuestionControls(i);
      }
    }
    this.form.get('class_name')!.valueChanges.subscribe((selectedClass) => {
      if (selectedClass) {
        this.form.get('subClassName')!.enable();
      } else {
        this.form.get('subClassName')!.disable();
      }
    });
    // this.getClassData(0);
    // this.populateFormControls()
    this.loadData()
    this.getSubClassData();
  }
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }

  addQuestionControls(questionIndex: number) {
    const question = this.getQuestionsForCurrentPage()[questionIndex];
    for (let j = 0; j < question.options.length; j++) {
      const controlName = `q${questionIndex}s${j}`;
      this.formRequest.addControl(controlName, new FormControl());
    }
    const commentControlName = `comment${questionIndex}`;
    this.formRequest.addControl(commentControlName, new FormControl());
  }

  populateFormControls() {
    const questions = this.getQuestionsForCurrentPage();

    questions.forEach((question, i) => {
      // Create an array of form controls for the options of each question
      const optionControls = question.options.map((option: { selected: any; }, j: any) => {
        return this.fb.control(option.selected, Validators.required);
      });

      // Add the array of form controls as a form array to the form group
      this.formRequest.addControl('q' + i, this.fb.array(optionControls));

      // Add the textarea control to the form group
      this.formRequest.addControl('comment' + i, this.fb.control(''));
    });
  }

  getCommentControl(i: number): FormControl<any> {
    return this.formRequest.get('comment' + i) as FormControl<any>;
  }


  getOptionControl(i: number, j: number, option: string): FormControl<any> {
    const questionControl = this.formRequest.get('q' + i) as FormGroup;
    return questionControl.get('q' + i + 's' + j) as FormControl<any>;
  }


  private loadData(): any {
    this.loading = true;
    let model = {
      id: 2
    }
    this._httpService.customerPortalPosts(`admin/customer/questionnaire1/get`, model).subscribe(
      (res: any) => {
        if (res.status == 200) {
          this.questionnaireData = res['data'];
          console.log(this.questionnaireData)

          this.createFormBuilder(this.questionnaireData)


          this.loading = false;
        } else {
          console.log('Failed', "Unable to fetch questions", 'error')
        }
      }, (error: any) => {
        console.log("Error", error.message, "error");
      });
  }
  createFormBuilder(questionnaireData: any) {

    let items: any[] = [];

    for (const question of this.questionnaireData.questions) {
      let item =  question.options[0].id
      items.push(`item-${item}`);
    }

    console.log('formDetails')
    console.log(items)
  
    let formObject: any = {};

    for (const item of items) {
      formObject[item] = '';
    }

    this.formRequest = this.fb.group({
      formObject
    }); 
    
    console.log(formObject);

  }

  toggleCheckbox(mainQuestionIndex: number, optionIndex: number, selectedOption: string) {
    const mainQuestion = this.questionnaireData.questions[mainQuestionIndex];
    const option = mainQuestion.options[optionIndex];
    if (option.selected === selectedOption) {
      option.selected = '';
    } else {
      option.selected = selectedOption;
    }
  }




  // toggleCheckbox(mainQuestion: string, subQuestion: string, event: Event) {
  //   const formControl = this.form.get(mainQuestion)?.get(subQuestion) as FormControl;
  //   if (event.target instanceof HTMLInputElement) {
  //     // Get the checked property of the checkbox
  //     const isChecked = event.target.checked;
  //     // Update the form control value based on the checkbox state
  //     formControl.setValue(isChecked);
  //     // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
  //     if (isChecked && subQuestion === 'subQuestion1') {
  //       const noFormControl = this.form.get(mainQuestion)?.get('subQuestion2') as FormControl;
  //       if (noFormControl) {
  //         noFormControl.setValue(false);
  //       }
  //     } else if (isChecked && subQuestion === 'subQuestion2') {
  //       // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
  //       const noFormControl = this.form.get(mainQuestion)?.get('subQuestion1') as FormControl;
  //       if (noFormControl) {
  //         noFormControl.setValue(false);
  //       }
  //     } else if (isChecked && subQuestion === 'subQuestion3') {
  //       // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
  //       const noFormControl = this.form.get(mainQuestion)?.get('subQuestion4') as FormControl;
  //       if (noFormControl) {
  //         noFormControl.setValue(false);
  //       }
  //     } else if (isChecked && subQuestion === 'subQuestion4') {
  //       // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
  //       const noFormControl = this.form.get(mainQuestion)?.get('subQuestion3') as FormControl;
  //       if (noFormControl) {
  //         noFormControl.setValue(false);
  //       }
  //     } else if (isChecked && subQuestion === 'subQuestion5') {
  //       // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
  //       const noFormControl = this.form.get(mainQuestion)?.get('subQuestion6') as FormControl;
  //       if (noFormControl) {
  //         noFormControl.setValue(false);
  //       }
  //     } else if (isChecked && subQuestion === 'subQuestion6') {
  //       // If it's a "Yes" checkbox, uncheck the corresponding "No" checkbox
  //       const noFormControl = this.form.get(mainQuestion)?.get('subQuestion5') as FormControl;
  //       if (noFormControl) {
  //         noFormControl.setValue(false);
  //       }
  //     }
  //   }
  // }

  getFormControl(mainQuestion: string, subQuestion: string): FormControl {
    const formControl = this.form.get(mainQuestion)?.get(subQuestion) as FormControl;
    if (formControl) {
      return formControl;
    }
    // If the form control is not found, return a new FormControl
    return new FormControl(false, Validators.required);
  }


  getSubClassData(): void {
    this.loading = true;
    this._httpService.getClassAndSubclassData().subscribe((res: any) => {
      console.log(res);
      if (res.data && res.data.classes) {
        this.loading = false;
        this.SubClassData = res.data.classes;
        this.ClassData = res.data
        console.log(this.SubClassData);
        console.log(this.ClassData);
      } else {
        this.loading = false;
      }
    });
  }

  // getClassData(event: number): void {
  //   this.loading = true;
  //   this._httpService
  //     .customerPortalPost('api/v1/portal/getClassAndSubclasses', {})
  //     .subscribe((res: any) => {
  //       console.log(res)
  //       if (res.status === '00') {
  //         this.loading = false;
  //         setTimeout(() => {
  //           this.ClassData = res.data
  //           console.log(this.ClassData)
  //         }, 10);
  //       } else {
  //         this.loading = false;
  //       }
  //     });
  //   this.loading = false;
  // }

  // getSubClassData(event: number): void {
  //   this.loading = true;
  //   this._httpService
  //     .customerPortalPost('api/v1/portal/getSubClassesAndClasses', {})
  //     .subscribe((res: any) => {
  //       console.log(res)
  //       if (res.status === '00') {
  //         this.loading = false;
  //         setTimeout(() => {
  //           this.SubClassData = res.data
  //           console.log(this.SubClassData)
  //         }, 10);
  //       } else {
  //         this.loading = false;
  //       }
  //     });
  //   this.loading = false;
  // }

  onClassChange(event: any): void {
    const selectedClassId = event.target.value;
    const selectedClass = this.ClassData.classes.find((classItem: any) => classItem.classId === Number(selectedClassId));

    if (selectedClass && selectedClass.subclasses) {
      this.SubClassData = selectedClass.subclasses;
    } else {
      this.SubClassData = [];
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
    let userId = JSON.parse(localStorage.getItem('data')!)['id']
    const formData = this.form.value;
    console.log(formData);
    const model = {
      userId,
      request_type: this.form.value.request_type,
      subClassName: this.form.value.subClassName,
    };
    console.log(model)
    this._httpService.customerPortalPost('api/v1/portal/requestAccreditation', model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.form.reset()
          Swal.fire('Request Recieved Successfully',
            'success').then(r => console.log(r))
        } else {

          this.form.reset()
          Swal.fire('Request Failed, Try Again',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        this.form.reset()
        Swal.fire('Request error',
          'error')
      }
    );

  }


  submitDataForm(): any {
    this.isLoading = true;
    let licenceNumber = JSON.parse(localStorage.getItem('data')!)['licenceNumber'];
    const formData = this.formRequest.value;
    console.log(formData);
    const model = {
      questionnaireId: 2,
      requestId: 0,
      licenseNumber: String(licenceNumber),
      answers: [
        {
          answer: "no",
          questionId: 0,
          optionId: 0
        }
      ]
    };
    console.log(formData)
    console.log(model)
    this.isFirstFormSubmitted = true;
    // this._httpService.customerPortalPost('api/v1/portal/requestAccreditation', model).subscribe(
    //   (result: any) => {
    //     if (result.status === 200) {
    //       this.isLoading = false;
    //       this.form.reset()
    //       Swal.fire('Request Recieved Successfully',
    //         'success').then(r => console.log(r))
    //     } else {

    //       this.form.reset()
    //       Swal.fire('Request Failed, Try Again',
    //         'error').then(r => console.log(r))
    //     }
    //   },
    //   (error: any) => {
    //     this.form.reset()
    //     Swal.fire('Request error',
    //       'error')
    //   }
    // );

  }

  get totalNumberOfPages(): number {
    return Math.ceil(this.questionnaireData?.questions.length / this.questionsPerPage);
  }

  // Function to set the current page
  // setCurrentPage(page: number): void {
  //   if (page >= 1 && page <= this.totalNumberOfPages) {
  //     this.currentPage = page;
  //   }
  // }

  setCurrentPage(page: number) {
    this.currentPage = page;
  }
  // Function to navigate to the previous page
  prevPage(): void {
    this.setCurrentPage(this.currentPage - 1);
  }
  // Function to navigate to the next page
  nextPage(): void {
    this.setCurrentPage(this.currentPage + 1);
  }
  getQuestionsForCurrentPage(): any[] {
    const startIndex = (this.currentPage - 1) * this.questionsPerPage;
    return this.questionnaireData?.questions.slice(startIndex, startIndex + this.questionsPerPage);
  }
  get totalNumberOfPagesArray(): number[] {
    return Array.from({ length: this.totalNumberOfPages }, (_, i) => i + 1);
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
      this.getSubClassData();
      this.form.controls['subClass_Id'].enable()
    } else {
      this.form.controls['subClass_Id'].disable()
    }
  }
}
