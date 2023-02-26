import {AbstractControl, ValidationErrors} from '@angular/forms';

export class CompanyEmailValidator {

    // @ts-ignore
    static mustBeBusinessEmail(control: AbstractControl): ValidationErrors | null {

        // tslint:disable-next-line:max-line-length
        const EMAIL_REGEXP = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        const email = control.value as string;

        if (email && email !== '' && (email.length <= 5 || !EMAIL_REGEXP.test(email))) {
            return { mustBeCompanyEmail: {
                previousEmail: email,
                    error: 'This is not a valid email.'
                } };
        }

        return null;
    }

    static mustBeEmail(control: AbstractControl): ValidationErrors | null {

        // tslint:disable-next-line:max-line-length
        const EMAIL_REGEXP = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        const email = control.value as string;

        if (email && email !== '' && (email.length <= 5 || !EMAIL_REGEXP.test(email))) {
            return { mustBeCompanyEmail: {
                previousEmail: email,
                    error: 'This is not a business email.'
                } };
        }

        return null;
    }

    static mustBeEmailTableCheck(control: string): ValidationErrors | null {

        // tslint:disable-next-line:max-line-length
        const EMAIL_REGEXP = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        const email = control as string;

        if (email && email !== '' && (email.length <= 5 || !EMAIL_REGEXP.test(email))) {
            return { mustBeEmail: {
                previousEmail: email,
                    error: 'This is not a valid email.'
                } };
        }

        return null;
    }

}
