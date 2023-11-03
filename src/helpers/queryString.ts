import { camelCaseProperties, snakeCaseProperties } from './transformObjectProperties';

export function parseQueryString(value: string) {
    const qs = value.split('&').reduce((acc, param) => {
        const [key, value = ''] = param.split('=');

        return key && key.length
            ? {
                ...acc,
                [key]: decodeURIComponent(value.replace(/\+/g, ' '))
            }
            : acc;
    }, {});

    return camelCaseProperties(qs);
}

export function toQueryString(obj: Record<string, string | number | boolean>, snakeCase = true) {
    const params = snakeCase ? snakeCaseProperties(obj) : obj;
    return Object
        .entries(params)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => value !== '' ? `${key}=${encodeURIComponent(value as string)}` : key)
        .join('&');
}
