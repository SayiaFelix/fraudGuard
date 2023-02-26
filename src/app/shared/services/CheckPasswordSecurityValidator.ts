import {AbstractControl, ValidationErrors} from '@angular/forms';

export class CheckPasswordSecurityValidator {

    // @ts-ignore
    static mustBeSecurePassword(control: AbstractControl): ValidationErrors | null {

        const untrimmedPassword = control.value as string;

        const password = untrimmedPassword.trim().replace(' ', '');

        const PASSWORD_REGEXP = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;


        if (password.length < 8) {

            return {
                insecurePassword: 'Error: Password must be at least 8 characters in length.'
            };

        } else if (!PASSWORD_REGEXP.test(password)) {
            return {
                insecurePassword: 'Error: Password must contain at least one uppercase letter, ' +
                    'one lowercase letter, one number, and one special character.'
            };
        } else {
            return null;
        }
    }

}
