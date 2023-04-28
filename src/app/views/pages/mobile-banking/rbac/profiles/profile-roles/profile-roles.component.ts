import { Component, Input, OnInit } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { ActivatedRoute, Router } from '@angular/router'
import { HttpService } from '../../../../../../shared/services/http.service'
import { GlobalService } from '../../../../../../shared/services/global.service'
import { FormGroup } from '@angular/forms'
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable'

@Component({
  selector: 'app-profile-roles',
  templateUrl: './profile-roles.component.html',
  styleUrls: ['./profile-roles.component.scss'],
})
export class ProfileRolesComponent implements OnInit {
  // bread crumb items
  breadCrumbItems: Array<{}>
  rows: any = []
  selectedAdd: any = []
  selectedRemove: any = []

  loadingIndicator = true
  reorderable = true

  columns = [{ name: 'ROLE NAME', prop: 'name' }]

  public form: FormGroup
  @Input() formData: { name: any; description: any; is_active: any }

  ColumnMode = ColumnMode
  SelectionType = SelectionType

  pendingDataSet: any
  approvedDataSet: any

  public loading = false
  public rolesList: any = []
  public allRolesList: any = []

  public allAddedRolesListPending: any = []
  public allRemovedRolesListPending: any = []
  private profileId: any

  public settings = {
    selectMode: 'single', // single|multi
    hideHeader: false,
    hideSubHeader: false,
    actions: {
      columnTitle: 'Actions',
      add: false,
      edit: false,
      delete: false,
      custom: [
        {
          name: 'removeUser',
          // tslint:disable-next-line:max-line-length
          title:
            '&nbsp; &nbsp;&nbsp; &nbsp;<i class="fa fa-times fa-sm mr-2 text-danger"></i><span class="text-danger">Remove</span>  &nbsp; &nbsp;',
        },
      ],
      position: 'right',
    },

    noDataMessage: 'No data found',
    columns: {
      name: {
        title: 'Name',
        type: 'string',
        filter: false,
      },
    },
    pager: {
      display: true,
      perPage: 30,
    },
  }

  constructor(
    private sanitizer: DomSanitizer,
    private httpService: HttpService,
    public globalService: GlobalService,
    public activatedRoute: ActivatedRoute,
    public router: Router,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (typeof params.id !== 'undefined') {
        this.profileId = params.id
      }
    })

    this.getAllRoles()
  }

  onCustomAction(event: any) {
    switch (event.action) {
      case 'removeUser':
        this.removeUser(event.data)
        break
    }
  }

  removeUser(data: any): any {
    // console.log('Removed user.' + data);
  }

  public onCustomActionRemoveRole(event: any): void {
    switch (event.action) {
      case 'removeRole':
        this.removeRole(event.data)
        break
    }
  }

  public onCustomActionAddRole(event: any): void {
    switch (event.action) {
      case 'addRole':
        this.addRole(event.data)
        break
    }
  }

  public addRole(event: any) {
    // console.log('added role', event);
    this.allAddedRolesListPending.push(event)

    this.loading = true
    this.pendingDataSet = this.pendingDataSet.filter(
      (item: any) => item !== event,
    )
    this.loading = false
  }

  public removeRole(event: any) {
    this.allRemovedRolesListPending.push(event)

    this.loading = true
    this.approvedDataSet = this.approvedDataSet.filter(
      (item: any) => item !== event,
    )
    this.loading = false
  }

  changeRolesForProfile(str: string) {
    // this.toastrService.
    if(str == 'add'){
      this.assignRolesToProfile()
      this.selectedAdd = []
      this.allAddedRolesListPending = []
    }

    if(str == 'remove'){
      this.removeRolesFromProfile()
      this.selectedRemove = []
      this.allRemovedRolesListPending = []
    }

    this.rolesList = []
    this.getAllRoles()
  }

  resetRolesForProfile() {
    this.allRemovedRolesListPending = []
    this.allAddedRolesListPending = []
    this.selectedAdd = []
    this.selectedRemove = []

    // this.getAllRoles()
  }

  private getAssignedRoles() {
    const model = {
      id: this.profileId,
    }

    this.httpService
      .mobileBankingPost('api/v1/admin/profile/get', model)
      .subscribe(
        (result: any) => {
          if (result.status === 200) {
            this.rolesList = result.data.roles

            console.log(this.rolesList, 'sakdaskj');
            

            this.approvedDataSet = this.rolesList

            const uniqueRecords = this.allRolesList.filter(
              (entry1: any) =>
                !this.rolesList.some(
                  (entry2: any) => entry1.id === entry2.roleId,
                ),
            )

            this.pendingDataSet = uniqueRecords
            // this.pendingDataSet;

            this.loading = false
          } else {
          }
        },
        (error: any) => {},
        (complete: any) => {
          this.loading = false
        },
      )
  }

  private getAllRoles() {
    this.loading = true
    const model = {
      page: 0,
      size: 50,
    }

    this.httpService
      .mobileBankingPost('api/v1/admin/role/all', model)
      .subscribe(
        (result: any) => {
          if (result.status === 200) {
            this.allRolesList = result.data
            this.getAssignedRoles()
            this.loading = false
          } else {
            this.allRolesList = []
          }
        },
        (error: any) => {},
        (complete: any) => {
          this.loading = false
        },
      )
  }

  private assignRolesToProfile() {
    const model = {
      profileId: parseInt(this.profileId, 10),
      roleList: this.allAddedRolesListPending.map((item: any) => {
        return item.id
      }),
    }

    this.rolesList.forEach((role: any) => {
      model.roleList.push(role.roleId)
    })

    this.httpService
      .mobileBankingPost('api/v1/admin/profile/add/roles', model)
      .subscribe(
        (result: any) => {
          console.log(result)

          if (result.status === 200) {
            // console.log('here is result.data');
            // console.log(result.data);
            // this.router.navigate(['/rbac/all-profiles'])
          } else {
          }
        },
        (error: any) => {},
        (complete: any) => {
          this.loading = false
        },
      )
  }

  private removeRolesFromProfile() {
    const model = {
      profileId: parseInt(this.profileId, 10),
      roleList: [],
    }

    let removedArr = this.allRemovedRolesListPending.map((item: any) => item)

    // removedArr.forEach((role: any) => {
    //   let idx = this.rolesList.indexOf(role)
    //   this.rolesList.splice(idx, 1)
    // })

    model.roleList = removedArr.map((role: any) => role.roleId)
    console.log(model);
    
    this.httpService
      .mobileBankingPost('api/v1/admin/profile/remove/roles', model)
      .subscribe(
        (result: any) => {
          console.log(result)

          if (result.status === 200) {
            // this.toastrService.success(`Successfully removed ${model.roles.length} roles`, 'Success!');
            // this.router.navigate(['/rbac/all-profiles'])
          } else {
          }
        },
        (error: any) => {},
        (complete: any) => {
          this.loading = false
        },
      )
  }

  returnRemovedRole(item: any) {
    this.loading = true

    this.allRemovedRolesListPending = this.allRemovedRolesListPending.filter(
      (role: any) => role.roleId !== item.roleId,
    )
    this.selectedRemove = this.selectedRemove.filter(
      (role: any) => role.roleId !== item.roleId,
    )

    this.loading = false
  }

  returnAddedRole(item: any) {
    this.loading = true

    this.allAddedRolesListPending = this.allAddedRolesListPending.filter(
      (role: any) => role.roleId !== item.roleId,
    )
    this.selectedAdd = this.selectedAdd.filter(
      (role: any) => role.roleId !== item.roleId,
    )

    this.loading = false
  }

  onAddRole(event: any) {
    console.log(event.selected[0])
    let items = event.selected.map((item: any) => item)
    this.allAddedRolesListPending = items
    console.log(this.allAddedRolesListPending)

    // this.allAddedRolesListPending.push(event.selected.name);
    // this.allAddedRolesListPending.forEach((roleItem:any) => {
    //     this.pendingDataSet = this.pendingDataSet.filter((item: any) => item.name !== roleItem.name);
    // });
    // this.pendingDataSet = this.pendingDataSet.filter((item: any) => item !== event.selected.name);
  }

  onRemoveRole(event: any) {
    let items = event.selected.map((item: any) => item)

    this.allRemovedRolesListPending = items
  }

  remove() {
    this.selectedAdd = []
    this.selectedRemove = []
  }

  displayCheck(row: any) {
    return row.name !== 'Ethel Price'
  }
}
