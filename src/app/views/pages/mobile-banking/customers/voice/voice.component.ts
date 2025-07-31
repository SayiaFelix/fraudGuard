import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss']
})
export class VoiceComponent implements OnInit {

  voiceForm: FormGroup;

  // Languages available in the dropdowns (excluding initially selected ones)
  availableLanguages: string[] = ['Swahili', 'Arabic', 'Spanish', 'German'];

  // --- State for Speech-to-text (Multi-select) ---
  selectedSttLanguages: string[] = ['English', 'French']; // Initial values from image

  // --- State for Text-to-speech (Single-select) ---
  // We manage this directly with a form control, but keep a separate var for the pill
  selectedTtsLanguage: string = 'English'; 

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    // Initialize the form with values that match the UI image
    this.voiceForm = this.fb.group({
      enableSpeechToText: [true],
      enableTextToSpeech: [false],
      textToSpeechLanguage: [this.selectedTtsLanguage], // 'English'
      sendTextMessage: [false]
    });

    // When the language for Text-to-Speech changes in the form, update our local variable for the pill
    this.voiceForm.get('textToSpeechLanguage')!.valueChanges.subscribe(value => {
        this.selectedTtsLanguage = value;
    });
  }

  // --- Getters for safe template access (prevents null errors) ---
  get enableSpeechToTextValue(): boolean {
    return this.voiceForm.get('enableSpeechToText')?.value ?? false;
  }
  
  get enableTextToSpeechValue(): boolean {
    return this.voiceForm.get('enableTextToSpeech')?.value ?? false;
  }

  // --- Speech-to-text Methods ---

  addSttLanguage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const langToAdd = select.value;

    if (langToAdd && !this.selectedSttLanguages.includes(langToAdd)) {
      this.selectedSttLanguages.push(langToAdd);
    }
    // Reset the select dropdown so the placeholder is shown again
    select.value = '';
  }

  removeSttLanguage(langToRemove: string): void {
    this.selectedSttLanguages = this.selectedSttLanguages.filter(lang => lang !== langToRemove);
  }

  // --- Save Methods (for simulation) ---

  saveSpeechToTextSettings(): void {
    console.log('Saving Speech-to-text settings:', {
      enabled: this.enableSpeechToTextValue,
      languages: this.selectedSttLanguages
    });
    // TODO: Replace alert with your actual API call (e.g., this._httpService.post(...))
    alert('Speech-to-text settings saved! Check the browser console for the data.');
  }

  saveTextToSpeechSettings(): void {
    // This button is disabled if the section is off, so no need to check enableTextToSpeechValue here
    console.log('Saving Text-to-speech settings:', {
      enabled: this.enableTextToSpeechValue,
      language: this.voiceForm.value.textToSpeechLanguage,
      sendTranscript: this.voiceForm.value.sendTextMessage
    });
    // TODO: Replace alert with your actual API call
    alert('Text-to-speech settings saved! Check the browser console for the data.');
  }
}