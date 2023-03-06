import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';
import {DatatableComponent} from "@swimlane/ngx-datatable/lib/components/datatable.component";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import { ColumnMode } from '@swimlane/ngx-datatable';
import {HttpService} from "../../../../../../shared/services/http.service";

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit {

  @ViewChild('table') table: DatatableComponent;

  tempRolesData = [
    {
      id: 1,
      profileName: 'SUPER-ADMIN',
      description: 'Super Admin',
      userType: 'BANK_ADMIN',
      status: true,
      createdOn: '12-02-2023',

    },
    {
      id: 2,
      profileName: 'HR',
      description: 'Human Resource Profile',
      userType: 'BANK_ADMIN',
      status: true,
      createdOn: '12-02-2023',
    },
    {
      id: 3,
      profileName: 'Finance',
      description: 'Access Financial',
      userType: 'BANK_ADMIN',
      status: true,
      createdOn: '12-02-2023',
    }
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'ProfileName', prop:'profileName' },
    { name: 'Description', prop:'description' },
    { name: 'UserType', prop:'userType' },
    { name: 'CreatedOn', prop:'createdOn' },
    { name: 'Actions', prop: 'id' }
  ];

  public form: FormGroup;
  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;


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

    this.rows = this.tempRolesData;

    const model = {
      page: 0,
      size: 5
    };

    this.httpService.mobileBankingPost('api/v1/corporate/admin/list-products/all', model).subscribe((res: any) => {

      if (res.status === 200) {
        setTimeout(() => {
          // this.data = res.data;
          this.rows = this.tempRolesData;
          // let data = this.tempProductData;

          let total = res.totalItems;

        }, 10);
      } else {
      }
    });
  }

  openAddRoleModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
  }

  openEditProductModal(content: TemplateRef<any>) {
    this.modalService.open(content, {centered: true}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {});
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

}
