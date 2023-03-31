import {AbstractControl, ValidationErrors} from '@angular/forms';


export class EmployeePhoneNumberValidators {

    // @ts-ignore
    static mustStartWith254(control: AbstractControl): ValidationErrors | null {


        // tslint:disable-next-line:max-line-length
        const PHONE_REGEXP = /^([254])[0-9]{11}/;
        const phoneNumber = control.value as string;


        
        if (phoneNumber && phoneNumber !== '' && (!PHONE_REGEXP.test(phoneNumber))) {
            if (phoneNumber.length!==12){
                return {
                    mustStartWith254:
                        {
                            phoneNumber,
                            error: 'Phone Number must have 12 numbers.'
                        }
                    }
                }

            return {
                mustStartWith254:
                    {
                        phoneNumber,
                        error: 'Phone Number must start with 254.'
                    }
            };
        } else {
            return null;
        }

    }

    static mustStartWith254TableCheck(control: string): ValidationErrors | null {


        // tslint:disable-next-line:max-line-length
        const PHONE_REGEXP = /^([254])[0-9]{11}/;
        const phoneNumber = control as string;



        if (phoneNumber && phoneNumber !== '' && (!PHONE_REGEXP.test(phoneNumber))) {

            return {
                mustStartWith254:
                    {
                        phoneNumber,
                        error: 'Phone Number must start with 254.'
                    }
            };
        } else {
            return null;
        }

    }

}
