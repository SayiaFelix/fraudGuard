// file-drop.directive.ts
import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appFileDrop]'
})
export class FileDropDirective {
  @Output() fileDropped = new EventEmitter<FileList>();
  @Output() fileHovered = new EventEmitter<boolean>();

  @HostListener('dragover', ['$event']) onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.fileHovered.emit(true);
  }

  @HostListener('dragleave', ['$event']) onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.fileHovered.emit(false);
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.fileHovered.emit(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileDropped.emit(files);
    }
  }
}