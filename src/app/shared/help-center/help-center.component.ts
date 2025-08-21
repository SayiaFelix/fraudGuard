// src/app/shared/help-center/help-center.component.ts

import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-help-center',
  templateUrl: './help-center.component.html',
  styleUrls: ['./help-center.component.scss']
})
export class HelpCenterComponent {

  /**
   * This is an event emitter that will notify the parent component
   * that the user has requested to close this popover.
   */
  @Output() close = new EventEmitter<void>();

  /**
   * This method is called when the user clicks the '×' button in the template.
   * It triggers the 'close' event.
   */
  onCloseClick(): void {
    this.close.emit();
  }

}