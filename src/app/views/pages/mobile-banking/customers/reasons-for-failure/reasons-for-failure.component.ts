import {Component, OnInit} from '@angular/core';
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import Swal from "sweetalert2";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {CompareImageComponent} from "../../../../../shared/components/compare-image-component/compare-image.component";
import {ActivatedRoute} from "@angular/router";
import {HttpService} from "../../../../../shared/services/http.service";

@Component({
  selector: 'app-reasons-for-failure',
  templateUrl: './reasons-for-failure.component.html',
  styleUrls: ['./reasons-for-failure.component.scss'],
})

export class ReasonsForFailureComponent implements OnInit {

  public modalRef: NgbModalRef;
  public customerId: any;
  public accountData: any;

  constructor(
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute,
    private httpService: HttpService,
  ) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: any) => {
      if (typeof params.id !== 'undefined') {
        this.customerId = params.id;
      }
    });

    this.getIndividualData();
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

  private getIndividualData() {

    const model = {
      id: this.customerId
    };

    this.httpService
      .mobileBankingPostNest('accounts/getAccountById', model)
      .subscribe((res: any) => {
        if (res.status === 201) {
          setTimeout(() => {
            this.accountData = res.data;

            console.log('this.accountData')
            console.log(this.accountData)

            let total = res.totalItems;
          }, 10);
        } else {
        }
      });

  }
}
