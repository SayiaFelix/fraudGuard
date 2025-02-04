import { Component, Input, OnInit, TemplateRef, ViewChild , ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {NgbActiveModal, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent } from '@swimlane/ngx-datatable';
import { GlobalService } from 'src/app/shared/services/global.service';
import { HttpService } from 'src/app/shared/services/http.service';
import {AddBranchComponent} from "../add-branch/add-branch.component";
import { HttpResponseBase } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ConfirmDialogComponent } from 'src/app/shared/components/confirm-dialog/confirm-dialog.component';


@Component({
  selector: 'app-list-branches',
  templateUrl: './list-branches.component.html',
  styleUrls: ['./list-branches.component.scss']
})
export class ListBranchesComponent implements OnInit {

  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  filteredRows: any = [];
  loadingIndicator = true;
  reorderable = true;

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'Branch Name', prop:'name' },
    { name: 'Branch Code', prop:'code' },
    { name: 'Created On', prop:'createdOn' },
    { name: 'Updated On', prop:'updatedOn' },
    { name: 'Actions', prop: 'id' }
  ];

  allColumns = [...this.columns]

  public form: FormGroup;
  @Input() formData: { name: any; branchCode: any; is_active: any; };

  ColumnMode = ColumnMode;
  public imageFile: File;
  @ViewChild('table') table: DatatableComponent;

  public modalRef: NgbModalRef;

  title: string = "Branches";

  actions = ["Edit","Delete"];

  loading: boolean;

  totalRecords: number;

  dashboards: { id: string; src: string }[] = [
    {
      id: 'dashboard1',
      src: 'https://dub01.online.tableau.com/#/site/peternjosh7365-adf6ffe291/views/Book1/Sheet20',
    },
    // {
    //   id: 'dashboard2',
    //   src: 'https://dub01.online.tableau.com/t/sayiafelix18-8910cf7f09/views/Book1/Sheet17',
    // },
  ];

  paginatedDashboards: { id: string; src: string }[] = [];
  currentPage = 0;
  itemsPerPage = 4;


  // Array to hold chat messages
  messages: { sender: string; text: string }[] = [];

  // Variable to hold user input
  userInput: string = '';
  isChatVisible: boolean = false; 

  constructor(private httpService: HttpService,
              private modalService: NgbModal,
              private cdr: ChangeDetectorRef,
              public fb: FormBuilder,
              public router: Router,
              public globalService: GlobalService) {
  }

  ngOnInit() {
    this.updatePagination()
    this.breadCrumbItems = [{ label: 'Mobile banking', path: '/mobile-banking/branches/all-branches' },
      { label: 'Pages', path: '/' }, { label: 'Branches', active: true }];
    this.getIndividualData(0);

    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      code: [this.formData ? this.formData.branchCode : '', [Validators.required]],
      is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
    });
  }

  updatePagination() {
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedDashboards = this.dashboards.slice(startIndex, endIndex);
  }
  
  nextPage() {
    if ((this.currentPage + 1) * this.itemsPerPage < this.dashboards.length) {
      this.currentPage++;
      this.updatePagination();
    }
  }
  
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePagination();
    }}
    
  public addBranch() {
    this.modalRef = this.modalService.open(AddBranchComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.title = 'Add Branch';
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      }
    }, (reason) => {
    });
  }

  public editBranch(formData: any) {
    this.modalRef = this.modalService.open(AddBranchComponent, {centered: true, size: "xl"});
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.componentInstance.title = `Edit Branch (${formData.name})`;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
        this.getIndividualData(0);
      }
    }, (reason) => {
    });
  }

  deleteBranch(formData: any) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    this.modalRef.componentInstance.title = `Delete this Branch?`;
    this.modalRef.componentInstance.body = `Do you want to delete branch?`;
    // this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {
      const model = {
          id: formData.id
        }
        this.httpService.mobileBankingPost('config/branch/delete',model).subscribe(
          (result: any) => {
            if (result.status === 200) {
              Swal.fire('Branch Deleted',
                'Branch has been deleted successfully.',
                'success').then(r => console.log(r))
                this.getIndividualData(0);
            } else {
              Swal.fire('Record deletion error',
                'Branch could not be deleted.',
                'error').then(r => console.log(r))
            }
          },
          (error: any) => {
            Swal.fire('Record deletion error',
              `Record deletion error`,
              'error')
          }
        );
      }
    });
  }

  getIndividualData(event: number): void {

    this.loading = true;

    // this.rows = this.tempProductData;
    const model = {
      page:0,
      size:50
    };

    this.httpService.mobileBankingPost('config/branch/fetch/region/page', model).subscribe((res: any) => {
      if (res.status===200){
        this.loading = false;

        this.totalRecords = res.totalItems;
        // this.activeModal.close('success');
      //  Swal.fire('success','records fetched successfully','success')
      //  .then(r=>console.log(r))
        let response = res.data.map((item: any, index: any) => {
          const res = {...item,
            frontendId: index + 1,
          };
          return res;
        });

        this.rows = response;
        console.log(this.rows);

      }
      else{
        Swal.fire('failed','unable to fetch records','error')
      }
    });
  }

  onFileChange(event: any) {
    if (event.target.files && event.target.files.length) {
      this.imageFile = event.target.files[0];
    }
  }

  toggleExpandRow(row:any){
    this.table.rowDetail.toggleExpandRow(row);
  }

  onDetailToggle(event:any){
    console.log('Detail Toggled', event);
  }

  updateColumns(updatedColumns: any) {
    this.columns = [...updatedColumns];
  }

  triggerEvent(data: string) {

    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
    }else if (eventData.action == 'Edit') {
      this.editBranch(eventData.row);
    }
    else if (eventData.action == 'Delete') {
      this.deleteBranch(eventData.row);
    }

  }

  updateFilteredRowsEvent(data: string) {
    console.log(data);

    this.filteredRows = data
  }


  toggleChat() {
    this.isChatVisible = !this.isChatVisible;
    console.log('Chat visibility:', this.isChatVisible);
    this.cdr.detectChanges(); // Ensure the DOM updates
  }
   



  sendMessage(): void {
    if (this.userInput.trim() === '') {
      return; // Do not send empty messages
    }

    this.messages.push({ sender: 'user', text: this.userInput });
    const userMessage = this.userInput;
    this.userInput = '';

    // Call the Flask backend to get the bot's response
    this.globalService.sendMessageToBot(userMessage).subscribe(response => {
      this.messages.push({ sender: 'bot', text: response.reply });
    });
  }

  closeChat() {
    this.messages = [];
    this.userInput = '';
  }
}
