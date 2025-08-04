import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-voice',
  templateUrl: './voice.component.html',
  styleUrls: ['./voice.component.scss']
})
export class VoiceComponent implements OnInit, OnDestroy {

  voiceForm: FormGroup;
  private destroy$ = new Subject<void>();

  
  availableLanguages: string[] = ['Swahili', 'Arabic', 'Spanish', 'German'];

 
  selectedSttLanguages: string[] = ['English', 'French'];

  constructor(private fb: FormBuilder) { }

  ngOnInit() {
    
    this.voiceForm = this.fb.group({
      enableSpeechToText: [true],
      enableTextToSpeech: [false],
    
      textToSpeechLanguage: [{ value: 'English', disabled: true }],
      textToSpeechVoice: [{ value: '', disabled: true }], 
      sendTextMessage: [{ value: false, disabled: true }]
    });

    
    this.voiceForm.get('enableTextToSpeech')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(enabled => {
        const controlsToToggle = ['textToSpeechLanguage', 'textToSpeechVoice', 'sendTextMessage'];
        controlsToToggle.forEach(name => {
            const control = this.voiceForm.get(name);
            if (control) {
                enabled ? control.enable() : control.disable();
            }
        });
    });
  }

  
  get enableSpeechToTextValue(): boolean {
    return this.voiceForm.get('enableSpeechToText')?.value ?? false;
  }
  
  get enableTextToSpeechValue(): boolean {
    return this.voiceForm.get('enableTextToSpeech')?.value ?? false;
  }
  
  get selectedTtsLanguageDisplay(): string {
    return this.voiceForm.get('textToSpeechLanguage')?.value ?? 'English';
  }

  
  addSttLanguage(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const langToAdd = select.value;

    if (langToAdd && !this.selectedSttLanguages.includes(langToAdd)) {
      this.selectedSttLanguages.push(langToAdd);
    }
    select.value = ''; 
  }

  removeSttLanguage(langToRemove: string): void {
    this.selectedSttLanguages = this.selectedSttLanguages.filter(lang => lang !== langToRemove);
  }

  
  saveSettings(): void {
    
    const formData = this.voiceForm.getRawValue();

    const settingsToSave = {
        speechToText: {
            enabled: formData.enableSpeechToText,
            languages: this.selectedSttLanguages
        },
        textToSpeech: {
            enabled: formData.enableTextToSpeech,
            language: formData.textToSpeechLanguage,
            voice: formData.textToSpeechVoice,
            sendTranscript: formData.sendTextMessage
        }
    };

    console.log('Saving settings:', settingsToSave);
    alert('Settings saved! Check the browser console for the complete data object.');
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}