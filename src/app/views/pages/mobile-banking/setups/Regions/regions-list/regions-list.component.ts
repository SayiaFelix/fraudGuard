import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {ColumnMode, DatatableComponent} from '@swimlane/ngx-datatable';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpService} from "../../../../../../shared/services/http.service";
import {GlobalService} from "../../../../../../shared/services/global.service";
import {DefineRegionComponent} from "../define-region-component/define-region-component.component";
import Swal from 'sweetalert2';


@Component({
  selector: 'app-Regions-list',
  templateUrl: './regions-list.component.html',
  styleUrls: ['./regions-list.component.scss'],
  providers: [DatePipe]
})
export class RegionsListComponent implements OnInit {

  @ViewChild('table') table: DatatableComponent;

  tempProductData = [
    {
      id: 1,
      regionName: 'Nairobi',
      regionCode: '001',
      status: 'active',
      registeredOn: '12-02-2023',
    },
    {
      id: 2,
      regionName: 'Mombasa',
      regionCode: '002',
      status: 'active',
      registeredOn: '13-01-2023',
    }
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    {name: 'ID', prop: 'id'},
    {name: 'RegionName', prop: 'name'},
    {name: 'RegionCode', prop: 'code'},
    {name: 'Constituency', prop: 'constituency'},
    {name: 'County', prop: 'county'},
    {name: 'Status', prop: 'active'},
    {name: 'RegisteredOn', prop: 'registeredOn'},
    {name: 'Actions', prop: 'id'}
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "Regions";
  actions = ["Edit"];
  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              public fb: FormBuilder,
              public datePipe: DatePipe,
              public router: Router,
              public globalService: GlobalService) {
  }

  ngOnInit() {
    this.breadCrumbItems = [{label: 'Mobile banking', path: '/mobile-banking/setup/all-Regions'},
      {label: 'Pages', path: '/'}, {label: 'Products', active: true}];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      description: [this.formData ? this.formData.description : '', [Validators.required]],
      is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
    });
  }

  getIndividualData(event: number): void {
    const model = {
      page: 0,
      size: 50
    };
    this.httpService.mobileBankingPost("config/region/fetch/all",model).subscribe(
      (result:any)=>{
          if(result.status===200){
            this.rows = result.data;
          }
          else{
            Swal.fire('failed','unable to fetch records','error')
          }
      }
    )

    // this.httpService.mobileBankingPost('config/region/fetch/all', model).subscribe((res: any) => {

    //   if (res.status === 200) {
    //     Swal.fire('Success','records fetched successfully','success')
    //     .then(r=>console.log(r))
    //     setTimeout(() => {
    //       // this.data = res.data;
    //       this.rows = res.data;
    //       // let data = this.tempProductData;

    //       let total = res.totalItems;

    //     }, 10);
    //   } else {
    //   }
    // });
  }

  addRegion() {

    this.modalRef = this.modalService.open(DefineRegionComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.title = 'Add Region: ';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });

  }

  openEditRegionsModal(formData: any) {
    this.modalRef = this.modalService.open(DefineRegionComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.title = 'Edit Region';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
    }else if (eventData.action == 'Edit') {
      this.openEditRegionsModal(eventData.row);
    }

  }
}
