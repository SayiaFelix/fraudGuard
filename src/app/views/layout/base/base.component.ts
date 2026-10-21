// src/app/views/layout/base/base.component.ts

import { Component, OnInit } from '@angular/core';
import { Router, RouteConfigLoadStart, RouteConfigLoadEnd } from '@angular/router';

@Component({
  selector: 'app-base',
  templateUrl: './base.component.html',
  styleUrls: ['./base.component.scss']
})
export class BaseComponent implements OnInit {

  isLoading: boolean;

  // Properties to control the help center popover
  isHelpCenterVisible = false;
  helpCenterPosition = { top: '0px', left: '0px' };

  constructor(private router: Router) {
    // Spinner for lazyload modules
    router.events.forEach((event) => {
      if (event instanceof RouteConfigLoadStart) {
        this.isLoading = true;
      } else if (event instanceof RouteConfigLoadEnd) {
        this.isLoading = false;
      }
    });
  }

  ngOnInit(): void {
  }

  // Handle help center toggle event from sidebar
  onHelpCenterToggled(event: MouseEvent): void {
    // Toggle the visibility
    this.isHelpCenterVisible = !this.isHelpCenterVisible;
    
    // If we're showing the popover, calculate its position
    if (this.isHelpCenterVisible) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const popoverHeight = 300; // Approximate height of your help center popover
      const viewportHeight = window.innerHeight;
      
      // Calculate optimal position
      let top = rect.top + window.scrollY;
      let left = rect.right + 10;
      
      // If popover would go below viewport, position it above the clicked element
      if (rect.bottom + popoverHeight > viewportHeight) {
        top = rect.top + window.scrollY - popoverHeight + rect.height;
      }
      
      // If popover would go off the right edge, position it to the left
      if (rect.right + 320 > window.innerWidth) { // 320px is popover width
        left = rect.left - 330; // Position to the left with some margin
      }
      
      this.helpCenterPosition = {
        top: `${Math.max(10, top)}px`, // Ensure it's at least 10px from top
        left: `${Math.max(10, left)}px` // Ensure it's at least 10px from left
      };
    }
  }

  // Handle help center close event
  onHelpCenterClose(): void {
    this.isHelpCenterVisible = false;
  }

}