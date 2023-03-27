import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-label-system-custom-role',
  templateUrl: './label-system-custom-role.component.html',
  styleUrls: ['./label-system-custom-role.component.scss']
})
export class LabelSystemCustomRoleComponent implements OnInit {
  label: any;
  labelClass: string;
  renderValue: string;
  @Input() value: any;
  @Input() rowData: any;

  constructor() { }
  ngOnInit(): void {
    if ( this.value === 1 || this.value === true || this.value === 'true' || this.value === 'TRUE') {
      this.label = 'System Role';
      this.labelClass = 'badge bg-primary mr-1';
    } else if (this.value === 0 || this.value === false || this.value === 'false' || this.value === 'FALSE') {
      this.label = 'Custom Role';
      this.labelClass = 'badge bg-success mr-1';
    }

    this.renderValue = this.value?.toString();
  }
}

