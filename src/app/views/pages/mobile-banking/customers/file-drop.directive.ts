import { Directive, HostListener, Output, EventEmitter, ElementRef } from '@angular/core';

@Directive({
  selector: '[appFileDrop]'
})
export class FileDropDirective {
  @Output() fileDropped = new EventEmitter<FileList>();
  @Output() fileHovered = new EventEmitter<boolean>();

  constructor(private el: ElementRef) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.fileHovered.emit(true);
    this.el.nativeElement.style.backgroundColor = '#f8f9fa';
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.fileHovered.emit(false);
    this.el.nativeElement.style.backgroundColor = '';
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.fileHovered.emit(false);
    this.el.nativeElement.style.backgroundColor = '';

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fileDropped.emit(files);
    }
  }
}