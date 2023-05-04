import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import {catchError, finalize, map, Observable, throwError} from 'rxjs';
import { active } from 'sortablejs';
import { HttpService } from 'src/app/shared/services/http.service';
import {AddUserComponent} from "../add-user/add-user.component";
import Swal from "sweetalert2";

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.scss']
})
export class ListUsersComponent implements OnInit {

  @ViewChild('table') table: DatatableComponent;

  loading: boolean = true;

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  filteredRows: any = [];

  columns = [
    { name: 'ID', prop: 'frontendId' },
    { name: 'FirstName', prop:'firstName' },
    { name:'Email',prop:'email'},
    // { name: 'PhoneNumber', prop:'phoneNumber' },
    { name: 'Active', prop:'blocked'},
    { name: 'CreatedOn', prop:'createdOn' },
    { name: 'Actions', prop: 'id' }
  ];

  allColumns = [...this.columns];
  usersList$: Observable<any>

  public form: FormGroup;
  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;

  public modalRef: NgbModalRef;

  title: string = "Users";
  actions = ["View", "Edit"];
  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              public fb: FormBuilder,
              public router: Router,
  ) {


  }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Mobile banking', path: '/mobile-banking/products/all-products' },
      { label: 'Pages', path: '/' }, { label: 'Products', active: true }];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [this.formData ? this.formData.description : '', [Validators.required]],
      is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
    });
  }

  public addUser() {
    this.modalRef = this.modalService.open(AddUserComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add User';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      }
    }, (reason) => {
      console.log(reason);
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


          console.log("result");
          console.log(result);

          if(result['status'] === 200){
            let response = result['data'];
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
    console.log(data);
    
    this.filteredRows = data
  }

}
