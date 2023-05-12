import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';
import {DatatableComponent} from "@swimlane/ngx-datatable/lib/components/datatable.component";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { ColumnMode } from '@swimlane/ngx-datatable';
import {HttpService} from "../../../../../../shared/services/http.service";
import {AddRoleComponent} from "../../roles/add-role/add-role.component";
import {AddProfileComponent} from "../add-profile/add-profile.component";
import Swal from 'sweetalert2';
import { catchError, map, Observable, observable, throwError } from 'rxjs';

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit {

  @ViewChild('table') table: DatatableComponent;


  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  filteredRows: any = [];
  loading: boolean = true;

  profilesList$:Observable<any>
  columns = [
    { name: 'ID', prop: 'frontendId' },
    { name: 'Name', prop:'name' },
    { name: 'Remarks', prop:'remarks' },
    // { name: 'UserType', prop:'userType' },
    { name: 'Created On', prop:'createdOn' },
    { name: 'Actions', prop: 'id' }
  ];

  allColumns = [...this.columns]

  public form: FormGroup;
  private modalRef: NgbModalRef;

  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;

  title: string = "Profiles";
  actions = ["View", "Edit"];
  data: any;

  totalRecords: number;
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


  getIndividualData(event: number): void {

    this.loading = true;

    const model = {
      page:0,
      size:50
    };

    this.profilesList$ = this.httpService.mobileBankingPost('api/v1/admin/profile/get/all', model)
      .pipe(
        catchError((error: any) => {
          Swal.fire('Error', "unable to fetch records", 'error');
          return throwError(error);
        }),
        map((result: any) => {
          if(result['status'] === 200){

            this.loading = false;
            this.totalRecords = result.totalItems;

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

  openAddProfileModal() {
    this.modalRef = this.modalService.open(AddProfileComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Add Profile: ';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }



  openEditProfileModal(formData: any) {
    this.modalRef = this.modalService.open(AddProfileComponent, {centered: true});
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.title = 'Edit Profile: ';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  openViewProfile(data: any) {
    this.router.navigateByUrl(`/mobile-banking/rbac/profile/${data.id}`);
  }

  toggleExpandRow(row: any) {
    this.table.rowDetail.toggleExpandRow(row);
  }
  onDetailToggle(event:any){
    console.log('Detail Toggled', event);
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this.openViewProfile(eventData.row);
    }else if (eventData.action == 'Edit') {
      this.openEditProfileModal(eventData.row);
    }

  }

  updateFilteredRowsEvent(data: string) {
    console.log(data);

    this.filteredRows = data
  }
}
