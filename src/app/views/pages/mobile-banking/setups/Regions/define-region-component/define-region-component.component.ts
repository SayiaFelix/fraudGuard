import {AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

import {constituencies, counties} from "../CountiesAndConstituencies";
import { HttpService } from "src/app/shared/services/http.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import Swal from "sweetalert2";


declare const google: any;

@Component({
  selector: "define-region",
  templateUrl: "./define-region-component.component.html",
  styleUrls: ["./define-region-component.component.scss"]
})
export class DefineRegionComponent implements OnInit {
  edit = false;
  @Input() title: any;
  @Input() formData: any;
  public loading:boolean;

  constructor(
    public activeModal: NgbActiveModal,
    // tslint:disable-next-line:variable-name
    private _httpService: HttpService,
    private fb: FormBuilder
  ) {
  }
  @ViewChild("updatedMap", {static: true})
  updatedMap: any;

  // @ts-ignore
  pointList: { lat: number; lng: number }[] = [];
  drawingManager: any;
  selectedShape: any;
  selectedArea = 0;

  regionName: string;
  regionCode: string;

  radioValue: any = "Predefined";
  regions: string[];
  administationZoneType = "Constituency";
  cardTitle: string;
  form: FormGroup;

  lat: number;
  lng: number;
  errorMessage: any;

  ngOnInit(): void {
    // this.setCurrentPosition();

    if (this.formData && this.formData.content) {
      this.edit = true;
      this.cardTitle = "Edit Region";

      this.regionName = this.formData.content.name;
      this.regionCode = this.formData.content.name;
      this.pointList = this.formData.content.bounds;
      this.lat = this.formData.content.bounds[0] ? this.formData.content.bounds[0].lat : 0.51796165;
      this.lng = this.formData.content.bounds[0] ? this.formData.content.bounds[0].lng : 36.48531687;
    } else {
      this.cardTitle = "Add Region";
      this.lat = 0.51796165;
      this.lng = 36.48531687;

    }


    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : "", Validators.compose([Validators.required])],
      code: [this.formData ? this.formData.code : "", Validators.compose([Validators.required])],
      constituency: [this.formData ? this.formData.constituency: "", Validators.compose([Validators.required])],
      county: [this.formData ? this.formData.county : "", Validators.compose([Validators.required])],
      zone: [""],
      selectedZone: [""],

    });
  }

  public submitData(): void {
    if (this.formData) {
      this.saveChanges();
    } else {
      this.createRecord();
    }
    this.loading = true;
  }
  createRecord(): void {
    const model = {
      // bounds: this.pointList,
      // code: this.regionCode,
      name: this.form.value.name,
      code:this.form.value.code,
      constituency:this.form.value.selectedZone,
      county:this.form.value.zone,
      coordinates: this.pointList.toString()
    };
    this._httpService.mobileBankingPost("config/region/create", model).subscribe((result: any) => {
      if (result.status === 200) {
        this.activeModal.close("success")
        Swal.fire('Success',result.message,'success')
        .then(r=>console.log(r))
        this.close();
      } else {
      }
    }, (error: any) => {
      });
  }

  saveChanges(): void {
    const model = {
      id:this.formData.id,
      name: this.form.value.name,
      code:this.form.value.code,
      constituency:this.form.value.selectedZone,
      county:this.form.value.zone,
      coordinates: this.pointList.toString()
    };
    this._httpService.mobileBankingPost("config/region/update", model).subscribe((result:any) => {
      if (result.status === 200) {
        this.activeModal.close("success")
        Swal.fire('Success',result.message,'success')
        this.close();
      } else {
      }
    }, (error: any) => {
      });
  }

  close(): void {
    setTimeout(() => {
        this.activeModal.dismiss('Cross click');
    }, 500);
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

  deleteSelectedShape() {
    if (this.selectedShape) {
      this.selectedShape.setMap(null);
      this.selectedArea = 0;
      this.pointList = [];
      // To show:
      this.drawingManager.setOptions({
        drawingControl: true,
      });
    }
  }

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

  customUpdatePointList(path: string | any[]) {

    this.pointList = [];
    const len = path.length;
    for (let i = 0; i < len; i++) {
      this.pointList.push(
        path[i]
      );
    }
  }

  zoneChanged(event: string) {

    if (event === "County") {
      this.administationZoneType = "County";
      this.regions = counties;

    } else if (event === "Constituency") {
      this.administationZoneType = "Constituency";
      this.regions = constituencies;
    }


  }

  regionSelected() {

    let event = this.form.value.selectedZone;

    if (this.administationZoneType === "Constituency") {
      this._httpService.getMapCoordinates("/assets/constituencies.json").subscribe((json: any) => {

        // @ts-ignore
        json.features.map((item: any) => {

          if (item.properties.CONSTITUEN.trim() === event.toUpperCase().trim()) {
            const cleanItem: string | any[] = [];

            item.geometry.coordinates[0].map((itemNew: any) => {
              cleanItem.push({lat: itemNew[1], lng: itemNew[0]});
            });

            this.pointList = cleanItem;

            // clear previous region
            this.deleteSelectedShape();

            // draw new region.
            this.customUpdatePointList(cleanItem);

            // move map center to middle of zone.
            this.lat = cleanItem[0].lat;
            this.lng = cleanItem[0].lng;

            return cleanItem;
          }
        });

      });
    } else if (this.administationZoneType === "County") {
      this._httpService.getMapCoordinates("/assets/counties.json").subscribe((json: any) => {

        // @ts-ignore
        json.features.map((item: any) => {

          if (item.properties.COUNTY.trim() === event.trim()) {
            const cleanItem: string | any[] = [];

            item.geometry.coordinates[0].map((itemNew: any[]) => {
              cleanItem.push({lat: itemNew[1], lng: itemNew[0]});
            });

            this.pointList = cleanItem;

            // clear previous region
            this.deleteSelectedShape();

            // draw new region.
            this.customUpdatePointList(cleanItem);

            // move map center to middle of zone.
            this.lat = cleanItem[0].lat;
            this.lng = cleanItem[0].lng;

            return cleanItem;
          }
        });

      });
    }

  }

  showSelectionChange() {
    this.administationZoneType = this.form.value.zone;

    this.zoneChanged(this.administationZoneType);
  }
}
