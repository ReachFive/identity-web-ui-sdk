import isPlainObject from 'lodash-es/isPlainObject';

export default function resolveI18n(defaultMessages, messages = {}) {
    const mergedMessages = {
        ...defaultMessages,
        ...flattenObject(messages)
    };

    return (key, params) => {
        const template = mergedMessages[key] || key;

        return params
            ? Object.keys(params).reduce((acc, param) => acc.replace(`{${param}}`, params[param]), template)
            : template;
    };
}

function flattenObject(object, prefix = []) {
    return isPlainObject(object)
        ? Object.keys(object).reduce((acc, key) => ({
            ...acc,
            ...flattenObject(object[key], [...prefix, key])
        }), {})
        : ({ [prefix.join('.')]: object });
}
