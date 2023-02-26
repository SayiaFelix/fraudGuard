import { Component, OnInit,Input } from '@angular/core';

@Component({
  selector: 'app-label-online',
  templateUrl: './label-online.component.html',
  styleUrls: ['./label-online.component.scss']
})
export class LabelOnlineComponent implements OnInit {

  label: any;
  labelClass: string;
  renderValue: string;
  @Input() value: any;
  @Input() rowData: any;

  constructor() {}
  ngOnInit(): void {
    if ( this.value === 1 || this.value === true || this.value === 'true' || this.value === 'TRUE' || this.value === 'online') {
      this.label = 'Online';
      this.labelClass = 'badge badge-success mr-1';
    } else if (this.value === 0 || this.value === false || this.value === 'false' || this.value === 'FALSE'  || this.value === 'offline') {
      this.label = 'Offline';
      this.labelClass = 'badge badge-gray mr-1';
    } else {
      this.label = 'Not set';
      this.labelClass = 'badge badge-default mr-1';
    }
   this.renderValue = this.value.toString().toUpperCase();
  }
}
