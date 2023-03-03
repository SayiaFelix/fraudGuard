import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { HttpService } from '../../../shared/http.service';


@Component({
  selector: 'app-approve-profile',
  templateUrl: './approve-profile.component.html',
  styleUrls: ['./approve-profile.component.scss']
})
export class ApproveProfileComponent implements OnInit {

  cardTitle: string;
  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<ApproveProfileComponent>,
    private _httpService: HttpService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.cardTitle = this.data.edit ? "Approve Role" : "Remove Role/s"
    this.form = this.fb.group({
      remarks: ['', Validators.compose([Validators.required])]
    })
  }

  //approves selected roles
  removeRoles(): void {
    let model = {
      profileId: this.data['profileId'],
      roleIds: this.data['data'],
      active: "true",
      remarks: this.form.value.remarks
    };
    // console.log("remove model: ", model);
    this._httpService.post('api/v1/workflow/remove-role-in-profile', model).subscribe(res => {
      if (res["status"] === 200) {
        this.data['data'].length == 1 ? this.toastr.success("Role removed", "Success!") : this.toastr.success("Roles Removed", "Success!");
        this.close(); 
      } else {
        this.data['data'].length == 1 ? this.toastr.error("Role not Removed", "Error!") : this.toastr.error("Roles not Removed", "Error!");
        this.close();
      }
    })
  }

  //closes approve dialog
  close(): void {
    setTimeout(() => {
      this.dialogRef.close();
    }, 1000);
  }

}
