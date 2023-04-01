import {
  Component,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ColumnMode } from '@swimlane/ngx-datatable';

import { GlobalService } from '../../../../../shared/services/global.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxDatatableComponent } from '../../../tables/ngx-datatable/ngx-datatable.component';
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component';
import { DataExportationService } from 'src/app/shared/services/data-exportation.service';
import { HttpService } from 'src/app/shared/services/http.service';
import {AddWorkflowStepComponent} from "../add-workflow-step/add-workflow-step.component";
import { AddCustomerComponent } from '../add-customer/add-customer.component';

@Component({
  selector: 'app-my-tasks',
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.scss'],
  providers: [DatePipe],
})

/**
 * Starter-component
 */
export class MyTasksComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  actions=["View"]
  tempProductData = [
    {
      Workflowid: 2,
      WorkflowName: 'USERS CREATE',
      Process: 'CREATE USER',
      Description:'Approve Create User',
      TaskStatus: 'PARTIALLY APPROVED',
      createdOn: '12-02-2023',
      currentStep: 'Step 1',
    },
    {
      Workflowid: 2,
      WorkflowName: 'USERS EDIT',
      Process: 'EDIT USER',
      Description:'Approve User Edit',
      TaskStatus: 'APPROVED',
      createdOn: '12-02-2023',
      currentStep: 'Step 3',
    },
    {
      Workflowid: 2,
      WorkflowName: 'USERS EDIT',
      Process: 'EDIT USER',
      Description:'Approve User Edit',
      TaskStatus: 'PENDING APPROVAL',
      createdOn: '12-02-2023',
      currentStep: 'Step 1',
    },

  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    { name: 'DateRecorded', prop: 'createdOn' },
    { name: 'Workflow', prop: 'WorkflowName' },
    {name:'Process',prop:'Description'},
    { name: 'Task Description', prop: 'Description' },
    { name: 'Current Step', prop: 'currentStep' },
    { name: 'TaskStatus', prop: 'taskStatus' },
    { name: 'Actions', prop: 'id' },
  ];

  allColumns = [...this.columns];

  public form: FormGroup;
  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "My Tasks";


  constructor(
    private httpService: HttpService,
    private modalService: NgbModal,
    public fb: FormBuilder,
    public router: Router,
    private dataExploration: DataExportationService
  ) {}

  ngOnInit() {
    this.breadCrumbItems = [
      {
        label: 'Mobile banking',
        path: '/mobile-banking/workflows/list-workflows',
      },
      { label: 'Pages', path: '/' },
      { label: 'Workflows', active: true },
    ];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      image: [''],
    });
  }

  getIndividualData(event: number): void {
    this.rows = this.tempProductData;

    this.temp = [...this.tempProductData];

    const model = {
      page: 0,
      size: 5,
    };

    this.httpService
      .mobileBankingPost('api/v1/corporate/admin/list-products/all', model)
      .subscribe((res: any) => {
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

    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true,size:"md"});
    this.modalRef.componentInstance.title = 'Add New Workflow';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      } else {
        console.log("Error occurred")
      }
    });
  }

  openEditProductModal(formData: any) {
    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Workflow';
    this.modalRef.componentInstance.formData = formData;
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

  navigateToViewProduct(data: any) {
    this.router.navigateByUrl(`/mobile-banking/workflows/my-task/${7}`);
  }

  toggleExpandRow(row: any) {
    console.log(row);
    console.log(this.table);

    this.table.rowDetail.toggleExpandRow(row);
  }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

  updateFilter(event: any, columnName: any) {
    const val = event.target.value.toLowerCase();

    // filter our data
    const temp = this.temp.filter(function (d: any) {
      return d.productName.toLowerCase().indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
  }

  toggle(col: any) {
    const isChecked = this.isChecked(col);

    if (isChecked) {
      this.columns = this.columns.filter((c) => {
        return c.name !== col.name;
      });
    } else {
      this.columns = [...this.columns, col];
    }
  }

  isChecked(col: any) {
    return (
      this.columns.find((c) => {
        return c.name === col.name;
      }) !== undefined
    );
  }

  toggleDrop() {
    let checkList: HTMLElement = document.getElementById('list1')!;

    if (checkList.classList.contains('visible'))
      checkList.classList.remove('visible');
    else checkList.classList.add('visible');
  }

  exportCSV() {
    let cols: string[] = this.columns.map(item => {
      if(item['name'].toLowerCase() !== 'actions'){
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[]= []

    this.rows.forEach((row: any) => {
      let temp: Record<string, string> = {}
      cols.forEach(key => {
        temp = {...temp, [key]: row[key]}
      })
      arr.push(temp)
    })
    this.dataExploration.exportToCsv(arr, 'Products')
  }

  exportXLSX() {
    let cols: string[] = this.columns.map(item => {
      if(item['name'].toLowerCase() !== 'actions'){
        return item['prop']
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let arr: Record<string, string>[]= []

    this.rows.forEach((row: any) => {
      let temp: Record<string, string> = {}
      cols.forEach(key => {
        temp = {...temp, [key]: row[key]}
      })
      arr.push(temp)
    })

    this.dataExploration.exportDataXlsx(arr, 'Products')
  }

  exportPDF() {
    console.log(this.rows);
    let cols: string[] = this.columns.map(item => {
      if(item['name'].toLowerCase() !== 'actions'){
        return item['name'].toUpperCase()
      } else {
        return ''
      }
    })
    cols = cols.filter(item => item !== '')
    let rowKeys: string[] = Object.keys(this.rows[0]);
    let arr: string[][]= []
    this.rows.forEach((row: any) => {
      let temp: string[] = []
      rowKeys.forEach(key => {
        temp.push(row[key])
      })
      arr.push(temp)
    })
    this.dataExploration.exportToPdf(cols, arr, 'Products')
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }
  triggerEvent(data:any){
    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this. navigateToViewProduct(eventData.row);
    }else if (eventData.action == 'Edit') {
      this.openEditProductModal(eventData.row);
    }
  }
}
