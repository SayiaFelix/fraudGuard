import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {ColumnMode, DatatableComponent} from '@swimlane/ngx-datatable';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpService} from "../../../../../../shared/services/http.service";
import {GlobalService} from "../../../../../../shared/services/global.service";
import {DefineRegionComponent} from "../define-region-component/define-region-component.component";


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
    {name: 'RegionName', prop: 'regionName'},
    {name: 'RegionCode', prop: 'regionCode'},
    {name: 'Status', prop: 'status'},
    {name: 'RegisteredOn', prop: 'registeredOn'},
    {name: 'Actions', prop: 'id'}
  ];

  public form: FormGroup;
  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;


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

    this.rows = this.tempProductData;

    const model = {
      page: 0,
      size: 5
    };

    this.httpService.mobileBankingPost('api/v1/corporate/admin/list-products/all', model).subscribe((res: any) => {

      if (res.status === 200) {
        setTimeout(() => {
          // this.data = res.data;
          this.rows = this.tempProductData;
          // let data = this.tempProductData;

          let total = res.totalItems;

        }, 10);
      } else {
      }
    });
  }

  openAddProductModal() {

    this.modalRef = this.modalService.open(DefineRegionComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.formData = "formData";
    this.modalRef.componentInstance.title = 'Add Region: ';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });

    // this.modalService.open(DefineRegionComponent, {centered: true, size: "xl"}).result.then((result) => {
    //   console.log("Modal closed" + result);
    // }).catch((res) => {
    // });
  }

  openEditProductModal(rowData: any) {
    this.modalService.open(DefineRegionComponent, {centered: true, size: "xl"}).result.then((result) => {
      console.log("Modal closed" + result);
    }).catch((res) => {
    });
  }
  toggleExpandRow(row: any) {
    console.log(row);
    // console.log(this.table);
    this.table.rowDetail.toggleExpandRow(row);

    // this.table.rowDetail.toggleExpandRow(row);

  }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

  navigateToViewProduct(data: any) {
    this.router.navigateByUrl(`/mobile-banking/products/product/${data.id}`);
  }

  private viewRegion(data: any): void {
    this.router.navigate(['products', 'product', data.id], {queryParams: data});
  }
}
