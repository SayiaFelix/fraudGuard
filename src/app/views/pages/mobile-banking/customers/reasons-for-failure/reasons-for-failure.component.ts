import {Component, OnInit} from '@angular/core';
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {CompareImageComponent} from "../../../../../shared/components/compare-image-component/compare-image.component";

@Component({
  selector: 'app-reasons-for-failure',
  templateUrl: './reasons-for-failure.component.html',
  styleUrls: ['./reasons-for-failure.component.scss'],
})

export class ReasonsForFailureComponent implements OnInit {

  public modalRef: NgbModalRef;

  constructor(
    private modalService: NgbModal,
  ) {
  }

  ngOnInit() {

  }


  approveRecord() {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = `Approve Record?`;
    this.modalRef.componentInstance.body = `Do you want to approve this record?`;

  }

  deleteRecord() {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = `Delete Record?`;
    this.modalRef.componentInstance.body = `Do you want to delete this record?`;

  }

  openImage() {
    this.modalRef = this.modalService.open(CompareImageComponent, {centered: true});
    this.modalRef.componentInstance.title = `Image Comparison`;
    this.modalRef.componentInstance.body = `Do you want to approve this record?`;
  }
}
