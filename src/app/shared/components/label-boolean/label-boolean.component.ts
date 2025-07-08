import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-label-boolean',
  templateUrl: './label-boolean.component.html',
  styleUrls: ['./label-boolean.component.scss']
})
export class LabelBooleanComponent implements OnInit {
  label: any;
  labelClass: string;
  renderValue: string;
  @Input() value: any;
  @Input() rowData: any;

  constructor() {}
  ngOnInit(): void {
    if ( this.value === 1 || this.value === '1' || this.value === true || this.value === 'true' || this.value === 'TRUE' || this.value === 'True') {
      this.label = 'Yes';
      this.labelClass = 'badge bg-primary mr-1';
    } else if (this.value === 0 || this.value === '0' || this.value === false || this.value === 'false' || this.value === 'FALSE' || this.value === 'False' || this.value === null) {
      this.label = 'No';
      this.labelClass = 'badge bg-danger mr-1';
    } else {
      this.label = 'Not set';
      this.labelClass = 'badge bg-light text-dark';
    }
    if (this.value !== null){
      this.renderValue = this.value.toString().toUpperCase();
    }
  }

}
