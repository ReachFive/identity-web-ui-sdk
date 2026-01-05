import { intlFormat } from 'date-fns';
import * as libphonenumber from 'libphonenumber-js';

import {
    AuthResult,
    LoginWithPasswordParams,
    LoginWithWebAuthnParams,
} from '@reachfive/identity-core';

import type { AuthType, IdentifierType, LoginEventWrappingObject } from '../types';

const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function getRandomToken(length = 8) {
    const buf = [];

    for (let i = 0; i < length; i++) {
        buf.push(CHARS[getRandomInt(0, CHARS.length)]);
    }

    return buf.join('');
}

export function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
}

export type FormValue<T, K extends string = 'raw'> = T | RichFormValue<T, K>;
export type RichFormValue<T, K extends string = 'raw'> = Record<K, T>;

export function isRichFormValue<T, K extends string = 'raw'>(
    value: FormValue<T, K> | undefined,
    rawProperty: K = 'raw' as K
): value is RichFormValue<T, K> {
    return value !== null && typeof value === 'object' && rawProperty in value;
}

/* Returns whether a form value has been set with a valid value.
 * If the user's input has been enriched as an object, raw input is expected
 * to be in a raw property field (named 'raw' by default).
 */
export function isValued<T, K extends string = 'raw'>(
    value?: FormValue<T, K>,
    rawProperty: K = 'raw' as K
): value is NonNullable<FormValue<NonNullable<T>, K>> {
    const unwrap = isRichFormValue(value, rawProperty) ? value[rawProperty] : value;
    return (
        unwrap !== null &&
        unwrap !== undefined &&
        unwrap !== '' &&
        !Number.isNaN(unwrap) &&
        (Array.isArray(unwrap) ? unwrap.length > 0 : true)
    );
}

export function formatISO8601Date(
    year: string | number,
    month: string | number,
    day: string | number
) {
    if (isValued(year) && isValued(month) && isValued(day)) {
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    return null;
}

export function dateFormat(dateString: string, locales: string) {
    return intlFormat(new Date(dateString), { timeZone: 'UTC' }, { locale: locales });
}

export type Identifier = { identifier: string };
export type EmailIdentifier = { email: string };
export type PhoneNumberIdentifier = { phoneNumber: string };
export type CustomIdentifier = { customIdentifier: string };
export type SpecializedIdentifier = EmailIdentifier | PhoneNumberIdentifier | CustomIdentifier;

export const isCustomIdentifier = (
    identifier: SpecializedIdentifier | Record<string, unknown>
): identifier is CustomIdentifier => 'customIdentifier' in identifier;

type IdentifierLoginPassword = { identifier: string } & Omit<
    LoginWithPasswordParams,
    'email' | 'phoneNumber' | 'customIdentifier'
>;
type IdentifierLoginWithWebAuthn = { identifier: string } & Omit<
    LoginWithWebAuthnParams,
    'email' | 'phoneNumber'
>;

type IdentifierData<T extends LoginWithPasswordParams | LoginWithWebAuthnParams> =
    T extends LoginWithPasswordParams
        ? LoginWithPasswordParams | IdentifierLoginPassword
        : LoginWithWebAuthnParams | IdentifierLoginWithWebAuthn;

export function enrichLoginEvent<T extends LoginWithPasswordParams | LoginWithWebAuthnParams>(
    authResult: AuthResult,
    authType: AuthType,
    data?: T
): LoginEventWrappingObject {
    switch (authType) {
        case 'password':
        case 'webauthn': {
            const identifierType: IdentifierType =
                data != undefined
                    ? 'email' in data
                        ? 'email'
                        : 'phoneNumber' in data
                          ? 'phone_number'
                          : 'custom_identifier'
                    : 'email';
            return { authResult, authType, identifierType };
        }
        default:
            return { authResult, authType };
    }
}

export const specializeIdentifier = (identifier: string): SpecializedIdentifier =>
    isValidEmail(identifier)
        ? { email: identifier }
        : libphonenumber.isValidNumber(identifier)
          ? { phoneNumber: identifier.replace(/\s+/g, '') }
          : { customIdentifier: identifier };

export function specializeIdentifierData<
    T extends LoginWithPasswordParams | LoginWithWebAuthnParams,
>(data: IdentifierData<T>): T {
    if ('identifier' in data && typeof data.identifier === 'string') {
        const { identifier, ...rest } = data;
        const specializedIdentifier = specializeIdentifier(identifier);
        return { ...specializedIdentifier, ...rest } as unknown as T;
    }
    return data as T;
}

export function isValidEmail(email: string) {
    return /\S+@\S+\.\S+/.test(email);
}

export type CamelCase<T extends string> = T extends `${infer U}_${infer V}`
    ? `${U}${CamelCase<Capitalize<V>>}`
    : T;

export function camelCase<T extends string>(string: T) {
    return string
        .replace(/([^A-Z])([A-Z])/g, '$1 $2') // "aB" become "a B"
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, ' ')
        .trim()
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
}

export type SnakeCase<S extends string> = S extends `${infer T}${infer U}`
    ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${SnakeCase<U>}`
    : S;

export function snakeCase<T extends string>(string: T) {
    const matches = string.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+|[A-Z]|[0-9]+/g);
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
    return arr1.length === arr2.length && arr1.every(x => arr2.includes(x));
}

export function difference<T>(arr1: T[], arr2: T[]) {
    return arr1.filter(x => !arr2.includes(x));
}

export function intersection<T>(arr1: T[], ...args: T[][]) {
    return arr1.filter(item => args.every(arr => arr.includes(item)));
}

export function find<T>(collection: Record<string, T>, predicate: (item: T) => boolean) {
    return Object.values(collection ?? {}).find(value => predicate(value));
}

export function debounce<T extends unknown[]>(
    func: (...args: T) => void,
    delay: number,
    { leading }: { leading?: boolean } = {}
) {
    let timerId: NodeJS.Timeout;

    return (...args: T) => {
        if (!timerId && leading) {
            func(...args);
        }
        clearTimeout(timerId);

        timerId = setTimeout(() => func(...args), delay);
    };
}
