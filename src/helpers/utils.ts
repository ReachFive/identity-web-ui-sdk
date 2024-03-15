// import { LoginWithWebAuthnParams } from '@reachfive/identity-core';
// import { LoginWithPasswordParams } from '@reachfive/identity-core/es/main/oAuthClient'
import { LoginWithPasswordParams, LoginWithWebAuthnParams } from '@reachfive/identity-core';
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

export type Identifier = { identifier: string }
export type EmailIdentifier = { email: string }
export type PhoneNumberIdentifier = { phoneNumber: string }
export type CustomIdentifier = { customIdentifier: string }
export type SpecializedIdentifier = EmailIdentifier | PhoneNumberIdentifier | CustomIdentifier

type IdentifierLoginPassword = { identifier: string } & Omit<LoginWithPasswordParams, 'email' | 'phoneNumber' | 'customIdentifier'>
type IdentifierLoginWithWebAuthn = { identifier: string } & Omit<LoginWithWebAuthnParams, 'email' | 'phoneNumber'>

type IdentifierData<T extends LoginWithPasswordParams | LoginWithWebAuthnParams> =
    T extends LoginWithPasswordParams
        ? LoginWithPasswordParams | IdentifierLoginPassword
        : LoginWithWebAuthnParams | IdentifierLoginWithWebAuthn

export const specializeIdentifier = (identifier: string): SpecializedIdentifier =>
    isValidEmail(identifier)
        ? { email: identifier } 
        : libphonenumber.isValidNumber(identifier) 
            ? { phoneNumber: identifier.replace(/\s+/g, '') }
            : { customIdentifier: identifier }

export function specializeIdentifierData<T extends LoginWithPasswordParams | LoginWithWebAuthnParams>(data: IdentifierData<T>): T {
    if ('identifier' in data && typeof data.identifier === 'string') {
        const { identifier, ...rest } = data as IdentifierLoginPassword | IdentifierLoginWithWebAuthn;
        const specializedIdentifier = specializeIdentifier(identifier);
        return { ...specializedIdentifier, ...rest } as T;
    }
    return data as T;
}

export function isValidEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
}

export function camelCase(string: string) {
    return string
    .replace(/((?<![A-Z])[A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/[^a-z0-9]/ig, ' ')
    .trim()
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

export function snakeCase(string: string) {
    const matches = string.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+|[A-Z]|[0-9]+/g) 
    return matches ? matches.map(s => s.toLowerCase()).join('_') : '';
}


export function isEmpty(value: unknown) {
    if (value == null) {
        return true;
    }
    if (Array.isArray(value) || typeof value == 'string' || Buffer.isBuffer(value)) {
        return !value.length;
    }
    for (const key in value) {
        if (Object.hasOwnProperty.call(value, key)) {
            return false;
        }
    }
    return true;
}

export function isEqual<T>(arr1: T[], arr2: T[]) {
    return arr1.length === arr2.length && arr1.every(x => arr2.includes(x))
}

export function difference<T>(arr1: T[], arr2: T[]) {
    return arr1.filter(x => !arr2.includes(x))
}

export function intersection<T>(arr1: T[], ...args: T[][]) {
    return arr1.filter(item => args.every(arr => arr.includes(item)))
}

export function find<T>(collection: Record<string, T>, predicate: (item: T) => boolean) {
    return Object.values(collection ?? {}).find(value => predicate(value))
}

export function debounce(func: (...args: unknown[]) => void, delay: number, { leading }: { leading?: boolean } = {}) {
    let timerId: NodeJS.Timeout
  
    return (...args: unknown[]) => {
      if (!timerId && leading) {
        func(...args)
      }
      clearTimeout(timerId)
  
      timerId = setTimeout(() => func(...args), delay)
    }
  }
