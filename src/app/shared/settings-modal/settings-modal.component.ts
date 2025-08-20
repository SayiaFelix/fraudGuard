import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class SettingsModalComponent {
  // EventEmitter to notify the parent component to close the modal
  @Output() close = new EventEmitter<void>();

  selectedTheme = 'Light';
  userStatus = 'Online';
  
  // User info - you can customize these
  userName = 'Tecla Kyalo';
  userEmail = 'kyalo.tecla@eclectics.io';

  constructor() { }

  onClose() {
    this.close.emit();
  }

  setTheme(theme: string) {
    this.selectedTheme = theme;
    // Add your theme switching logic here
    console.log('Theme changed to:', theme);
  }

  setStatus(status: string) {
    this.userStatus = status;
    // Add your status change logic here
    console.log('Status changed to:', status);
  }

  onWorkspaceSettings() {
    console.log('Open workspace settings');
    // Add navigation logic here
  }

  onAccountSettings() {
    console.log('Open account settings');
    // Add navigation logic here
  }

  onChangeWorkspace() {
    console.log('Change workspace');
    // Add navigation logic here
  }

  onSignOut() {
    console.log('Sign out');
    // Add sign out logic here
  }

  onSaveChanges() {
    console.log('Save changes');
    // Add save logic here
    this.onClose();
  }
}