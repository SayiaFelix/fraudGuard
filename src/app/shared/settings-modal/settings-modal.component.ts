import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class SettingsModalComponent {
  // EventEmitter to notify the parent component to close the modal
  @Output() close = new EventEmitter<void>();

  constructor() { }

  onClose() {
    this.close.emit();
  }
}