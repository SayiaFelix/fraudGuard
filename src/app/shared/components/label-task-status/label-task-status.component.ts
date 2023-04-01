import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-label-task-status',
  templateUrl: './label-task-status.component.html',
  styleUrls: ['./label-task-status.component.scss']
})
export class LabelTaskStatusComponent implements OnInit {
  label: any;
  labelClass: string;
  renderValue: string;
  @Input() value: any;
  @Input() rowData: any;

  constructor() { }
  ngOnInit(): void {

    console.log("this.value");
    console.log(this.value);

    if ( this.value === 'APPROVED') {
      this.label = 'APPROVED';
      this.labelClass = 'badge bg-primary mr-1';
    } else if (this.value === 'PENDING APPROVAL') {
      this.label = 'PENDING APPROVAL';
      this.labelClass = 'badge bg-danger mr-1';
    } else if (this.value === 'PARTIALLY APPROVED') {
      this.label = 'PARTIALLY APPROVED';
      this.labelClass = 'badge bg-warning mr-1';
    } else {
      this.label = 'Not set';
      this.labelClass = 'badge bg-light text-dark';
    }
    this.renderValue = this.value?.toString().toUpperCase();
  }
}

