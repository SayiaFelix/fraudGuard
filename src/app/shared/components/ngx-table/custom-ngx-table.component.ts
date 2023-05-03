import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core'
import { ColumnMode } from '@swimlane/ngx-datatable'
import { DatatableComponent } from '@swimlane/ngx-datatable/lib/components/datatable.component'

@Component({
  selector: 'app-custom-ngx-table',
  templateUrl: './custom-ngx-table.component.html',
  styleUrls: ['./custom-ngx-table.component.scss'],
})
export class CustomNgxTable implements OnInit {
  @ViewChild('table') table: DatatableComponent
  ColumnMode = ColumnMode
  @Input() loadingIndicator = true
  reorderable = true

  @Input() columns: any
  @Input() rows: any

  @Input() hasViewAndEdit: any

  @Input() actions: any

  @Output() outputEvent = new EventEmitter<string>()
  @Output() editEvent = new EventEmitter<string>()
  @Output() viewEvent = new EventEmitter<string>()

  // New Params
  data: any[]
  filterColumns: any[]
  toggleFilters: any[]
  total: any
  perPage = 10
  pageSizes: number[] = [2, 5, 10, 20, 50, 100]
  pageSize = 10
  page = 1
  dataLoaded = false
  showPageSizeDropdown = false
  // New Params
  maxSize: number = 5

  constructor() {}

  ngOnInit() {
    this.filterColumns = [...this.columns].filter(
      (col: any) => col['name'] !== 'Actions' && col['name'] !== 'Description' && col['name'] !== 'CreatedOn' && col['name'] !== 'Active' && col['name'] !== 'Status' && col['name'] !== 'SystemRole',
    )

    this.toggleFilters = [...this.columns].filter(
      (col: any) => col['name'] == 'Active' || col['name'] == 'Status' || col['name'] == 'SystemRole',
    )
    
    this.data = [...this.rows]
  }

  changePageSize(event: Event) {
    this.pageSize = parseInt((event.target as HTMLSelectElement).value)
  }

  onDetailToggle(event: any) {
    console.log('Detail Toggled', event)
  }

  toggleExpandRow(row: any) {
    console.log(row)
    console.log(this.table)

    this.table.rowDetail.toggleExpandRow(row)
  }

  onChange() {
    this.getIndividualData(this.page)
  }

  getIndividualData(event: any): void {
    console.log(event)
  }

  sendEvent(row: any, action: any) {
    let result = {
      row: row,
      action: action,
    }
    this.outputEvent.emit(JSON.stringify(result))
  }

  updateFilter( event: any, col: any) {
    
    const val = event.target.value.toLowerCase()
    
    let tempRows = [...this.rows]
    // filter our data    
    const temp = tempRows.filter(function (d: any) {
      let key = col.prop
      console.log(col, val, d);
      return d[key].toString().toLowerCase().indexOf(val) !== -1 || !val
    })        

    // update the rows
    this.rows = temp
    
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0
  }
  
  clearFilters() {
  // refresh the rows
    this.rows = [...this.data]

    const filterInputs = document.querySelectorAll('.filterInputs');
    filterInputs.forEach((input: any) => {    
      input.value = '';
    });    

    const filterSelect = document.querySelectorAll('.filterSelect');
    filterSelect.forEach((select: any) => {    
      select.selectedIndex  = 0;
    });   
    // Whenever the filter changes, always go back to the first page
    this.table.offset = 0
  }
  
}
