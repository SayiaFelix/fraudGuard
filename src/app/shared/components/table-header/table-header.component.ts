import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss']
})
export class TableHeaderComponent implements OnInit {

  @Input() allColumns: any;
  columns: any

  @Output() toggleDropEvent = new EventEmitter<string>();
  @Output() changeColumnsEvent = new EventEmitter<string>();


  constructor() {

  }

  ngOnInit() {
    this.columns = [...this.allColumns]
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

    this.changeColumnsEvent.emit(this.columns);
  }

  isChecked(col: any) {
    return (
      this.columns.find((c: any) => {
        return c.name === col.name;
      }) !== undefined
    );
  }

  openAddItemModal() {

  }

  toggleDrop() {
    let checkList: HTMLElement = document.getElementById('list1')!;

    if (checkList.classList.contains('visible'))
      checkList.classList.remove('visible');
    else checkList.classList.add('visible');
  }
}
