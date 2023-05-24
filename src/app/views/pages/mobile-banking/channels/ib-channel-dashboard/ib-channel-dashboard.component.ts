import {Component, OnInit, ViewChild,} from '@angular/core';
import {NgbCalendar, NgbDateStruct, NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {DatePipe} from '@angular/common';
import {DatatableComponent} from "@swimlane/ngx-datatable/lib/components/datatable.component";
import {AddCustomerComponent} from "../add-customer/add-customer.component";
import {FormBuilder} from "@angular/forms";
import {Router} from "@angular/router";
import {DataExportationService} from "../../../../../shared/services/data-exportation.service";
import {ChannelDetailsWrapper} from "../../../../../shared/services/channelDetailsWrapper";
import Swal from "sweetalert2";
import {HttpService} from "../../../../../shared/services/http.service";
import {ConfirmDialogComponent} from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";

declare const google: any;

@Component({
  selector: 'app-ussd-channel-dashboard',
  templateUrl: './ib-channel-dashboard.component.html',
  styleUrls: ['./ib-channel-dashboard.component.scss'],
  providers: [DatePipe],
})

/**
 * Starter-component
 */
export class IbChannelDashboardComponent implements OnInit {
  /**
   * Apex chart
   */
  public customersChartOptions: any = {};
  public ordersChartOptions: any = {};
  public growthChartOptions: any = {};
  public revenueChartOptions: any = {};
  public monthlySalesChartOptions: any = {};
  public cloudStorageChartOptions: any = {};

  // colors and font variables for apex chart
  obj = {
    primary        : "#6571ff",
    secondary      : "#7987a1",
    success        : "#05a34a",
    info           : "#66d1d1",
    warning        : "#F69414",
    danger         : "#ff3366",
    light          : "#e9ecef",
    dark           : "#060c17",
    muted          : "#7987a1",
    gridBorder     : "rgba(77, 138, 240, .15)",
    bodyColor      : "#000",
    cardBg         : "#fff",
    fontFamily     : "'Roboto', Helvetica, sans-serif"
  }

  /**
   * NgbDatepicker
   */
  currentDate: NgbDateStruct;
  public modalRef: NgbModalRef;

  // Map variables
  @ViewChild("updatedMap", {static: true})
  updatedMap: any;
  pointList: { lat: number; lng: number }[] = [];
  drawingManager: any;
  selectedShape: any;
  selectedArea = 0;
  lat: number;
  lng: number;
  // Map variables
  constructor(private calendar: NgbCalendar,
              private modalService: NgbModal,
              public fb: FormBuilder,
              public router: Router,
              public httpService: HttpService,
              private dataExploration: DataExportationService) {}

  ngOnInit(): void {

    this.getIndividualData(0);

    this.getChannelsToKnowStatus();

    this.lat = this.pointList[0] ? this.pointList[0].lat : 0.51796165;
    this.lng = this.pointList[0] ? this.pointList[0].lng : 36.48531687;

    this.currentDate = this.calendar.getToday();

    this.customersChartOptions = getCustomerseChartOptions(this.obj);
    this.ordersChartOptions = getOrdersChartOptions(this.obj);
    this.growthChartOptions = getGrowthChartOptions(this.obj);
    this.revenueChartOptions = getRevenueChartOptions(this.obj);
    this.monthlySalesChartOptions = getMonthlySalesChartOptions(this.obj);
    this.cloudStorageChartOptions = getCloudStorageChartOptions(this.obj);

    // Some RTL fixes. (feel free to remove if you are using LTR))
    if (document.querySelector('html')?.getAttribute('dir') === 'rtl') {
      this.addRtlOptions();
    }

  }


  /**
   * Only for RTL (feel free to remove if you are using LTR)
   */
  addRtlOptions() {
    // Revenue chart
    this.revenueChartOptions.yaxis.labels.offsetX = -25;
    this.revenueChartOptions.yaxis.title.offsetX = -75;

    //  Monthly sales chart
    this.monthlySalesChartOptions.yaxis.labels.offsetX = -10;
    this.monthlySalesChartOptions.yaxis.title.offsetX = -70;
  }


  onMapReady(map: any) {

    this.initDrawingManager(map);
  }

  initDrawingManager = (map: any) => {
    const self = this;
    const options = {
      drawingControl: true,
      drawingControlOptions: {
        drawingModes: ["polygon"],
      },
      polygonOptions: {
        draggable: true,
        editable: true,
      },
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
    };
    this.drawingManager = new google.maps.drawing.DrawingManager(options);
    this.drawingManager.setMap(map);
    google.maps.event.addListener(
      this.drawingManager,
      "overlaycomplete",
      (event: { type: any; overlay: { getPaths: () => any; drag: any; getPath: () => any; }; }) => {
        if (event.type === google.maps.drawing.OverlayType.POLYGON) {
          const paths = event.overlay.getPaths();
          for (let p = 0; p < paths.getLength(); p++) {
            google.maps.event.addListener(
              paths.getAt(p),
              "set_at",
              () => {
                if (!event.overlay.drag) {
                  self.updatePointList(event.overlay.getPath());
                }
              }
            );
            google.maps.event.addListener(
              paths.getAt(p),
              "insert_at",
              () => {
                self.updatePointList(event.overlay.getPath());
              }
            );
            google.maps.event.addListener(
              paths.getAt(p),
              "remove_at",
              () => {
                self.updatePointList(event.overlay.getPath());
              }
            );
          }
          self.updatePointList(event.overlay.getPath());


          this.selectedShape = event.overlay;
          this.selectedShape.type = event.type;
        }
        if (event.type !== google.maps.drawing.OverlayType.MARKER) {
          // Switch back to non-drawing mode after drawing a shape.

          self.drawingManager.setDrawingMode(null);
          // To hide:
          self.drawingManager.setOptions({
            drawingControl: false,
          });
        }
      }
    );
  }

  // Table Details
  @ViewChild('table') table: DatatableComponent;
  actions = ["View"];
  tempProductData = [
    {
      frontendId: 1,
      customerName: 'Andrew Kamau',
      phoneNumber:'0708453901',
      idNumber: '31397137',
      InternetBankingID:'IBank4567',
      primaryIP:'192.16.0.73',
      accountNumber:'0116987349900',
      email:'michaelmbugua004@gmail.com',
      createdOn: '12-02-2023',
    },
    {
      frontendId: 2,
      customerName: 'Jane Mwangi',
      phoneNumber:'0728357775',
      idNumber: '37059671',
      InternetBankingID:'IBank1234',
      primaryIP:'00:00:5e:00:53:af',
      email:'lilian002@gmail.com',
      createdOn: '12-02-2023',
    },

  ];

  channelEnabled = true;
  channels: any;
  channel: any;


  // bread crumb items
  breadCrumbItems: Array<{}>;
  rows: any = [];
  temp: any = [];
  loading = true;
  reorderable = true;

  columns = [
    { name: 'ID', prop: 'id' },
    { name: 'Customer Name', prop: 'customerName' },
    {name:'Primary Phone No.',prop:'phoneNumber'},
    { name: 'ID Number', prop: 'idNumber' },
    { name: 'IB ID', prop: 'InternetBankingID' },
    {name:'Primary IP/Mac Address',prop:'primaryIP'},
    // {name: 'CBSCustomerNumber',prop:'cbsCustomerNumber'},
    // {name: 'AccountNumber',prop:'accountNumber'},
    // {name: 'Email',prop:'email'},
    { name: 'Created On', prop: 'createdOn' },
    // {name: 'DOB',prop:'dob'},
    // {name: 'Gender',prop:'gender'},
    { name: 'Actions', prop: 'id' },
  ];

  allColumns = [...this.columns];

  triggerEvent(data:string){
    let eventData = JSON.parse(data)

    if (eventData.action == 'View') {
      this.navigateToViewUssdCustomer(eventData.row);
    }else if (eventData.action == 'Edit') {
      this.openEditProductModal(eventData.row);
    }
  }

  // Table Details


  updatePointList(path: { getLength: () => any; getAt: (arg0: number) => { (): any; new(): any; toJSON: { (): { lat: number; lng: number; }; new(): any; }; }; }) {

    this.pointList = [];
    const len = path.getLength();
    for (let i = 0; i < len; i++) {
      this.pointList.push(
        path.getAt(i).toJSON()
      );
    }
    this.selectedArea = google.maps.geometry.spherical.computeArea(
      path
    );
  }


  navigateToViewUssdCustomer(data: any) {
    this.router.navigateByUrl(`/mobile-banking/channels/InternetBanking/${data.id}`);
  }
  openEditProductModal(formData: any) {
    this.modalRef = this.modalService.open(AddCustomerComponent, {centered: true});
    this.modalRef.componentInstance.title = 'Edit Product';
    this.modalRef.componentInstance.formData = formData;
    this.modalRef.result.then((result) => {
      if (result === 'success') {
      } else {
        console.log("Error occurred")
      }
    });
  }

  getIndividualData(event: number): void {

    this.loading = false;
    this.rows = this.tempProductData;

    this.temp = [...this.tempProductData];

  }

  private getChannelsToKnowStatus() {
    let model = ChannelDetailsWrapper.channelDetailsWrapper;

    model.payload = {
      page: 0,
      size: 10
    }

    this.httpService.mobileBankingPostUpdated('api/v1/kyc/portal/get-channels',
      model).subscribe(
      (result: any) => {
        if (result.status === '00') {
          console.log("result.data");
          console.log(result.data);

          this.channels = result.data;

          this.channel = this.channels.filter((item: any) => item.channel === 'USSD');

          this.channelEnabled = this.channel[0].active;

        } else {
          Swal.fire('Error',
            'Product could not be activated/ deactivated.',
            'error').then(r => console.log(r))
        }
      },
      (error: any) => {
        Swal.fire('Record deletion error',
          `Record creation error`,
          'error')
      }
    );
  }

  openDisableModal(channelName: string, status: boolean) {
    this.modalRef = this.modalService.open(ConfirmDialogComponent, {centered: true});
    if (status){
      this.modalRef.componentInstance.title = `Enable this channel?`;
      this.modalRef.componentInstance.body = `Do you want to enable: ${channelName}?`;
    } else {
      this.modalRef.componentInstance.title = `Disable this channel?`;
      this.modalRef.componentInstance.body = `Do you want to disable: ${channelName}?`;
    }
    this.modalRef.result.then((result: any) => {
      if (result === 'success') {

        this.loading = true;

        let model = ChannelDetailsWrapper.channelDetailsWrapper;

        model.payload = {
          action: status,
          channelId: this.channel[0].id
        }

        this.httpService.mobileBankingPostUpdated('api/v1/kyc/portal/activate-deactivate',
          model).subscribe(
          (result: any) => {
            if (result.status === '00') {
              Swal.fire(`Channel ${status ? 'Activated': 'Deactivated'} Successfully`,
                `Channel has been ${status ? 'Activated': 'Deactivated'} Successfully.`,
                'success').then(r => console.log(r))
              this.getIndividualData(0);
            } else {
              Swal.fire('Error',
                'Product could not be activated/ deactivated.',
                'error').then(r => console.log(r))
            }
          },
          (error: any) => {
            Swal.fire('Record deletion error',
              `Record creation error`,
              'error')
          }
        );
      }
    });
  }
}


/**
 * Customerse chart options
 */
function getCustomerseChartOptions(obj: any) {
  return {
    series: [{
      name: '',
      data: [3844, 3855, 3841, 3867, 3822, 3843, 3821, 3841, 3856, 3827, 3843]
    }],
    chart: {
      type: "line",
      height: 60,
      sparkline: {
        enabled: !0
      }
    },
    colors: [obj.primary],
    xaxis: {
      type: 'datetime',
      categories: ["Jan 01 2022", "Jan 02 2022", "Jan 03 2022", "Jan 04 2022", "Jan 05 2022", "Jan 06 2022", "Jan 07 2022", "Jan 08 2022", "Jan 09 2022", "Jan 10 2022", "Jan 11 2022",],
    },
    stroke: {
      width: 2,
      curve: "smooth"
    },
    markers: {
      size: 0
    },
  }
};



/**
 * Orders chart options
 */
function getOrdersChartOptions(obj: any) {
  return {
    series: [{
      name: '',
      data: [36, 77, 52, 90, 74, 35, 55, 23, 47, 10, 63]
    }],
    chart: {
      type: "bar",
      height: 60,
      sparkline: {
        enabled: !0
      }
    },
    colors: [obj.primary],
    plotOptions: {
      bar: {
        borderRadius: 2,
        columnWidth: "60%"
      }
    },
    xaxis: {
      type: 'datetime',
      categories: ["Jan 01 2022", "Jan 02 2022", "Jan 03 2022", "Jan 04 2022", "Jan 05 2022", "Jan 06 2022", "Jan 07 2022", "Jan 08 2022", "Jan 09 2022", "Jan 10 2022", "Jan 11 2022",],
    }
  }
};



/**
 * Growth chart options
 */
function getGrowthChartOptions(obj: any) {
  return {
    series: [{
      name: '',
      data: [41, 45, 44, 46, 52, 54, 43, 74, 82, 82, 89]
    }],
    chart: {
      type: "line",
      height: 60,
      sparkline: {
        enabled: !0
      }
    },
    colors: [obj.primary],
    xaxis: {
      type: 'datetime',
      categories: ["Jan 01 2022", "Jan 02 2022", "Jan 03 2022", "Jan 04 2022", "Jan 05 2022", "Jan 06 2022", "Jan 07 2022", "Jan 08 2022", "Jan 09 2022", "Jan 10 2022", "Jan 11 2022",],
    },
    stroke: {
      width: 2,
      curve: "smooth"
    },
    markers: {
      size: 0
    },
  }
};



/**
 * Revenue chart options
 */
function getRevenueChartOptions(obj: any) {
  return {
    series: [{
      name: "Revenue",
      data: [
        49.3,
        48.7,
        50.6,
        53.3,
        54.7,
        53.8,
        54.6,
        56.7,
        56.9,
        56.1,
        56.5,
        60.3,
        58.7,
        61.4,
        61.1,
        58.5,
        54.7,
        52.0,
        51.0,
        47.4,
        48.5,
        48.9,
        53.5,
        50.2,
        46.2,
        48.6,
        51.7,
        51.3,
        50.2,
        54.6,
        52.4,
        53.0,
        57.0,
        52.9,
        48.7,
        52.6,
        53.5,
        58.5,
        55.1,
        58.0,
        61.3,
        57.7,
        60.2,
        61.0,
        57.7,
        56.8,
        58.9,
        62.4,
        58.7,
        58.4,
        56.7,
        52.7,
        52.3,
        50.5,
        55.4,
        50.4,
        52.4,
        48.7,
        47.4,
        43.3,
        38.9,
        34.7,
        31.0,
        32.6,
        36.8,
        35.8,
        32.7,
        33.2,
        30.8,
        28.6,
        28.4,
        27.7,
        27.7,
        25.9,
        24.3,
        21.9,
        22.0,
        23.5,
        27.3,
        30.2,
        27.2,
        29.9,
        25.1,
        23.0,
        23.7,
        23.4,
        27.9,
        23.2,
        23.9,
        19.2,
        15.1,
        15.0,
        11.0,
        9.20,
        7.47,
        11.6,
        15.7,
        13.9,
        12.5,
        13.5,
        15.0,
        13.9,
        13.2,
        18.1,
        20.6,
        21.0,
        25.3,
        25.3,
        20.9,
        18.7,
        15.3,
        14.5,
        17.9,
        15.9,
        16.3,
        14.1,
        12.1,
        14.8,
        17.2,
        17.7,
        14.0,
        18.6,
        18.4,
        22.6,
        25.0,
        28.1,
        28.0,
        24.1,
        24.2,
        28.2,
        26.2,
        29.3,
        26.0,
        23.9,
        28.8,
        25.1,
        21.7,
        23.0,
        20.7,
        29.7,
        30.2,
        32.5,
        31.4,
        33.6,
        30.0,
        34.2,
        36.9,
        35.5,
        34.7,
        36.9
      ]
    }],
    chart: {
      type: "line",
      height: '400',
      parentHeightOffset: 0,
      foreColor: obj.bodyColor,
      background: obj.cardBg,
      toolbar: {
        show: false
      },
    },
    colors: [obj.primary, obj.danger, obj.warning],
    grid: {
      padding: {
        bottom: -4,
      },
      borderColor: obj.gridBorder,
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      type: "datetime",
      categories: [
        "Jan 01 2022", "Jan 02 2022", "jan 03 2022", "Jan 04 2022", "Jan 05 2022", "Jan 06 2022", "Jan 07 2022", "Jan 08 2022", "Jan 09 2022", "Jan 10 2022", "Jan 11 2022", "Jan 12 2022", "Jan 13 2022", "Jan 14 2022", "Jan 15 2022", "Jan 16 2022", "Jan 17 2022", "Jan 18 2022", "Jan 19 2022", "Jan 20 2022","Jan 21 2022", "Jan 22 2022", "Jan 23 2022", "Jan 24 2022", "Jan 25 2022", "Jan 26 2022", "Jan 27 2022", "Jan 28 2022", "Jan 29 2022", "Jan 30 2022", "Jan 31 2022",
        "Feb 01 2022", "Feb 02 2022", "Feb 03 2022", "Feb 04 2022", "Feb 05 2022", "Feb 06 2022", "Feb 07 2022", "Feb 08 2022", "Feb 09 2022", "Feb 10 2022", "Feb 11 2022", "Feb 12 2022", "Feb 13 2022", "Feb 14 2022", "Feb 15 2022", "Feb 16 2022", "Feb 17 2022", "Feb 18 2022", "Feb 19 2022", "Feb 20 2022","Feb 21 2022", "Feb 22 2022", "Feb 23 2022", "Feb 24 2022", "Feb 25 2022", "Feb 26 2022", "Feb 27 2022", "Feb 28 2022",
        "Mar 01 2022", "Mar 02 2022", "Mar 03 2022", "Mar 04 2022", "Mar 05 2022", "Mar 06 2022", "Mar 07 2022", "Mar 08 2022", "Mar 09 2022", "Mar 10 2022", "Mar 11 2022", "Mar 12 2022", "Mar 13 2022", "Mar 14 2022", "Mar 15 2022", "Mar 16 2022", "Mar 17 2022", "Mar 18 2022", "Mar 19 2022", "Mar 20 2022","Mar 21 2022", "Mar 22 2022", "Mar 23 2022", "Mar 24 2022", "Mar 25 2022", "Mar 26 2022", "Mar 27 2022", "Mar 28 2022", "Mar 29 2022", "Mar 30 2022", "Mar 31 2022",
        "Apr 01 2022", "Apr 02 2022", "Apr 03 2022", "Apr 04 2022", "Apr 05 2022", "Apr 06 2022", "Apr 07 2022", "Apr 08 2022", "Apr 09 2022", "Apr 10 2022", "Apr 11 2022", "Apr 12 2022", "Apr 13 2022", "Apr 14 2022", "Apr 15 2022", "Apr 16 2022", "Apr 17 2022", "Apr 18 2022", "Apr 19 2022", "Apr 20 2022","Apr 21 2022", "Apr 22 2022", "Apr 23 2022", "Apr 24 2022", "Apr 25 2022", "Apr 26 2022", "Apr 27 2022", "Apr 28 2022", "Apr 29 2022", "Apr 30 2022",
        "May 01 2022", "May 02 2022", "May 03 2022", "May 04 2022", "May 05 2022", "May 06 2022", "May 07 2022", "May 08 2022", "May 09 2022", "May 10 2022", "May 11 2022", "May 12 2022", "May 13 2022", "May 14 2022", "May 15 2022", "May 16 2022", "May 17 2022", "May 18 2022", "May 19 2022", "May 20 2022","May 21 2022", "May 22 2022", "May 23 2022", "May 24 2022", "May 25 2022", "May 26 2022", "May 27 2022", "May 28 2022", "May 29 2022", "May 30 2022",
      ],
      lines: {
        show: true
      },
      axisBorder: {
        color: obj.gridBorder,
      },
      axisTicks: {
        color: obj.gridBorder,
      },
      crosshairs: {
        stroke: {
          color: obj.secondary,
        },
      },
    },
    yaxis: {
      title: {
        text: 'Revenue ( $1000 x )',
        style:{
          size: 9,
          color: obj.muted
        }
      },
      tickAmount: 4,
      tooltip: {
        enabled: true
      },
      crosshairs: {
        stroke: {
          color: obj.secondary,
        },
      },
      labels: {
        offsetX: 0,
      },
    },
    markers: {
      size: 0,
    },
    stroke: {
      width: 2,
      curve: "straight",
    },
  }
};



/**
 * Monthly sales chart options
 */
function getMonthlySalesChartOptions(obj: any) {
  return {
    series: [{
      name: 'Sales',
      data: [152,109,93,113,126,161,188,143,102,113,116,124]
    }],
    chart: {
      type: 'bar',
      height: '318',
      parentHeightOffset: 0,
      foreColor: obj.bodyColor,
      background: obj.cardBg,
      toolbar: {
        show: false
      },
    },
    colors: [obj.primary],
    fill: {
      opacity: .9
    } ,
    grid: {
      padding: {
        bottom: -4
      },
      borderColor: obj.gridBorder,
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    xaxis: {
      type: 'datetime',
      categories: ['01/01/2022','02/01/2022','03/01/2022','04/01/2022','05/01/2022','06/01/2022','07/01/2022', '08/01/2022','09/01/2022','10/01/2022', '11/01/2022', '12/01/2022'],
      axisBorder: {
        color: obj.gridBorder,
      },
      axisTicks: {
        color: obj.gridBorder,
      },
    },
    yaxis: {
      title: {
        text: 'Number of Sales',
        style:{
          size: 9,
          color: obj.muted
        }
      },
      labels: {
        offsetX: 0,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: 'center',
      fontFamily: obj.fontFamily,
      itemMargin: {
        horizontal: 8,
        vertical: 0
      },
    },
    stroke: {
      width: 0
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '10px',
        fontFamily: obj.fontFamily,
      },
      offsetY: -27
    },
    plotOptions: {
      bar: {
        columnWidth: "50%",
        borderRadius: 4,
        dataLabels: {
          position: 'top',
          orientation: 'vertical',
        }
      },
    }
  }
}



/**
 * Cloud storage chart options
 */
function getCloudStorageChartOptions(obj: any) {
  return {
    series: [67],
    chart: {
      height: 260,
      type: "radialBar"
    },
    colors: [obj.primary],
    plotOptions: {
      radialBar: {
        hollow: {
          margin: 15,
          size: "70%"
        },
        track: {
          show: true,
          background: obj.light,
          strokeWidth: '100%',
          opacity: 1,
          margin: 5,
        },
        dataLabels: {
          showOn: "always",
          name: {
            offsetY: -11,
            show: true,
            color: obj.muted,
            fontSize: "13px"
          },
          value: {
            color: obj.bodyColor,
            fontSize: "30px",
            show: true
          }
        }
      }
    },
    fill: {
      opacity: 1
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Storage Used"]
  }
};
