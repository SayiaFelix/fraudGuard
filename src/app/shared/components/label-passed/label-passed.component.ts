import { Component, OnInit, Input } from '@angular/core';


@Component({
  selector: 'app-label-passed',
  templateUrl: './label-passed.component.html',
  styleUrls: ['./label-passed.component.scss']
})
export class LabelPassedComponent implements OnInit {

  label: any;
  labelClass: string;
  renderValue: string;
  @Input() value: any;
  @Input() rowData: any;

  constructor() {}
  ngOnInit(): void {
    if ( this.value === 1 || this.value === true || this.value === 'true' || this.value === 'TRUE' || this.value === 'passed') {
      this.label = 'Passed';
      this.labelClass = 'badge badge-success mr-1';
    } else if (this.value === 0 || this.value === false || this.value === 'false' || this.value === 'FALSE'  || this.value === 'failed') {
      this.label = 'Failed';
      this.labelClass = 'badge badge-danger mr-1';
    } else {
      this.label = 'Not set';
      this.labelClass = 'badge badge-default mr-1';
    }
   this.renderValue = this.value.toString().toUpperCase();
  }

}
