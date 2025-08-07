// ====================================================================================
// FINAL, CORRECTED `list-users.component.ts`. PLEASE REPLACE THE ENTIRE FILE.
// ====================================================================================

import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-list-users',
  templateUrl: './list-users.component.html',
  styleUrls: ['./list-users.component.scss']
})
export class ListUsersComponent implements OnInit {
  public isSidebarVisible: boolean = false;
  public selectedLivechat: any = null;

  // --- Dropdown State ---
  public activeDropdown: 'assignee' | 'team' | 'tags' | 'status' | 'date' | null = null;
  
  // Static data for the dropdowns
  public assigneesList = [
    { name: 'ndungu.joseph', initials: 'N' },
    { name: 'Bridged Mwende', initials: 'BM' },
    { name: 'Chris Kahiga', initials: 'CK' },
    { name: 'Fareedah Okunade', initials: 'FO' },
    { name: 'Felix Lucas Sayia', initials: 'FL' },
    { name: 'George Maputol', initials: 'GM' },
    { name: 'Harith Said', initials: 'HS' }
  ];

  public statusesList = [
    { name: 'Open', color: 'blue' },
    { name: 'Pending', color: 'orange' },
    { name: 'Overdue', color: 'red' },
    { name: 'Resolved', color: 'green' },
    { name: 'Closed', color: 'gray' }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  // This helps us close the dropdown if the user clicks anywhere else on the page
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-item')) {
      this.activeDropdown = null;
    }
  }
  
  /**
   * Toggles the visibility of a specific filter dropdown.
   */
  toggleDropdown(event: MouseEvent, dropdownName: 'assignee' | 'team' | 'tags' | 'status' | 'date'): void {
    event.stopPropagation(); 
    if (this.activeDropdown === dropdownName) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = dropdownName;
    }
  }

  // --- ADDED: Methods to control the details sidebar ---

  /**
   * Shows the sidebar and sets the selected chat data.
   * For now, we pass a static object for design purposes.
   * @param chat The chat object from the row that was clicked.
   */
  showDetailsSidebar(chat: any): void {
    this.selectedLivechat = chat;
    this.isSidebarVisible = true;
  }

  /**
   * Hides the sidebar.
   */
  hideDetailsSidebar(): void {
    this.isSidebarVisible = false;
    this.selectedLivechat = null; // Clear the selection
  }
}