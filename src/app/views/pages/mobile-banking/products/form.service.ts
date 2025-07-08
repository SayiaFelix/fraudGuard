import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private formData: any = {};

  setFormData(questionId: string, optionId: string, value: any): void {
    if (!this.formData[questionId]) {
      this.formData[questionId] = {};
    }
    this.formData[questionId][optionId] = value;
  }

  getFormData(): any {
    return this.formData;
  }
}

