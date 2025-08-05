// ====================================================================================
// FINAL AND DEFINITIVELY CORRECTED test-page.component.ts
// ====================================================================================

import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

// THIS IS THE CRITICAL FIX: The @Component decorator was missing.
@Component({
  selector: 'app-test-page',
  templateUrl: './test-page.component.html',
  styleUrls: ['./test-page.component.scss']
})
export class TestPageComponent implements OnInit {

  public errorMessage: string | null = null;

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    console.log('Test Page component has loaded. Checking for chatbot script in Local Storage...');
    const scriptContent = localStorage.getItem('chatbotTestScript');

    if (scriptContent) {
      console.log('SUCCESS: Found script in localStorage. Injecting it into the page now.');
      const script = this.renderer.createElement('script');
      script.type = 'text/javascript';
      script.text = scriptContent;
      this.renderer.appendChild(this.document.body, script);
      localStorage.removeItem('chatbotTestScript');
    } else {
      this.errorMessage = 'Chatbot script not found in Local Storage. Please go back to the setup page and click "Test" again.';
      console.error('FAILURE: Could not find "chatbotTestScript" in Local Storage.');
    }
  }
}