import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import {DatatableComponent} from "@swimlane/ngx-datatable/lib/components/datatable.component";

@Component({
    selector: 'app-custom-ngx-table',
    templateUrl: './custom-ngx-table.component.html',
    styleUrls: ['./custom-ngx-table.component.scss']
})
export class CustomNgxTable implements OnInit {
    @ViewChild('table') table: DatatableComponent;
    ColumnMode = ColumnMode;
    loadingIndicator = true;
    reorderable = true;

  @Input() columns: any;
  @Input() rows: any;
  @Input() hasViewAndEdit: boolean;

  @Input() actions: any;

  @Output() outputEvent = new EventEmitter<string>();
  @Output() editEvent = new EventEmitter<string>();
  @Output() viewEvent = new EventEmitter<string>();



  // New Params
  data: any[];
  total: any;
  perPage = 10;
  pageSizes: number[] = [2, 5, 10, 20, 50, 100, 200];
  page = 1;
  dataLoaded = false;
  // New Params
  maxSize: number = 5;

    constructor(

    ) {

    }
    ngOnInit() {
    }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

  toggleExpandRow(row: any) {
    console.log(row);
    console.log(this.table);

    this.table.rowDetail.toggleExpandRow(row);
  }



  openEditModal(row: any) {
    this.editEvent.emit(row);
  }
  viewItem(row: any) {
    this.viewEvent.emit(row);
  }

  onChange() {
    this.getIndividualData(this.page);
  }

  getIndividualData(event: any): void {
    console.log(event);
  }

  sendEvent(row: any, action: any) {
      let result = {
        row: row,
        action: action
      }
    this.outputEvent.emit(JSON.stringify(result))
  }
}
