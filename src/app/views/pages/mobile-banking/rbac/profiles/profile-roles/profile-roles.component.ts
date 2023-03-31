import {Component, Input, OnInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpService} from "../../../../../../shared/services/http.service";
import {GlobalService} from "../../../../../../shared/services/global.service";
import {FormGroup} from "@angular/forms";
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';

@Component({
    selector: 'app-profile-roles',
    templateUrl: './profile-roles.component.html',
    styleUrls: ['./profile-roles.component.scss']
})
export class ProfileRolesComponent implements OnInit {

  tempRolesData = [
    {
      id: 1,
      roleName: 'CREATE_BANK_ADMIN',
      status: true,
      createdOn: '12-02-2023',

    },
    {
      id: 2,
      roleName: 'EDIT_BANK_ADMIN',
      status: true,
      createdOn: '12-02-2023',
    },
    {
      id: 3,
      roleName: 'CREATE_SERVICE',
      status: true,
      createdOn: '12-02-2023',
    },
    {
      id: 4,
      roleName: 'RESET_ADMIN_PASSWORD',
      status: true,
      createdOn: '12-02-2023',
    }
  ];

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  selected: any = [];

  loadingIndicator = true;
  reorderable = true;

  columns = [
    { name: 'ROLE NAME', prop:'name' },
  ];

  public form: FormGroup;
  @Input() formData: { name: any; description: any; is_active: any; };

  ColumnMode = ColumnMode;
  SelectionType = SelectionType;

    pendingDataSet: any;
    approvedDataSet: any;

    tempDataPending = [
        {
            name: 'add_profile_to_user',
            roleType: 'System',
            description: 'add profile to user',
        },
        {
            name: 'get_user_profile',
            roleType: 'System',
            description: 'get user profile',
        },
        {
            name: 'remove_user_profile',
            roleType: 'Custom',
            description: 'remove user profile',
        },
        {
            name: 'approve_user_profile',
            roleType: 'Custom',
            description: 'remove user profile',
        },
        {
            name: 'get_user_profile',
            roleType: 'System',
            description: 'get user profile',
        },
        {
            name: 'remove_user_profile',
            roleType: 'Custom',
            description: 'remove user profile',
        },
        {
            name: 'approve_user_profile',
            roleType: 'Custom',
            description: 'remove user profile',
        },
        {
            name: 'get_user_profile',
            roleType: 'System',
            description: 'get user profile',
        },
        {
            name: 'remove_user_profile',
            roleType: 'Custom',
            description: 'remove user profile',
        },
        {
            name: 'approve_user_profile',
            roleType: 'Custom',
            description: 'remove user profile',
        },
        {
            name: 'remove_user_profile',
            roleType: 'Custom',
            description: 'remove user profile',
        },
        {
            name: 'approve_user_profile',
            roleType: 'Custom',
            description: 'remove user profile',
        }

    ];

    tempDataApproved = [
        {
            name: 'add_profile_to_user',
            roleType: 'System',
            description: 'add profile to user',
        },
        {
            name: 'get_user_profile',
            roleType: 'System',
            description: 'get user profile',
        },
    ];

    public loading = false;
    public rolesList: any = [];
    public allRolesList: any = [];

    public allAddedRolesListPending: any = [];
    public allRemovedRolesListPending: any = [];
    private profileId: any;

    public settings = {
        selectMode: 'single',  // single|multi
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
                    title: '&nbsp; &nbsp;&nbsp; &nbsp;<i class="fa fa-times fa-sm mr-2 text-danger"></i><span class="text-danger">Remove</span>  &nbsp; &nbsp;'
                },

            ],
            position: 'right'
        },

        noDataMessage: 'No data found',
        columns: {
            name: {
                title: 'Name',
                type: 'string',
                filter: false
            }
        },
        pager: {
            display: true,
            perPage: 30
        }
    };
    dataSet: any;
    tempData = [{
        name: 'Salim Abubakar'
    }];

    constructor(private sanitizer: DomSanitizer,
                private httpService: HttpService,
                public globalService: GlobalService,
                public activatedRoute: ActivatedRoute,
                public router: Router,
                ) {
    }

    ngOnInit(): void {

        this.dataSet = this.tempData;

        this.activatedRoute.params.subscribe(params => {
            if (typeof params.id !== 'undefined') {
                this.profileId = params.id;
            }
        });

        this.getAllRoles();
    }

    onCustomAction(event: any) {
        switch (event.action) {
            case 'removeUser':
                this.removeUser(event.data);
                break;
        }
    }

    removeUser(data: any): any {
        // console.log('Removed user.' + data);
    }

    public onCustomActionRemoveRole(event: any): void {
        switch (event.action) {
            case 'removeRole':
                this.removeRole(event.data);
                break;
        }
    }

    public onCustomActionAddRole(event: any): void {
        switch (event.action) {
            case 'addRole':
                this.addRole(event.data);
                break;
        }
    }

    public addRole(event: any) {
        // console.log('added role', event);
        this.allAddedRolesListPending.push(event);

        this.loading = true;
        this.pendingDataSet = this.pendingDataSet.filter((item: any) => item !== event);
        this.loading = false;
    }

    public removeRole(event: any) {
        // console.log('removed role', event);
        this.allRemovedRolesListPending.push(event);

        this.loading = true;
        this.approvedDataSet = this.approvedDataSet.filter((item: any) => item !== event);
        this.loading = false;
    }

    changeRolesForProfile() {
        // this.toastrService.
        this.assignRolesToProfile();
        this.removeRolesFromProfile();
    }

    resetRolesForProfile() {
        this.allRemovedRolesListPending = [];
        this.allAddedRolesListPending = [];

        this.getAllRoles();
    }

    private getAssignedRoles() {
        this.loading = true;

        const model = {
                profileId: this.profileId
        };

        this.httpService.mobileBankingPost('api/v1/bank/profile/id', model).subscribe((result: any) => {
                if (result.status === 200) {

                    this.rolesList = result.data.roles;

                    this.approvedDataSet = this.rolesList;

                    const uniqueRecords = this.allRolesList
                      .filter((entry1: any) => !this.rolesList
                      .some((entry2: any) => entry1.id === entry2.id));

                    // console.log('uniqueRecords');
                    // console.log(uniqueRecords);

                    this.pendingDataSet =
                        uniqueRecords;
                    // this.pendingDataSet;

                    this.loading = false;

                } else {
                }

            }, (error: any) => {
            }, (complete:any) => {
                this.loading = false;
            });
    }

    private getAllRoles() {
        this.loading = true;
        const model = {
            page: 0,
            size: 50
        };

        this.httpService.mobileBankingPost('api/v1/admin/role/all', model).subscribe((result: any) => {
                if (result.status === 200) {

                    this.allRolesList = result.data;

                  console.log("this.allRolesList");
                  console.log(this.allRolesList);

                    this.getAssignedRoles();

                } else {
                }


            }, (error: any) => {
            }, (complete: any) => {
                this.loading = false;
            });
    }


    private assignRolesToProfile() {
        const model = {
                profileId: parseInt(this.profileId, 10),
                profileName: '',
                roles: this.allAddedRolesListPending.map((item: any) => {
                    const obj = {
                        id: undefined,
                        name: undefined
                    };

                    obj.id = item.id;
                    obj.name = item.name;

                    return obj;
                })
        };

        this.httpService.mobileBankingPost('api/v1/bank/profile/role/add', model).subscribe((result: any) => {
                if (result.status === 200) {

                    // console.log('here is result.data');
                    // console.log(result.data);
                    this.router.navigate(['/rbac/all-profiles']);


                } else {
                }


            }, (error: any) => {
            }, (complete: any) => {
                this.loading = false;
            });
    }

    private removeRolesFromProfile() {
        const model = {
                profileId: parseInt(this.profileId, 10),
                profileName: '',
                roles: this.allRemovedRolesListPending.map((item: any) => {
                    const obj = {
                        id: undefined,
                        name: undefined
                    };

                    obj.id = item.id;
                    obj.name = item.name;

                    return obj;
                })
        };

        this.httpService.mobileBankingPost('api/v1/bank/profile/role/remove', model).subscribe((result: any) => {
                if (result.status === 200) {
                    // this.toastrService.success(`Successfully removed ${model.roles.length} roles`, 'Success!');
                    this.router.navigate(['/rbac/all-profiles']);
                } else {
                }


            }, (error: any) => {
            }, (complete: any) => {
                this.loading = false;
            });
    }

    returnRemovedRole(item: any) {
        // return removed role to all roles list

        // length before returning item


        this.loading = true;

        const remainingRecords = [...this.approvedDataSet];
        // console.log('remainingRecords');
        // console.log(remainingRecords);
        // console.log(remainingRecords.length);
        remainingRecords.unshift(item);
        // console.log(remainingRecords.length);

        this.approvedDataSet = [...remainingRecords];

        this.loading = false;

        // remove role from roles list to be sent to backend for removal
        this.allRemovedRolesListPending = this.allRemovedRolesListPending.filter((element: any) => element !== item);
    }

    returnAddedRole(item: any) {
        // return removed role to all roles list

        this.loading = true;

        const remainingRecords = [...this.pendingDataSet];

        remainingRecords.unshift(item);

        this.pendingDataSet = [...remainingRecords];

        this.loading = false;

        // remove role from roles list to be sent to backend for removal
        this.allAddedRolesListPending = this.allAddedRolesListPending.filter((element: any) => element !== item);
    }

  onAddRole(event: any ) {
    this.allAddedRolesListPending.push(event.selected.name);
    this.pendingDataSet = this.pendingDataSet.filter((item: any) => item !== event.selected.name);
  }

  onRemoveRole(event: any ) {
    console.log(event);
    this.allRemovedRolesListPending.push(event.selected);
    this.approvedDataSet = this.approvedDataSet.filter((item: any) => item !== event.selected);
  }

  remove() {
    this.selected = [];
  }

  displayCheck(row: any) {
    return row.name !== 'Ethel Price';
  }
}
