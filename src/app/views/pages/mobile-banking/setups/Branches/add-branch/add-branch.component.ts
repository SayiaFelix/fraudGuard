import {Component, ElementRef, Input, NgZone, OnInit, ViewChild} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

import { HttpService } from "src/app/shared/services/http.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {MapsAPILoader, MouseEvent} from "@agm/core";


declare const google: any;

@Component({
  selector: 'app-add-branch',
  templateUrl: './add-branch.component.html',
  styleUrls: ['./add-branch.component.scss']
})
export class AddBranchComponent implements OnInit {
  edit = false;
  @Input() title: any;
  @Input() data: any;

  constructor(
    public activeModal: NgbActiveModal,
    // tslint:disable-next-line:variable-name
    private _httpService: HttpService,
    private fb: FormBuilder,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone
  ) {
  }

  @ViewChild('search', {static: false})
  public searchElementRef: ElementRef;


  // @ts-ignore
  pointList: { lat: number; lng: number }[] = [];

  atmName: string;

  cardTitle: string;
  form: FormGroup;

  lat: number;
  lng: number;
  errorMessage: any;

  latitude: number;
  longitude: number;
  zoom: number;
  address: string;
  private geoCoder: any;

  ngOnInit(): void {

    this.mapsAPILoader.load().then(() => {
      this.setCurrentLocation();
      this.geoCoder = new google.maps.Geocoder;

      let autocomplete = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement);
      autocomplete.addListener("place_changed", () => {
        this.ngZone.run(() => {
          //get the place result
          let place: google.maps.places.PlaceResult = autocomplete.getPlace();

          //verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          //set latitude, longitude and zoom
          this.latitude = place.geometry.location.lat();
          this.longitude = place.geometry.location.lng();
          this.zoom = 12;
        });
      });
    });

    if (this.data && this.data.content) {
      this.edit = true;
      this.cardTitle = "Edit Branch";

      this.atmName = this.data.content.name;

    } else {
      this.cardTitle = "Add Branch";
    }


    this.form = this.fb.group({
      branchName: [this.data ? this.data.branchName : '', [Validators.required]],
      branchCode: [this.data ? this.data.branchCode : '', [Validators.required]],
      region: [this.data ? this.data.region : '', [Validators.required]],
      is_active: [this.data ? this.data.is_active : '', [Validators.nullValidator]]
    });
  }

  addRegion(): void {
    const model = {
      bounds: this.pointList,
      name: this.atmName,
    };
    this._httpService.mobileBankingPost("dsr-create-region", model).subscribe((result: any) => {
      if (result.status === 1) {
        this.close();
      } else {
      }
    }, (error: any) => {
      });
  }

  editRegion(): void {
    const model = {
      bounds: this.pointList,
      name: this.atmName,
      id: this.data.content.id
    };
    this._httpService.mobileBankingPost("dsr-update-region", model).subscribe((result:any) => {
      if (result.status === 1) {
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

  // Get Current Location Coordinates
  private setCurrentLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.zoom = 8;
        this.getAddress(this.latitude, this.longitude);
      });
    }
  }


  markerDragEnd($event: MouseEvent) {
    console.log($event);
    this.latitude = $event.coords.lat;
    this.longitude = $event.coords.lng;
    this.getAddress(this.latitude, this.longitude);
  }

  getAddress(latitude: any, longitude: any) {
    this.geoCoder.geocode({ 'location': { lat: latitude, lng: longitude } }, (results: any, status: any) => {
      console.log(results);
      console.log(status);
      if (status === 'OK') {
        if (results[0]) {
          this.zoom = 12;
          this.address = results[0].formatted_address;
        } else {
          window.alert('No results found');
        }
      } else {
        window.alert('Geocoder failed due to: ' + status);
      }

    });
  }

}
