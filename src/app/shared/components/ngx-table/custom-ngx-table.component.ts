import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ColumnMode } from '@swimlane/ngx-datatable';
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component';

@Component({
  selector: 'app-custom-ngx-table',
  templateUrl: './custom-ngx-table.component.html',
  styleUrls: ['./custom-ngx-table.component.scss'],
})
export class CustomNgxTable implements OnInit {
  @ViewChild('table') table: DatatableComponent;
  ColumnMode = ColumnMode;
  @Input() loadingIndicator = true;
  reorderable = true;

  @Input() columns: any;
  @Input() rows: any;

  @Input() hasViewAndEdit: any;

  @Input() actions: any;

  @Output() outputEvent = new EventEmitter<string>();
  @Output() editEvent = new EventEmitter<string>();
  @Output() viewEvent = new EventEmitter<string>();
  @Output() updateFilteredRows = new EventEmitter<string>();

  // New Params
  data: any[];
  filterColumns: any[];
  toggleFilters: any[];
  total: any;
  perPage = 10;
  pageSizes: number[] = [2, 5, 10, 20, 50, 100];
  pageSize = 10;
  page = 1;
  dataLoaded = false;
  showPageSizeDropdown = false;
  // New Params
  maxSize: number = 5;
  selectedRange: any;

  constructor() {}

  ngOnInit() {
    console.log(this.columns, this.rows);

    this.filterColumns = [...this.columns].filter(
      (col: any) =>
        col['name'] !== 'Actions' &&
        col['name'] !== 'Description' &&
        col['name'] !== 'CreatedOn' &&
        col['name'] !== 'CreatedAt' &&
        col['name'] !== 'Active' &&
        col['name'] !== 'Status' &&
        col['name'] !== 'SystemRole'
    );

    this.toggleFilters = [...this.columns].filter(
      (col: any) =>
        col['name'] == 'Active' ||
        col['name'] == 'Status' ||
        col['name'] == 'SystemRole'
    );

    this.data = [...this.rows];
  }

  changePageSize(event: Event) {
    this.pageSize = parseInt((event.target as HTMLSelectElement).value);
  }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event);
  }

  toggleExpandRow(row: any) {
    console.log(row);
    console.log(this.table);

    this.table.rowDetail.toggleExpandRow(row);
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
      action: action,
    };
    this.outputEvent.emit(JSON.stringify(result));
  }

  updateFilter(event: any, col: any) {
    if (event.key === 'Backspace') {
      let tempRows = [...this.data];

      const filterInputs = document.querySelectorAll('.filterInputs');
      filterInputs.forEach((input: any) => {
        if (
          input.placeholder == 'CreatedOn' ||
          input.placeholder == 'createdOn' ||
          input.placeholder == 'CreatedAt' ||
          input.placeholder == 'createdAt'
        ) {
          if (this.selectedRange) {
            let startDate = this.selectedRange[0].toISOString();
            let endDate = this.selectedRange[1].toISOString();

            const temp = tempRows.filter(function (d: any) {
              let date: any =
                d['createdOn'] == undefined ? d['createdAt'] : d['createdOn'];
              date = date.replace(' ', 'T');
              return date >= startDate && date <= endDate;
            });
            tempRows = [...temp];
          }
        } else {
          const temp = tempRows.filter(function (d: any) {
            let key = input.placeholder;
            return (
              d[key].toString().toLowerCase().indexOf(input.value) !== -1 ||
              !input.value
            );
          });

          tempRows = [...temp];
        }
      });

      this.rows = [...tempRows];
    }

    const val = event.target.value.toLowerCase();

    let tempRows = [...this.rows];
    // filter our data
    const temp = tempRows.filter(function (d: any) {
      let key = col.prop;
      console.log(key, d[key]);

      return d[key].toString().toLowerCase().indexOf(val) !== -1 || !val;
    });

    // update the rows
    this.rows = temp;

    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.updateFilteredRows.emit(this.rows);
  }

  updateFilterSelect(event: any, col: any) {
    let tempRows = [...this.data];

      const filterInputs = document.querySelectorAll('.filterInputs');
      filterInputs.forEach((input: any) => {
        if (
          input.placeholder == 'CreatedOn' ||
          input.placeholder == 'createdOn' ||
          input.placeholder == 'CreatedAt' ||
          input.placeholder == 'createdAt'
        ) {
          if (this.selectedRange) {
            let startDate = this.selectedRange[0].toISOString();
            let endDate = this.selectedRange[1].toISOString();

            const temp = tempRows.filter(function (d: any) {
              let date: any =
                d['createdOn'] == undefined ? d['createdAt'] : d['createdOn'];
              date = date.replace(' ', 'T');
              return date >= startDate && date <= endDate;
            });
            tempRows = [...temp];
          }
        } else {
          const temp = tempRows.filter(function (d: any) {
            let key = input.placeholder;
            return (
              d[key].toString().toLowerCase().indexOf(input.value) !== -1 ||
              !input.value
            );
          });

          tempRows = [...temp];
        }
      });

      this.rows = [...tempRows];
    // let flag = false;
    // const filterInputs = document.querySelectorAll('.filterInputs');
    // filterInputs.forEach((input: any) => {
    //   if (input.value !== '') {
    //     flag = true;
    //   }
    // });
    // if (flag) {
    //   this.rows = [...this.rows]
    // } else {
    //   this.rows = [...this.data]
    // }
    const val = event.target.value.toLowerCase();

    let tempRowsArr = [...this.rows];
    // // filter our data
    const temp = tempRowsArr.filter(function (d: any) {
      let key = col.prop;
      console.log(key, d[key]);

      return d[key].toString().toLowerCase().indexOf(val) !== -1 || !val;
    });

    // // update the rows
    this.rows = temp;

    // // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.updateFilteredRows.emit(this.rows);
  }

  updateCreatedOn(event: any) {
    // const val = event.target.value.toLowerCase();
    let tempRows = [...this.rows];
    let startDate = event[0].toISOString();
    let endDate = event[1].toISOString();

    const temp = tempRows.filter(function (d: any) {
      let date: any =
        d['createdOn'] == undefined ? d['createdAt'] : d['createdOn'];
      date = date.replace(' ', 'T');
      return date >= startDate && date <= endDate;
    });

    // // update the rows
    this.rows = temp;

    // // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.updateFilteredRows.emit(this.rows);
  }

  clearFilters() {
    // refresh the rows
    this.rows = [...this.data];

    const filterInputs = document.querySelectorAll('.filterInputs');
    filterInputs.forEach((input: any) => {
      input.value = '';
    });

    const filterSelect = document.querySelectorAll('.filterSelect');
    filterSelect.forEach((select: any) => {
      select.selectedIndex = 0;
    });

    this.selectedRange = null;
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.updateFilteredRows.emit(this.rows);
  }
}
