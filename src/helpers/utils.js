import isObject from 'lodash-es/isObject';
import * as libphonenumber from 'libphonenumber-js';


export function format(sFormat) {
    for (var i = 0; i < arguments.length - 1; i++) {
        if (arguments[i + 1] != null) {
            sFormat = sFormat.split('{' + i + '}').join(arguments[i + 1]);
        }
    }

    return sFormat;
}

const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function getRandomToken(length = 8) {
    const buf = [];

    for (let i = 0; i < length; i++) {
        buf.push(CHARS[getRandomInt(0, CHARS.length)]);
    }

    return buf.join('');
}

export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/* Returns whether a form value has been set with a valid value.
* If the user's input has been enriched as an object, raw input is expected
* to be in a raw property field (named 'raw' by default).
*/
export function isValued(v, rawProperty = 'raw') {
    const unwrap = isObject(v) ? v[rawProperty] : v;
    return (
        unwrap !== null &&
        unwrap !== undefined &&
        unwrap !== '' &&
        !Number.isNaN(unwrap) &&
        (Array.isArray(unwrap) ? unwrap.length > 0 : true)
    )
}

export function formatISO8601Date(year, month, day) {
    if (isValued(year) && isValued(month) && isValued(day)) {
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    return null
}

export function specializeIdentifierData(data) {
    return data.identifier ?
        {
            ...data,
            identifier: undefined,
            ...(isValidEmail(data.identifier)) ? {email: data.identifier} : libphonenumber.isValidNumber(data.identifier) ? {phoneNumber: data.identifier.replace(/\s+/g, '')}: {customIdentifier: data.identifier},
            customIdentifier: data.customIdentifier
        }
        : data
}

export function isValidEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
}
