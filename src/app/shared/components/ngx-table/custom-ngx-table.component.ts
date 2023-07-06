import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {ColumnMode} from '@swimlane/ngx-datatable';
import {DatatableComponent} from '@swimlane/ngx-datatable/lib/components/datatable.component';

@Component({
  selector: 'app-custom-ngx-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  @Input() disableFilters: any;

  @Input() actions: any;
  @Input() totalItems: any;

  @Output() outputEvent = new EventEmitter<string>();
  @Output() editEvent = new EventEmitter<string>();
  @Output() viewEvent = new EventEmitter<string>();
  @Output() updateFilteredRows = new EventEmitter<string>();

  @Output() outputStatus = new EventEmitter<string>();

  // New Params
  data: any[];
  filterColumns: any[];
  toggleFilters: any[];
  dateFilters: any[];
  total: any;
  perPage = 10;
  pageSizes: number[] = [2, 5, 10, 20, 50, 100, 1000];
  pageSize = 20;
  page = 1;
  dataLoaded = false;
  showPageSizeDropdown = false;
  // New Params
  maxSize: number = 5;
  selectedRange: any = {};

  constructor(private ref: ChangeDetectorRef) {

  }

  ngOnInit() {
    console.log(this.columns, this.rows);

    this.filterColumns = [...this.columns].filter(
      (col: any) =>
        col['name'] !== 'Actions' &&
        col['name'] !== 'Description' &&
        col['prop'] !== 'createdOn' &&
        col['prop'] !== 'createdAt' &&
        col['prop'] !== 'updatedOn' &&
        col['prop'] !== 'updatedAt' &&
        col['name'] !== 'Active' &&
        col['name'] !== 'Status' &&
        col['prop'] !== 'systemRole' &&
        col['prop'] !== 'firstTimeLogin'
    );

    this.toggleFilters = [...this.columns].filter(
      (col: any) =>
        col['name'] == 'Active' ||
        col['name'] == 'Status' ||
        col['prop'] == 'systemRole' ||
        col['prop'] == 'firstTimeLogin'
    );

    this.dateFilters = [...this.columns].filter(
      (col: any) => {
        if(col['prop'] == 'updatedOn' ||
            col['prop'] == 'createdOn' ||
            col['prop'] == 'createdAt' || col.prop === 'updatedAt') {
              this.selectedRange[col['prop']] = []

              return col
        } }

    );
    console.log(this.selectedRange);


    this.data = [...this.rows];
  }

  changePageSize(event: Event) {
    console.log('event when changing page.');
    console.log(event);
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

  updateFilter() {
      let tempRows = [...this.data];

      const filterInputs = document.querySelectorAll('.filterInputs');
      filterInputs.forEach((input: any) => {
        if (
          input.placeholder == 'CreatedOn' ||
          input.placeholder == 'createdOn' ||
          input.placeholder == 'CreatedAt' ||
          input.placeholder == 'createdAt' ||
          input.placeholder == 'updatedOn' ||
          input.placeholder == 'updatedAt'
        ) {
          if (this.selectedRange[input.placeholder].length > 0) {
            console.log(this.selectedRange);

            let startDate = this.selectedRange[input.placeholder][0].toISOString();
            let endDate = this.selectedRange[input.placeholder][1].toISOString();

            const temp = tempRows.filter(function (d: any) {
              let date: any = d[input.placeholder]
              date = date.replace(' ', 'T');
              return date >= startDate && date <= endDate;
            });
            tempRows = [...temp];
          }
        } else {
          const temp = tempRows.filter(function (d: any) {
            let key = input.placeholder;

            if (key === 'Active') {
              console.log("d[key]");
              console.log(d[key]);
            }
            return (
              d[key].toString().toLowerCase().indexOf(input.value) !== -1 ||
              !input.value
            );
          });

          tempRows = [...temp];
        }
      });

      const filterSelects = document.querySelectorAll('.filterSelect');
      filterSelects.forEach((select: any) => {
        let val = select.value;
        if (val == true || val == false || val == 'true' || val == 'false') {
          if (val == 'false') {
            val = false;
          } else if (val == 'true') {
            val = true;
          }
          const temp = tempRows.filter(function (d: any) {
            let key = select.options[0].value;
            // if (key.indexOf('blocked') !== -1) {
              return d[key] == val;
            // } else {
              return d[key] == val;
            // }
          });

          console.log("tempRows");
          console.log(temp);

          // this.data = [...temp];

          tempRows = [...temp];
        }
        else {
          const temp = tempRows.filter(function (d: any) {
            let key = select.options[0].value;
            return d[key] == val;
          });

          console.log(temp);
          tempRows = [...temp];
        }

        this.loadingIndicator = false;
      });

      this.rows = [...tempRows];
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.updateFilteredRows.emit(this.rows);

    // Detect changes after filter.
    this.ref.detectChanges();
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

    let dateKeys = Object.keys(this.selectedRange)
    dateKeys.forEach(key => {
      this.selectedRange[key] = []
    })

    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0;
    this.updateFilteredRows.emit(this.rows);
  }
}
