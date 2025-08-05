// This is the complete code for: src/app/pages/test-page/test-page.component.ts

import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-test-page',
  templateUrl: './test-page.component.html',
  styleUrls: ['./test-page.component.scss'] // <-- use .scss here
})
export class TestPageComponent implements OnInit {

  // This property will hold our safe, ready-to-use chatbot script.
  public chatbotScript: SafeHtml;

  // We need to ask Angular to give us its "DOM Sanitizer" tool.
  constructor(private sanitizer: DomSanitizer) { }

  // ngOnInit is a special function that runs automatically when the component loads.
  ngOnInit(): void {
    
    // 1. Look in the browser's storage and get the item we saved called 'chatbotTestScript'.
    const scriptFromStorage = localStorage.getItem('chatbotTestScript');

    if (scriptFromStorage) {
      // 2. IMPORTANT: We must tell Angular this script is safe to use.
      // This prevents security issues and is a required step.
      this.chatbotScript = this.sanitizer.bypassSecurityTrustHtml(scriptFromStorage);

      // 3. (Optional but good practice) Remove the script from storage so it's clean for next time.
      localStorage.removeItem('chatbotTestScript');
      
    } else {
      // If for some reason the page is opened directly without the script, log an error.
      console.error('Chatbot test script was not found in local storage.');
    }
  }

  goBack(): void {
    window.history.back();
  }
}