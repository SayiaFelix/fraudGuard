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
  
  // User info - will be loaded from localStorage
  userName = '';
  userEmail = '';
  userInitials = '';

  constructor() { 
    this.loadUserData();
  }

  private loadUserData() {
    try {
      // Get user data from localStorage individual keys
      const firstName = localStorage.getItem('first_name') || '';
      const lastName = localStorage.getItem('last_name') || '';
      const userName = localStorage.getItem('user_name') || '';
      
      // Build full name from first and last name
      if (firstName && lastName) {
        this.userName = `${firstName} ${lastName}`;
      } else if (userName) {
        this.userName = userName;
      } else if (firstName) {
        this.userName = firstName;
      } else {
        this.userName = 'User';
      }
      
      // For now, we'll use a placeholder email since I don't see email in your localStorage
      // You can add the actual email key if you have it stored
      this.userEmail = localStorage.getItem('email') || localStorage.getItem('user_email') || 'user@example.com';
      
      // Generate initials
      this.userInitials = this.generateInitials(this.userName);
      
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
      // Fallback values
      this.userName = 'User';
      this.userEmail = 'user@example.com';
      this.userInitials = 'U';
    }
  }

  private generateInitials(name: string): string {
    if (!name) return 'U';
    
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return 'U';
  }

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

  onChangePassword() {
    console.log('Change password');
    // Add change password logic here
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