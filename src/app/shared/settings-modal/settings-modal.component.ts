import { Component, EventEmitter, Output, OnInit } from '@angular/core';

interface Workspace {
  id: string;
  name: string;
  initial: string;
  isActive: boolean;
}

type SettingsView = 'main' | 'workspace' | 'account' | 'changeWorkspace';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class SettingsModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() workspaceChanged = new EventEmitter<Workspace>();

  currentView: SettingsView = 'main';
  selectedTheme: 'system' | 'light' | 'dark' = 'light';
  userStatus: 'online' | 'away' | 'offline' = 'online';
  
  // User info
  userName = '';
  userEmail = '';
  userInitials = '';
  firstName = '';
  lastName = '';
  preferredLanguage = 'en';
  
  // Workspace info
  workspaceName = '';
  workspaceInitial = 'E';
  workspaces: Workspace[] = [];
  
  // Notification settings
  browserNotifications = false;
  platformNotifications = true;

  constructor() { 
    this.loadUserData();
    this.loadUserPreferences();
    this.loadWorkspaces();
  }

  ngOnInit() {
    this.applyTheme();
  }

  private loadUserData() {
    try {
      this.firstName = localStorage.getItem('first_name') || '';
      this.lastName = localStorage.getItem('last_name') || '';
      const userName = localStorage.getItem('user_name') || '';
      
      if (this.firstName && this.lastName) {
        this.userName = `${this.firstName} ${this.lastName}`;
      } else if (userName) {
        this.userName = userName;
      } else if (this.firstName) {
        this.userName = this.firstName;
      } else {
        this.userName = 'Audit1';
      }
      
      this.userEmail = localStorage.getItem('email') || localStorage.getItem('user_email') || 'audit@internal.io';
      this.userInitials = this.generateInitials(this.userName);
      this.preferredLanguage = localStorage.getItem('preferred_language') || 'en';
      this.browserNotifications = localStorage.getItem('browser_notifications') === 'true';
      this.platformNotifications = localStorage.getItem('platform_notifications') !== 'false';
      
    } catch (error) {
      console.error('Error loading user data:', error);
      this.setDefaultUserData();
    }
  }

  private loadUserPreferences() {
    try {
      const savedTheme = localStorage.getItem('user_theme') as 'system' | 'light' | 'dark';
      const savedStatus = localStorage.getItem('user_status') as 'online' | 'away' | 'offline';
      
      if (savedTheme) {
        this.selectedTheme = savedTheme;
      }
      
      if (savedStatus) {
        this.userStatus = savedStatus;
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  private loadWorkspaces() {
    // Load workspace data
    this.workspaceName = localStorage.getItem('workspace_name') || 'Eclectics';
    this.workspaceInitial = this.workspaceName.charAt(0).toUpperCase();
    
    // Sample workspaces - replace with actual data source
    this.workspaces = [
      {
        id: '1',
        name: 'Eclectics',
        initial: 'E',
        isActive: true
      },
      {
        id: '2', 
        name: 'Tecla Kyalo',
        initial: 'T',
        isActive: false
      }
    ];

    const savedWorkspaces = localStorage.getItem('user_workspaces');
    if (savedWorkspaces) {
      try {
        this.workspaces = JSON.parse(savedWorkspaces);
      } catch (error) {
        console.error('Error parsing workspaces:', error);
      }
    }
  }

  private setDefaultUserData() {
    this.userName = 'User';
    this.userEmail = 'user@eclectics.io';
    this.userInitials = 'U';
    this.firstName = '';
    this.lastName = '';
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

  private applyTheme() {
    // Apply theme to the entire document body, not just the modal
    const body = document.body;
    const html = document.documentElement;
    
    // Remove existing theme classes
    body.classList.remove('theme-system', 'theme-light', 'theme-dark');
    html.classList.remove('theme-system', 'theme-light', 'theme-dark');
    
    if (this.selectedTheme === 'system') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeClass = isDarkMode ? 'theme-dark' : 'theme-light';
      body.classList.add(themeClass, 'theme-system');
      html.classList.add(themeClass, 'theme-system');
    } else {
      const themeClass = `theme-${this.selectedTheme}`;
      body.classList.add(themeClass);
      html.classList.add(themeClass);
    }
  }

  // View navigation
  showView(view: SettingsView) {
    this.currentView = view;
  }

  goBack() {
    this.currentView = 'main';
  }

  // Main settings actions
  getStatusColor(): string {
    switch (this.userStatus) {
      case 'online': return '#4ade80';
      case 'away': return '#f59e0b';
      case 'offline': return '#ef4444';
      default: return '#4ade80';
    }
  }

  onClose() {
    this.close.emit();
  }

  setTheme(theme: 'system' | 'light' | 'dark') {
    this.selectedTheme = theme;
    localStorage.setItem('user_theme', theme);
    this.applyTheme();
  }

  setStatus(status: 'online' | 'away' | 'offline') {
    this.userStatus = status;
    localStorage.setItem('user_status', status);
  }

  changePassword() {
    window.location.href = 'http://localhost:4200/auth/first-time-password';
  }

  onSignOut() {
    localStorage.removeItem('user_theme');
    localStorage.removeItem('user_status');
    console.log('Sign out');
  }

  // Workspace settings actions
  uploadWorkspaceImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file && file.size <= 10 * 1024 * 1024) {
        console.log('Uploading workspace image:', file.name);
      } else {
        alert('File must be PNG or JPEG and under 10MB');
      }
    };
    input.click();
  }

  removeWorkspaceImage() {
    console.log('Removing workspace image');
  }

  saveWorkspaceSettings() {
    localStorage.setItem('workspace_name', this.workspaceName);
    this.workspaceInitial = this.workspaceName.charAt(0).toUpperCase();
    console.log('Workspace settings saved');
    this.goBack();
  }

  // Account settings actions
  uploadAccountImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file && file.size <= 10 * 1024 * 1024) {
        console.log('Uploading account image:', file.name);
      } else {
        alert('File must be PNG or JPEG and under 10MB');
      }
    };
    input.click();
  }

  removeAccountImage() {
    console.log('Removing account image');
  }

  toggleBrowserNotifications() {
    this.browserNotifications = !this.browserNotifications;
    localStorage.setItem('browser_notifications', this.browserNotifications.toString());
  }

  togglePlatformNotifications() {
    this.platformNotifications = !this.platformNotifications;
    localStorage.setItem('platform_notifications', this.platformNotifications.toString());
  }

  saveAccountSettings() {
    localStorage.setItem('first_name', this.firstName);
    localStorage.setItem('last_name', this.lastName);
    localStorage.setItem('email', this.userEmail);
    localStorage.setItem('preferred_language', this.preferredLanguage);
    
    // Update computed values
    if (this.firstName && this.lastName) {
      this.userName = `${this.firstName} ${this.lastName}`;
    } else if (this.firstName) {
      this.userName = this.firstName;
    }
    this.userInitials = this.generateInitials(this.userName);
    
    console.log('Account settings saved');
    this.goBack();
  }

  // Change workspace actions
  selectWorkspace(workspace: Workspace) {
    if (!workspace.isActive) {
      this.workspaces.forEach(w => w.isActive = false);
      workspace.isActive = true;
      
      localStorage.setItem('active_workspace', workspace.id);
      localStorage.setItem('workspace_name', workspace.name);
      
      this.workspaceChanged.emit(workspace);
      console.log('Switched to workspace:', workspace.name);
    }
    
    this.onClose();
  }

  onSaveChanges() {
    console.log('Changes saved automatically');
    this.onClose();
  }
}