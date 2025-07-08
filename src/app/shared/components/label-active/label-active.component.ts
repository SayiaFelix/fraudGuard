import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-label-active',
  templateUrl: './label-active.component.html',
  styleUrls: ['./label-active.component.scss']
})
export class LabelActiveComponent implements OnInit {
  label: any;
  labelClass: string;
  renderValue: string;
  @Input() value: any;
  @Input() rowData: any;

  constructor() { }
  ngOnInit(): void {

    console.log("value")
    console.log(this.value);

    if ( this.value === 1 || this.value === true || this.value === 'true' || this.value === 'TRUE') {
      this.label = 'Active';
      this.labelClass = 'badge bg-primary mr-1';
    } else if (this.value === 0 || this.value === false || this.value === 'false' || this.value === 'FALSE') {
      this.label = 'Inactive';
      this.labelClass = 'badge bg-danger mr-1';
    } else {
      this.label = 'Not set';
      this.labelClass = 'badge bg-light text-dark';
    }
    this.renderValue = this.value?.toString().toUpperCase();
  }
}

