import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CustomValidators } from 'ngx-custom-validators';
import { HttpService } from 'src/app/shared/services/http.service';
import Swal from "sweetalert2";
@Component({
  selector: 'app-all-standards',
  templateUrl: './all-standards.component.html',
  styleUrls: ['./all-standards.component.scss']
})
export class StandardsComponent implements OnInit {
  standards: any = []
  // standards: any = [
  //   {
  //     id: '1',
  //     icon: "assets/images/3.png",
  //     name: 'Accommodation And Catering Establishment',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '2',
  //     icon: "assets/images/2.png",
  //     name: 'Meetings, Incentives, Conferences & Exhibitions Facilities And Services',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '3',
  //     icon: "assets/images/6.jpg",
  //     name: 'Standards For Food Safety And Hygiene Standards',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '4',
  //     icon: "assets/images/4.jpg",
  //     name: 'Standards For Safety And Security Standards',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '5',
  //     icon: "assets/images/5.jpg",
  //     name: ' Tour Guides And Hotel Employees Accommodation Standard',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '6',
  //     icon: "assets/images/3.png",
  //     name: 'Halal Compliance Standard For Accommodation And Catering Establishments',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '7',
  //     icon: "assets/images/7.jpg",
  //     name: 'Standards For Spa And Wellness Facilities',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '8',
  //     icon: "assets/images/1.jpg",
  //     name: 'Standards For Tourism Tours & Travel Enterprises',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '9',
  //     icon: "assets/images/2.png",
  //     name: 'Accommodation And Catering Establishment',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '10',
  //     icon: "assets/images/3.png",
  //     name: 'Meetings, Incentives, Conferences & Exhibitions Facilities And Services',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '11',
  //     icon: "assets/images/5.jpg",
  //     name: 'Standards For Food Safety And Hygiene Standards',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '12',
  //     icon: "assets/images/6.jpg",
  //     name: 'Standards For Safety And Security Standards',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '13',
  //     icon: "assets/images/4.jpg",
  //     name: ' Tour Guides And Hotel Employees Accommodation Standard',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '14',
  //     icon: "assets/images/3.png",
  //     name: 'Halal Compliance Standard For Accommodation And Catering Establishments',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '15',
  //     icon: "assets/images/1.jpg",
  //     name: 'Standards For Spa And Wellness Facilities',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '16',
  //     icon: "assets/images/7.jpg",
  //     name: 'Standards For Tourism Tours & Travel Enterprises',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '17',
  //     icon: "assets/images/4.jpg",
  //     name: 'Standards For Spa And Wellness Facilities',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '18',
  //     icon: "assets/images/1.jpg",
  //     name: 'Standards For Tourism Tours & Travel Enterprises',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '19',
  //     icon: "assets/images/3.png",
  //     name: 'Halal Compliance Standard For Accommodation And Catering Establishments',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  //   {
  //     id: '20',
  //     icon: "assets/images/1.jpg",
  //     name: 'Standards For Spa And Wellness Facilities',
  //     describe: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
  //   },
  // ]
  perPage = 10;
  page = 1
  errorMsg: string;
  hasError: boolean = false;
  isLoading: boolean = false;
  errorMessage: string;
  loading: boolean
  showLeaveCommentForm: boolean = false;
  selectedSubClassId: number | null = null;
  public form: FormGroup;
  modalRef: NgbModalRef;
  SubClassData: any;
  filteredStandards: any;
  constructor(private router: Router,
    private httpService: HttpService,
    public modal: NgbModal,
    public activeModal: NgbActiveModal, fb: FormBuilder,) {
    this.form = fb.group({
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['', Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      name: ["", Validators.compose([Validators.required])],
      phoneNumber: ["", Validators.compose([Validators.required])],
    });
  }

  ngOnInit(): void {
    this.loadDatas()
    this.loadData(null);
    this.getSubClassData(0);
  }

  private loadDatas(): any {
    this.loading = true;
    let model ={
        page: this.page-1,
        size: this.perPage
    }
    this.httpService.customerPortalPosts(`getall`, model).subscribe(
      (res: any) => {

        if (res.status == 200) {
          this.standards = res['data']['standards'];
          console.log(this.standards)
          this.loading = false;

        } else {
          Swal.fire('Failed', "Unable to fetch standards", 'error')
        }
      }, (error: any) => {
        Swal.fire("Error", error.message, "error");
      });
  }
  private loadData(subClass_Id: any | null): any {
    this.loading = true;
    this.httpService.customerPortalPost(`api/v1/portal/getStandards`, {}).subscribe(
      (res: any) => {
        if (res.status == '00') {
          this.standards = res['data'];
          console.log(this.standards)
          if (subClass_Id !== null) {
            this.filteredStandards = this.standards.filter((standard: any) => standard.subClass_Id === subClass_Id);
          } else {
            this.filteredStandards = this.standards;
          }
          console.log(this.filteredStandards);
          this.loading = false;

        } else {
          Swal.fire('Failed', "Unable to fetch standards", 'error')
        }
      }, (error: any) => {
        Swal.fire("Error", error.message, "error");
      });
  }

  onSubClassChange(event: Event): void {
    const subclassId = (event.target as HTMLSelectElement).value;
    const subClassIdOrNull = subclassId === "All" ? null : subclassId;
    this.loadData(subClassIdOrNull);
  }

  getSubClassData(event: number): void {
    this.loading = true;
    this.httpService
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

  viewStandard(standardId: number) {
    this.router.navigate(['/standards', standardId]);
  }

  toggleLeaveCommentForm() {
    if (this.showLeaveCommentForm) {
      this.hideLeaveCommentForm();
    } else {
      this.showLeaveCommentForm = true;
    }
  }
  hideLeaveCommentForm() {
    this.showLeaveCommentForm = false;
  }

  onleaveComment() { }

  openModal(modalContent: any) {
    this.modalRef = this.modal.open(modalContent, { centered: true, size: "md" });
  }

  closeModal() {
    this.activeModal.close();
  }

  onRegister(e: Event) {
    e.preventDefault();
    localStorage.setItem('isLoggedin', 'true');
    if (localStorage.getItem('isLoggedin')) {
      this.router.navigate(['/']);
    }
  }

}
