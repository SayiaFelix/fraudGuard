import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-compare-image',
    templateUrl: './compare-image.component.html',
    styleUrls: ['./compare-image.component.scss']
})
export class CompareImageComponent implements OnInit {

    @Input() title: any;
    @Input() body: any;

    username: any;

    public errorMessages: any;
    public activeModal: any;

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
