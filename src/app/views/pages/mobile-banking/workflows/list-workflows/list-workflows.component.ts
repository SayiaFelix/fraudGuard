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
import { AddWorkflowComponent } from '../add-workflow/add-workflow.component';

import { catchError, map, Observable, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-list-requests',
  templateUrl: './list-workflows.component.html',
  styleUrls: ['./list-workflows.component.scss'],
  providers: [DatePipe],
})

/**
 * Starter-component
 */
export class ListWorkflowsComponent implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  actions=["View","Edit","Delete"]


  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  columns = [

    { name: '#', prop: 'frontendId' },
    { name: 'WorkflowName', prop: 'name' },
    {name:'Remarks',prop:'remarks'},
    { name: 'Process', prop: 'process' },
    { name: 'CreatedOn', prop: 'createdOn' },
    { name: 'Actions', prop: 'id' },
  ];

  allColumns = [...this.columns];

  workflowList$:Observable<any>
  public form: FormGroup;

  public formData: { productName: any; remarks: any; image: any };
  ColumnMode = ColumnMode;
  public imageFile: File;
  public modalRef: NgbModalRef;

  title: string = "New Workflow";

  workflowData: any;


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

  }

  getIndividualData(event: number): void {
    // this.rows = this.tempProductData;

    // this.temp = [...this.tempProductData];

    const model = {
      "page":0,
      "size":50
    };

    this.loading = true;

    this.workflowList$ = this.httpService.mobileBankingPost('workflow/get/workflows', model)
      .pipe(
        catchError((error: any) => {
          Swal.fire('Error', "Unable to fetch records", 'error');
          return throwError(error);
        }),
        map((result: any) => {


          console.log("result");
          console.log(result);

          if(result['status'] === 200){
            this.loading = false;

            let response = result['data']['content'];

            this.rows = response.map((item: any, index: any) => {
              const res = {...item, frontendId: index + 1};
              return res;
            });
            return result
          } else {
            return []
          }
        }),
      )

  }

  openAddWorkflowModal() {

    this.modalRef = this.modalService.open(AddWorkflowComponent, {centered: true,size:"md"});
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
    this.modalRef = this.modalService.open(AddWorkflowComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Workflow';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((ans) => {
      if (ans === 'success') {
        this.getIndividualData(0);
      }
      else{
        console.log("error occurred")
      }
    });
  }

  openDeleteWorkflowModal(formData:any){
    this.modalRef = this.modalService.open(ConfirmDialogComponent,{centered:true});
    this.modalRef.componentInstance.title ='Delete Workflow';
    this.modalRef.componentInstance.body='Do you want to delete this workflow?'
    this.modalRef.componentInstance.formData =formData;
    this.modalRef.result.then((ans) => {
      if (ans === 'success') {
        const model={
            id: formData.id
        }

        this.httpService.mobileBankingPost('workflow/delete',model)
        .subscribe(
          (result:any) =>{
            if (result.status == 200){
             Swal.fire('workflow deleted successfully',result.message,'success')
             .then(r=>console.log(r))
             this.getIndividualData(0)
          }
          else{
            Swal.fire('failed','unable to delete workflow','error')
            .then (r=>(console.log(r)))
          }
          }
        )
        }

      }
    )
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  navigateToViewProduct(data: any) {
    console.log("data");
    console.log(data);

    this.router.navigateByUrl(`/mobile-banking/workflows/workflow/${data.id}`);
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
    else if (eventData.action == 'Delete'){
      this.openDeleteWorkflowModal(eventData.row);
    }
  }
}
