import {Component, ElementRef, Input, NgZone, OnInit, ViewChild} from "@angular/core";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

import { HttpService } from "src/app/shared/services/http.service";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import {Geocoder, MapsAPILoader, MouseEvent} from "@agm/core";
import Swal from "sweetalert2";

declare const google: any;



@Component({
  selector: 'app-service',
  templateUrl: './add-service.component.html',
  styleUrls: ['./add-service.component.scss']
})
export class AddServiceComponent implements OnInit {
  edit = false;
  @Input() title: any;
  @Input() formData: any;
  private loading: boolean;
  Branches: any;

  selectedCoordinates: {lat: number, lng: number };

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
  private geoCoder: Geocoder;

  ngOnInit(): void {
    console.log("this.formData");
    console.log(this.formData);

    if (this.formData && this.formData.coordinates) {

      let receivedCoordinates = JSON.parse(atob(this.formData.coordinates));
      console.log("receivedCoordinates");
      console.log(receivedCoordinates);

      this.latitude = receivedCoordinates.lat;
      this.longitude = receivedCoordinates.lng;

      this.zoom = 14;
      this.getAddress(this.latitude, this.longitude);

    } else {
      this.setCurrentLocation();
    }

    this.getBranches()

    this.mapsAPILoader.load().then(() => {

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

          this.selectedCoordinates = {lat: this.latitude, lng: this.longitude};
        });
      });
    });

    if (this.formData && this.formData.content) {
      this.edit = true;
      this.cardTitle = "Edit ATM";

      this.atmName = this.formData.content.name;

    } else {
      this.cardTitle = "Add ATM";
    }


    this.form = this.fb.group({
      name: [this.formData ? this.formData.name : '', [Validators.required]],
      atmCode: [this.formData ? this.formData.atmCode : '', [Validators.required]],
      branch: [this.formData ? this.formData.branch : '', [Validators.required]],
      is_active: [this.formData ? this.formData.is_active : '', [Validators.nullValidator]]
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

    if (this.latitude && this.longitude && this.geoCoder) {
      this.geoCoder.geocode({'location': {lat: latitude, lng: longitude}}, (results: any, status: any) => {
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

  public submitData(): void {
    if (this.formData) {
      this.saveChanges();
    } else {
      this.createATM();
    }
    this.loading = true;
  }


  createATM(): void {
    const model =
      {
        branchId: this.form.value.branch,
        name: this.form.value.name,
        atmCode: this.form.value.atmCode,
        coordinates: JSON.stringify(this.selectedCoordinates)
      }
    this._httpService.mobileBankingPost("config/branch/addAtms", model).subscribe((result: any) => {
      if (result.status === 200) {
        this.activeModal.close('success');
        Swal.fire('Success',result.message,'success')
          .then(r=>(console.log(r)))
        this.close();
      } else {
        Swal.fire('Failed','Unable to create ATM','error')
      }
    }, (error: any) => {
    });
  }

  saveChanges(): void {
    console.log(this.formData);



    const model = {
      id: this.formData.id,
      branchId: this.form.value.branch,
      name: this.form.value.name,
      atmCode: this.form.value.atmCode,
      coordinates: JSON.stringify(this.selectedCoordinates)
    };
    this._httpService.mobileBankingPost("config/branch/atm/edit", model).subscribe((result:any) => {
      if (result.status === 200) {
        this.activeModal.close('success');
        Swal.fire('Success',result.message,'success')
          .then(r=>(console.log(r)))
        this.close();
      } else {
        Swal.fire('Failed','Unable to update ATM','error')
      }
    }, (error: any) => {
    });
  }

  getBranches(){
    const model = {
      page:0,
      size:50
    }
    this._httpService.mobileBankingPost("config/branch/fetch/region/page",model).subscribe(
      (result:any)=>{
        if(result.status===200){
          this.Branches = result.data;
        }
        else{
          Swal.fire('failed','unable to fetch records','error')
        }
      }
    )
  }


}
