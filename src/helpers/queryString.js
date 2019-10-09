import { camelCaseProperties } from './transformObjectProperties';

export function parseQueryString(value) {
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
