import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';
import {DatatableComponent} from "@swimlane/ngx-datatable/lib/components/datatable.component";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ColumnMode} from '@swimlane/ngx-datatable';
import {HttpService} from "../../../../../../shared/services/http.service";
import {AddRoleComponent} from "../add-role/add-role.component";
import {catchError, map, Observable, throwError} from 'rxjs';
import Swal from 'sweetalert2';
import {DeleteRoleModalComponent} from "../delete-role-modal/delete-role-modal.component";

@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})
export class RolesComponent implements OnInit {

  @ViewChild('table') table: DatatableComponent;

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  loading: boolean;
  reorderable = true;
  rolesList$: Observable<any>
  roleId: number;
  columns = [
    {name: 'ID', prop: 'frontendId'},
    {name: 'Name', prop: 'name'},
    {name: 'Status', prop: 'status'},
    {name: 'remarks', prop: 'remarks'},
    {name: 'SystemRole', prop: 'systemRole'},
    {name: 'createdOn', prop: 'createdOn'},
    {name: 'Actions', prop: 'id'}
  ];

  allColumns = [...this.columns]


  public form: FormGroup;
  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;

  public modalRef: NgbModalRef;

  title: string = "Roles";
  actions = ["Delete", "Edit"];


  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              public fb: FormBuilder,
              public router: Router,
  ) {


  }

  ngOnInit() {
    this.breadCrumbItems = [{label: 'Mobile banking', path: '/mobile-banking/products/all-products'},
      {label: 'Pages', path: '/'}, {label: 'Products', active: true}];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [this.formData ? this.formData.description : '', [Validators.required]],
      is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
    });
  }


  getIndividualData(event: number): void {

    this.loading = true;

    const model = {
      "page": 0,
      "size": 50
    };

    this.rolesList$ = this.httpService.mobileBankingPost('api/v1/admin/role/all', model)
      .pipe(
        catchError((error: any) => {
          Swal.fire('Error', "Unable to fetch records", 'error');
          return throwError(error);
        }),
        map((result: any) => {
          if (result['status'] === 200) {

            this.loading = false;
            console.log(result);
            // console.log(result.data);
            let response = result['data'];
            this.rows = response.map((item: any, index: any) => {
              const res = {...item, frontendId: index + 1};
              console.log(res);
              return res;
            });
            return result
          } else {
            return []
          }
        }),
      )
  }

  openAddRoleModal() {
    this.modalRef = this.modalService.open(AddRoleComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Role: ';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openEditRoleModal(formData: any) {

    console.log("output formData")
    console.log(formData)
    this.modalRef = this.modalService.open(AddRoleComponent, {centered: true});
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.title = 'Edit Role';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openDeleteRoleModal(formData: any) {

    this.modalRef = this.modalService.open(DeleteRoleModalComponent, {centered: true});
    this.modalRef.componentInstance.body = 'Do you want to delete this role?';
    this.modalRef.componentInstance.title = 'Delete Role';
    this.modalRef.componentInstance.roleId = formData.id;
    console.log(formData.id)
    this.modalRef.result.then((result) => {
      if (result == "success") {
        this.modalRef.close();
        this.getIndividualData(0);
      }
    })

  }
  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'Delete') {
      this.openDeleteRoleModal(eventData.row);
    } else if (eventData.action == 'Edit') {
      this.openEditRoleModal(eventData.row);
    }

  }
}
