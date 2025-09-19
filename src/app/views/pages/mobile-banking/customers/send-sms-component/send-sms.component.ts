import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef 
} from '@angular/core';
import { HttpService } from 'src/app/shared/services/http.service';
import { GlobalService } from 'src/app/shared/services/global.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import Swal from "sweetalert2";
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';

interface Trigger {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  training_phrases?: string[]; 
  is_root?: boolean; 
}

@Component({
  selector: 'app-list-mobile-app',
  templateUrl: './send-sms.component.html',
  styleUrls: ['./send-sms.component.scss'],
})
export class SendSmsComponent implements OnInit {
  auditId!: string | null ;
  observations: any[] = [];
  private apiUrl = 'http://localhost:3000/observations';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.auditId = this.route.snapshot.paramMap.get('auditId');
    this.loadObservations();
  }

  loadObservations(): void {
    this.http.get<any[]>(`${this.apiUrl}?auditId=${this.auditId}`).subscribe({
      next: (data) => (this.observations = data),
      error: (err) => console.error('Error fetching observations:', err),
    });
  }
}