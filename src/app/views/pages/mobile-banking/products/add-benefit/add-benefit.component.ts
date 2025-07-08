import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl, FormArray } from '@angular/forms';
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
  public formRequest: FormGroup;
  totalPages: number;
  currentPage = 1;
  questionsPerPage = 25;
  answers: any[] = [];

  isFirstFormSubmitted = false;

  public allProductCategories: any;
  isLoading: boolean;
  SubClassData: any;
  ClassData: any;
  selectedClass: any;
  enterpriseItems: any;
  questionnaireData: any;
  selectedOptions: any[] = [];
  requestId: number;
  questionResponses: { [key: string]: { selected: string; comment: string } } = {};
  selectedCheckboxValues: { [key: string]: string } = {};

  constructor(
    public activeModal: NgbActiveModal,
    private activatedRoute: ActivatedRoute,
    public fb: FormBuilder,
    private _httpService: HttpService) {
  }

  ngOnInit() {
    this.form = this.fb.group({
      class_name: [this.formData ? this.formData.class_name : '', [Validators.required]],
      requestType: [this.formData ? this.formData.requestType : '', [Validators.required]],
      subClassName: [{ value: '', disabled: true }, Validators.required]
    });
    this.formRequest = this.fb.group({})

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

    this.loadData()
    this.getSubClassData();
    // this.createFormBuilder(this.questionnaireData);
    this.initializeSelectedCheckboxValues(this.questionnaireData.questions);
    this.createFormBuilder(this.questionnaireData.questions);
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



  private loadData(): void {
    this.loading = true;
    const model = { id: 1 };
    this._httpService.customerPortalPosts(`admin/customer/portal/get`, model).subscribe(
      (res: any) => {
        if (res.status === 200 && res.data && res.data.questions && Array.isArray(res.data.questions)) {
          this.questionnaireData = res.data;
          console.log(this.questionnaireData);
          this.createFormBuilder(this.questionnaireData.questions);
          this.loading = false;
        } else {
          console.log('Failed', "Invalid response data or missing 'questions' array", 'error');
        }
      },
      (error: any) => {
        console.log("Error", error.message, "error");
      }
    );
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
    let licenseNumber = JSON.parse(localStorage.getItem('data')!)['licenceNumber']
    console.log(formData);
    const model = {
      licenseNumber,
      requestType: this.form.value.requestType,
      subClassName: this.form.value.subClassName,
    };
    console.log(model)
    this._httpService.customerPortalPosts('admin/customer/portal/create-customer-request', model).subscribe(
      (result: any) => {
        if (result.status === 200) {
          this.isLoading = false;
          console.log(result)
          this.requestId = result.data.id;
          this.isFirstFormSubmitted = true;
          this.form.reset()
          Swal.fire('Request Recieved Successfully',
            'success').then(r => console.log(r))
          // this.isFirstFormSubmitted = true;
        } else {
          this.form.reset()
          Swal.fire('Request Failed, Try Again',
            'error').then(r => console.log(r))
            this.isLoading = false;
        }
      },
      (error: any) => {
        this.form.reset()
        Swal.fire('Request error',
          'error')
          this.isLoading = false;
      }
    );

  }

  getOptionsForCurrentQuestion(question: AbstractControl): AbstractControl[] {
    return (question.get('options') as FormArray).controls;
  }

  getOptionControl(i: number, j: number, option: string): FormControl<any> {
    const questionControl = this.formRequest.get('q' + i) as FormGroup;
    return questionControl.get('q' + i + 's' + j) as FormControl<any>;
  }

  initializeSelectedCheckboxValues(questions: any[]): void {
    questions.forEach((question) => {
      question.options.forEach((option: any) => {
        this.selectedCheckboxValues[option.cName] = '';
      });
    });
  }

  createFormBuilder(questions: any[]): void {
    questions.forEach((question: any) => {
      this.formRequest.addControl(`item-${question.id}-comment`, new FormControl(''));
      question.comment = `item-${question.id}-comment`;
      question.options.forEach((option: any) => {
        this.formRequest.addControl(`item-${question.id}-option${option.id}`, new FormControl('', Validators.required));
        option.cName = `item-${question.id}-option${option.id}`;
      });
    });
    this.initializeSelectedCheckboxValues(questions);
  }

  toggleCheckbox(mainQuestionIndex: number, optionIndex: number, selectedOption: string) {
    const mainQuestion = this.questionnaireData.questions[mainQuestionIndex];
    const option = mainQuestion.options[optionIndex];

    if (option.selected === selectedOption) {
      option.selected = '';
    } else {
      option.selected = selectedOption;
    }
    let selectValue=  this.selectedCheckboxValues[option.cName] = option.selected;
    console.log(selectValue)
    this.formRequest.controls[`${option.cName}`].setValue(option.selected);
  }

  updateCheckboxStateForPage(page: number): void {
    console.log(`Updating checkbox state for page: ${page}`);
    const questionsForPage = this.getQuestionsForPage(page);
    questionsForPage.forEach((question) => {
      question.options.forEach((option: any) => {
        const selectedValue = this.selectedCheckboxValues[option.cName]
        console.log(`Option: ${option.cName}, Selected Value: ${selectedValue}`);
        if (selectedValue !== undefined) {
          option.selected = selectedValue;
          this.formRequest.controls[`${option.cName}`].setValue(selectedValue);
        }
      });
    });
  }

  updateComment(questionIndex: number, value: string): void {
    const question = this.getQuestionsForCurrentPage()[questionIndex];
    this.questionResponses[question.comment].comment = value;
  }

  submitDataForm(): any {
    this.isLoading = true;
    if (this.formRequest.valid) {
      let licence_number = JSON.parse(localStorage.getItem('data')!)['licenceNumber'];
      // console.log(this.formRequest.value)
      const answers = this.formRequest.value
      let answerArray = Object.keys(answers)
      // console.log(answerArray)
      let temp: { answer: any; questionId: number; optionId: number; }[] = []
      answerArray.forEach((answer: any) => {
        const inputString = answer;
        const regex = /item-(\d+)-option(\d+)/;
        const matches = inputString.match(regex);
        if (matches) {
          const itemNumber = Number(matches[1]);
          const optionNumber = Number(matches[2]);
          let tempObj = {
            answer: this.formRequest.value[`${answer}`],
            questionId: itemNumber,
            optionId: optionNumber
          }

          temp.push(tempObj);
          console.log(itemNumber);
          console.log(optionNumber);
          console.log(tempObj)
        } else {
          console.log('Input string format is incorrect.');
        }
        // console.log(answer)
      })
      let model = {
        questionnaireId: 1,
        requestId: this.requestId,
        licenseNumber: licence_number,
        answers: temp
      }
      console.log('Form values:', this.formRequest.value);
      console.log('Our Model', model)
      // this.isFirstFormSubmitted = true;
      this._httpService.customerPortalPosts('admin/customer/portal/answer', model).subscribe(
        (result: any) => {
          if (result.status === 200) {
            this.isFirstFormSubmitted = false;
            this.isLoading = false;
            this.formRequest.reset()
            Swal.fire('Questions Recieved Successfully',
              'success').then(r => console.log(r))
          } else {
            this.formRequest.reset()
            Swal.fire('Questions Failed, Try Again',
              'error').then(r => console.log(r))
              this.isLoading = false;
          }
        },
        (error: any) => {
          this.formRequest.reset()
          Swal.fire('Questions error',
            'error')
            this.isLoading = false;
        }
      );

    } 
  }

  getSubClassData(): void {
    this.loading = true;
    this._httpService
      .customerPortalPosts('standard/portal/class/getall', {})
      .subscribe((res: any) => {
        // console.log(res)
        if (res.status === 200) {
          // console.log(res);
          if (res.data && res.data.classes) {
            this.loading = false;
            this.SubClassData = res.data.classes;
            this.ClassData = res.data
            // console.log(this.SubClassData);
            // console.log(this.ClassData);
          } else {
            this.loading = false;
          }
        } else {
          this.loading = false;
        }
      });
    this.loading = false;
  }

// getSubClassData(): void {
  //   this.loading = true;
  //   this._httpService.getClassAndSubclassData().subscribe((res: any) => {
  //     console.log(res);
  //     if (res.data && res.data.classes) {
  //       this.loading = false;
  //       this.SubClassData = res.data.classes;
  //       this.ClassData = res.data
  //       console.log(this.SubClassData);
  //       console.log(this.ClassData);
  //     } else {
  //       this.loading = false;
  //     }
  //   });
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

  get totalNumberOfPages(): number {
    return Math.ceil(this.questionnaireData?.questions.length / this.questionsPerPage);
  }

  setCurrentPage(page: number) {
    this.currentPage = page;
    this.updateCheckboxStateForPage(page);
  }

  prevPage(): void {
    this.setCurrentPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.setCurrentPage(this.currentPage + 1);
  }

  getQuestionsForCurrentPage(): any[] {
    const startIndex = (this.currentPage - 1) * this.questionsPerPage;
    return this.questionnaireData?.questions.slice(startIndex, startIndex + this.questionsPerPage);
  }

  getQuestionsForPage(page: number): any[] {
    const startIndex = (page - 1) * this.questionsPerPage;
    return this.questionnaireData?.questions.slice(startIndex, startIndex + this.questionsPerPage);
  }


  get totalNumberOfPagesArray(): number[] {
    return Array.from({ length: this.totalNumberOfPages }, (_, i) => i + 1);
  }


  public closeModal(): void {
    this.activeModal.dismiss('Cross click');
  }

  private saveChanges() {
    this.isLoading = true;
    const model = {
      id: this.formData.id,
      name: this.form.value.benefit,
      code: this.form.value.benefitCode,
      description: this.form.value.description,
    };
    // console.log(this.productDetails)
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
