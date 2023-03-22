import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-notification-modal',
    templateUrl: './notification-modal.component.html',
    styleUrls: ['./notification-modal.component.scss']
})
export class NotificationModalComponent implements OnInit {

    @Input() title: any;
    @Input() body: any;

    username: any;

    public errorMessages: any;
    public activeModal: any;

    previousData= "{}";
    currentData=  "{" +
      "'name': 'Samuel Karanja'," +
      "}";
    ActionForm="Select Action" +
      "";
    constructor(
        activeModal: NgbActiveModal,
    ) {
        this.activeModal = activeModal;
    }

    ngOnInit() {
    }

    close() {
        this.activeModal.close();
    }

    submitData() {
        this.activeModal.close('success');
    }
}
