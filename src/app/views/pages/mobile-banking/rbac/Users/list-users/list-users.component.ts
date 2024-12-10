import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import {catchError, finalize, map, Observable, throwError} from 'rxjs';
import { active } from 'sortablejs';
import { HttpService } from 'src/app/shared/services/http.service';
import {AddUserComponent} from "../add-user/add-user.component";
import Swal from "sweetalert2";
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CustomValidators } from 'ngx-custom-validators';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.scss']
})
export class ListUsersComponent implements OnInit {

  @ViewChild('table') table: DatatableComponent;

  loading: boolean = true;
  defaultProfileImage: SafeResourceUrl = "assets/images/p1.png";
  existingImage: SafeResourceUrl;
  isLoading: boolean = false;

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  filteredRows: any = [];
  showLeaveCommentForm: boolean = false;
  showFormImage = 'assets/images/chats.png'
  // assessors: any =[];
  assessors: any = [
    // {
    //   id: '1',
    //   existingImage: "assets/images/p1.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '2',
    //   existingImage: "assets/images/p2.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '3',
    //   existingImage: "assets/images/p3.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '4',
    //   existingImage: "assets/images/p4.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '5',
    //   existingImage: "assets/images/p5.png",
    //   title:"Assessor",
    //   first_name: ' Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '6',
    //   existingImage: "assets/images/p6.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '7',
    //   existingImage: "assets/images/p7.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
    // {
    //   id: '8',
    //   existingImage: "assets/images/p8.png",
    //   title:"Assessor",
    //   first_name: 'Jane Akinyi',
    //   bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut enim finibus, porta lorem sed, tincidunt purus. Nullam eget pellentesque erat. Phasellus eget lectus cursus, gravida eros eget, aliquet odio."
    // },
  ]
  columns = [
    { name: 'ID', prop: 'frontendId' },
    { name: 'First Name', prop:'firstName' },
    { name:'Email',prop:'email'},
    // { name: 'PhoneNumber', prop:'phoneNumber' },
    { name: 'Status', prop:'blocked'},
    { name: 'First Time Login', prop:'firstTimeLogin'},
    { name: 'Created On', prop:'createdOn' },
    { name: 'Actions', prop: 'id' }
  ];


 dashboards: { id: string; src: string }[] = [
  {
    id: 'dashboard1',
    src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet10',
  },
  {
    id: 'dashboard2',
    src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet11',
  },
  {
    id: 'dashboard3',
    src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet12',
  },
  {
    id: 'dashboard4',
    src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet13',
  },
  {
    id: 'dashboard5',
    src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet14',
  },
  {
    id: 'dashboard6',
    src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet15',
  },
];


  paginatedDashboards: { id: string; src: string }[] = [];
  currentPage = 0;
  itemsPerPage = 4;

  allColumns = [...this.columns];
  usersList$: Observable<any>

  public form: FormGroup;
  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;

  public modalRef: NgbModalRef;

  title: string = "Users";
  actions = ["View", "Edit"];
  totalRecords: number;

 
  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              public fb: FormBuilder,
              public router: Router,
              private sanitizer: DomSanitizer
  ) {
    this.form = fb.group({
      name: ["", Validators.compose([Validators.required])],
      email: ['',Validators.compose([Validators.required, CustomValidators.email])],
      subject: ['',Validators.compose([Validators.required])],
      message: ["", Validators.compose([Validators.required])],
      phone_number: ["", Validators.compose([Validators.required, this.phoneNumberValidator])],
    });

  }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Mobile banking', path: '/mobile-banking/products/all-products' },
      { label: 'Pages', path: '/' }, { label: 'Products', active: true }];
    this.loadData();
    this.updatePagination()

  }
  updatePagination() {
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDashboards = this.dashboards.slice(startIndex, endIndex);
  }
  
  nextPage() {
    if ((this.currentPage + 1) * this.itemsPerPage < this.dashboards.length) {
      this.currentPage++;
      this.updatePagination();
    }
  }
  
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
    }}
  get f(): { [p: string]: AbstractControl } {
    return this.form.controls;
  }

  phoneNumberValidator(control: AbstractControl): { [key: string]: any } | null {
    const phoneNumber = control.value;
    const phonePattern = /^(254\d{9}|0\d{9})$/;
    return phonePattern.test(phoneNumber) ? null : { invalidPhoneNumber: true };
  }

  onleaveComment() {
    this.isLoading = true;
    const model = {
      name: this.form.value.name,
      phone_number: this.form.value.phone_number, 
      subject: this.form.value.subject, 
      message: this.form.value.message,
      email: this.form.value.email,
    };
    console.log(model)
    this.httpService.customerPortalPost(`api/v1/auth/customerEnquirer`, model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          this.isLoading = false;
          this.hideLeaveCommentForm();
          // this.loadData()
          Swal.fire('Customer Enquire Successfully',
            'success').then(r => console.log(r))
        } else {
          this.hideLeaveCommentForm();
          Swal.fire('Customer Enquire  Failed, Try Again',
            'error').then(r => console.log(r))
            this.isLoading = false;
        }
      },
      (error: any) => {
        this.hideLeaveCommentForm();
        Swal.fire('Customer Enquire error',
          'error')
          this.isLoading = false;
      }
    );
  }

  public addUser() {
    this.modalRef = this.modalService.open(AddUserComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add User';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      }
    }, (reason) => {
      // console.log(reason);
    });
  }
  public editUser(formData: any) {
    this.modalRef = this.modalService.open(AddUserComponent, {centered: true});
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.title = 'Edit User';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      }
    }, (reason) => {
    });
  }

 
  toggleLeaveCommentForm() {
    if (this.showLeaveCommentForm) {
      this.hideLeaveCommentForm();
    } else {
      this.showLeaveCommentForm = true;
      this.showFormImage = this.showLeaveCommentForm ? 'assets/images/chat.png' : 'assets/images/chats.png';
    }
  }
  hideLeaveCommentForm() {
    this.showLeaveCommentForm = false;
    this.form.reset();
  }

  private loadData(): any {
    this.loading = true;
    this.httpService.customerPortalPost(`api/v1/auth/getAllAssessors`, {}).subscribe(
      (res: any) => {
        if (res.status == '00') {
          this.assessors = res['data']
          
          this.assessors.forEach((assessor: any) => {
            if (assessor.profile_url) {
              assessor.profile_url = assessor.profile_url.replace('10.20.2.19:7600', '');
              assessor.profile_url = 'https://test-api.ekenya.co.ke/tra-backend' + assessor.profile_url;
              // console.log(assessor.profile_url)
              // Now, the profile_url should be in the format "https://tra/api/v1/admin/task/files/download?filename=a775e169-66aa-4bd8-85e0-acac295fafd4.png"
              assessor.existingImage = this.sanitizer.bypassSecurityTrustResourceUrl(assessor.profile_url);
            } else {
              assessor.existingImage = this.defaultProfileImage;
            }
          });
          // console.log(this.assessors);
          this.loading = false;
        } else {
          console.log('Failed', 'Unable to fetch standards', 'error');
        }
      },
      (error: any) => {
        console.log('Error', error.message, 'error');
      }
    );
  }
  
  getIndividualData(event: number): void {
    this.loading  = true;

    const model = {
      filter: "all",
      page: 0,
      size: 50
    };

    this.usersList$ = this.httpService.mobileBankingPost('api/v1/admin/user/all', model)
      .pipe(
        catchError((error: any) => {
          Swal.fire('Error', "Unable to fetch records", 'error');
          return throwError(error);
        }),
        map((result: any) => {


          // console.log("result");
          // console.log(result);

          if(result['status'] === 200){
            let response = result['data'];
            this.totalRecords = result.totalItems;
            this.rows = response.map((item: any, index: any) => {
              const res = {...item, frontendId: index + 1};
              this.loading = false;
              return res;
            });
            return result
          } else {
            return []
          }
        }),
      )

    // this.httpService.mobileBankingPost('api/v1/corporate/admin/list-products/all', model).subscribe((res: any) => {

    //   if (res.status === 200) {
    //     setTimeout(() => {
    //       // this.data = res.data;
    //       this.rows = this.tempProductData;
    //       // let data = this.tempProductData;

    //       let total = res.totalItems;

    //     }, 10);
    //   } else {
    //   }
    // });
  }


  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  navigateToViewProduct(data: any) {
    this.router.navigateByUrl(`/mobile-banking/Users/users/${data.id}`);
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this.navigateToViewProduct(eventData.row);
    }else if (eventData.action == 'Edit') {
      this.editUser(eventData.row);
    }

  }

  updateFilteredRowsEvent(data: string) {
    // console.log(data);

    this.filteredRows = data
  }

}
