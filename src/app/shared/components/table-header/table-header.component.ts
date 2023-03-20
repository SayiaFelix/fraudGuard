import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DataExportationService} from "../../services/data-exportation.service";

@Component({
  selector: 'app-table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss']
})
export class TableHeaderComponent implements OnInit {

  @Input() allColumns: any;
  @Input() rows: any;
  @Input() title: any;

  @Input() showAddButton: boolean;
  @Input() hideExtraOptions: boolean;
  columns: any
  allColumnsChecked: boolean = true
  initialColumnArrangement: any

  @Output() toggleDropEvent = new EventEmitter<string>();
  @Output() changeColumnsEvent = new EventEmitter<string>();
  @Output() openAddModalEvent = new EventEmitter<string>();


  constructor(private dataExploration: DataExportationService) {

  }

  ngOnInit() {
    this.columns = [...this.allColumns]
    this.initialColumnArrangement = [...this.allColumns]
  }

  toggle(col: any) {
    const isChecked = this.isChecked(col);

    if (isChecked) {
      this.columns = this.columns.filter((c: any) => {
        return c.name !== col.name;
      });
    } else {
      this.columns = [...this.columns, col];
    }

    let common = this.initialColumnArrangement.filter((col: any) => this.columns.indexOf(col) !== -1);
    this.columns = common

    this.allColumnsChecked = this.columns.length == this.allColumns.length ? true : false
    this.changeColumnsEvent.emit(this.columns);
  }

  isChecked(col: any) {
    return (
      this.columns.find((c: any) => {
        return c.name === col.name;
      }) !== undefined
    );
  }

  checkAll(){
    this.columns = this.allColumns
    this.changeColumnsEvent.emit(this.columns);
    this.allColumnsChecked = true
  }

  uncheckAll(){
    if(this.columns.length == 0){
      this.columns = this.allColumns
      this.changeColumnsEvent.emit(this.columns);
      this.allColumnsChecked = true
    } else {
      this.columns = []
      this.changeColumnsEvent.emit(this.columns);
      this.allColumnsChecked = false
    }
  }

  openAddItemModal() {
    this.openAddModalEvent.emit();
  }

  toggleDrop() {
    let checkList: HTMLElement = document.getElementById('list1')!;

    if (checkList.classList.contains('visible'))
      checkList.classList.remove('visible');
    else checkList.classList.add('visible');
  }

  exportCSV() {
    let cols: string[] = this.columns.map((item: any) => {
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
    this.dataExploration.exportToCsv(arr, this.title)
  }

  exportXLSX() {
    let cols: string[] = this.columns.map((item: any) => {
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

    this.dataExploration.exportDataXlsx(arr, this.title)
  }

  exportPDF() {
    console.log(this.rows);
    let cols: string[] = this.columns.map((item: any) => {
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
      cols.forEach(colKey => {
        rowKeys.forEach(key => {
          if(colKey == key.toUpperCase()){
            temp.push(row[key])
          }
        })
      })

      arr.push(temp)
    })

    this.dataExploration.exportToPdf(cols, arr, this.title)
  }
}
