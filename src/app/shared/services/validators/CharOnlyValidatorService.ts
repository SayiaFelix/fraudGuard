import {AbstractControl, ValidationErrors} from '@angular/forms';

export class CharOnlyValidatorService {

    constructor() {
    }

    static mustNotHaveNumbers(control: AbstractControl): ValidationErrors | null {
        // tslint:disable-next-line:max-line-length
        const STRING_REGEXP = /^([^0-9]*)$/;
        const content = control.value as string;


        console.log('must not have numbers.');
        console.log(content && content !== '' && (!STRING_REGEXP.test(content)));

        if (content && content !== '' && (!STRING_REGEXP.test(content))) {
            return { noNumbers: true };
        } else {
            return null;
        }

    }

    static mustNotHaveNumbersInTable(control: string): ValidationErrors | null {
        // tslint:disable-next-line:max-line-length
        const STRING_REGEXP = /^([^0-9]*)$/;
        const content = control as string;


        console.log('must not have numbers.');
        console.log(content && content !== '' && (!STRING_REGEXP.test(content)));

        if (content && content !== '' && (!STRING_REGEXP.test(content))) {
            return { noNumbers: true };
        } else {
            return null;
        }

    }



}
