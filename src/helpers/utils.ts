// import { LoginWithWebAuthnParams } from '@reachfive/identity-core';
// import { LoginWithPasswordParams } from '@reachfive/identity-core/es/main/oAuthClient'
import * as libphonenumber from 'libphonenumber-js';

const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function getRandomToken(length: number = 8) {
    const buf = [];

    for (let i = 0; i < length; i++) {
        buf.push(CHARS[getRandomInt(0, CHARS.length)]);
    }

    return buf.join('');
}

export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export type FormValue<T> = T | RichFormValue<T>
export type RichFormValue<T, K extends string = 'raw'> = { [P in K]: T }

/* Returns whether a form value has been set with a valid value.
* If the user's input has been enriched as an object, raw input is expected
* to be in a raw property field (named 'raw' by default).
*/
export function isValued<T>(v: FormValue<T>, rawProperty = 'raw') {
    const unwrap = v !== null && typeof v === 'object' ? (v as RichFormValue<T, typeof rawProperty>)[rawProperty] : v;
    return (
        unwrap !== null &&
        unwrap !== undefined &&
        unwrap !== '' &&
        !Number.isNaN(unwrap) &&
        (Array.isArray(unwrap) ? unwrap.length > 0 : true)
    )
}

export function formatISO8601Date(year: string | number, month: string | number, day: string | number) {
    if (isValued(year) && isValued(month) && isValued(day)) {
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    return null
}

// type LoginWithPasswordOptions = Omit<LoginWithPasswordParams, 'email' | 'phoneNumber' | 'customIdentifier'>
// type LoginWithWebAuthnOptions = Omit<LoginWithWebAuthnParams, 'email' | 'phoneNumber'>

export type Identifier = { identifier: string }
export type EmailIdentifier = { email: string }
export type PhoneNumberIdentifier = { phoneNumber: string }
export type CustomIdentifier = { customIdentifier: string }
export type SpecializedIdentifier = EmailIdentifier | PhoneNumberIdentifier | CustomIdentifier

export const isEmailIdentifier = (identifier: SpecializedIdentifier | Record<string, string>): identifier is EmailIdentifier => 'email' in identifier
export const isPhoneNumberIdentifier = (identifier: SpecializedIdentifier | Record<string, string>): identifier is PhoneNumberIdentifier => 'phoneNumber' in identifier
export const isCustomIdentifier = (identifier: SpecializedIdentifier | Record<string, string>): identifier is CustomIdentifier => 'customIdentifier' in identifier
export const isSpecializedIdentifier = (identifier: SpecializedIdentifier | Record<string, string>): identifier is SpecializedIdentifier =>
    isEmailIdentifier(identifier) || isPhoneNumberIdentifier(identifier) || isCustomIdentifier(identifier)


export type IdentifierData<Options> = Identifier &  Omit<Options, 'email' | 'phoneNumber' | 'customIdentifier'>
export type SpecializedIdentifierData<Options> = SpecializedIdentifier & Omit<Options, 'identifier' | 'email' | 'phoneNumber' | 'customIdentifier'>

export function specializeIdentifierData<Options>(data: IdentifierData<Options> | SpecializedIdentifierData<Options>): SpecializedIdentifierData<Options> {
    if ('identifier' in data) {
        const { identifier, ...dataWithoutIdentifier } = data
        return {
            ...dataWithoutIdentifier,
            ...(
                isValidEmail(identifier) ? { email: identifier } :
                libphonenumber.isValidNumber(identifier) ? { phoneNumber: identifier.replace(/\s+/g, '') } :
                { customIdentifier: identifier }
            ),
            ...('customIdentifier' in data ? { customIdentifier: data.customIdentifier } : {}),
        } as SpecializedIdentifierData<Options>
    }
    return data
}

export function isValidEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
}