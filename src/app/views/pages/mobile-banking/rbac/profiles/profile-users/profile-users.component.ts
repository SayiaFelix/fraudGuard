import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'app-profile-users',
    templateUrl: './profile-users.component.html',
    styleUrls: ['./profile-users.component.scss']
})
export class ProfileUsersComponent implements OnInit {

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

    ngOnInit(): void {

        this.dataSet = this.tempData;
    }

    onCustomAction(event) {
        switch (event.action) {
            case 'removeUser':
                this.removeUser(event.data);
                break;
        }
    }

    removeUser(data: any): any {
        // console.log('Removed user.' + data);
    }
}
