import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-all-standards',
  templateUrl: './all-standards.component.html',
  styleUrls: ['./all-standards.component.scss']
})
export class StandardsComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  onRegister(e: Event) {
    e.preventDefault();
    localStorage.setItem('isLoggedin', 'true');
    if (localStorage.getItem('isLoggedin')) {
      this.router.navigate(['/']);
    }
  }

}
