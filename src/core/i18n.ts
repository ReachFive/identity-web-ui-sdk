export type I18nMessages = Record<string, string>

export type I18nNestedMessages = Record<string, string | I18nMessages>

export type I18nMessageParams = Record<string, unknown>

export type I18nResolver = (key: string, params?: I18nMessageParams, fallback?: (params?: I18nMessageParams) => string) => string

export function resolveI18n<T extends (Record<string, T> | string)>(defaultMessages: I18nMessages = {}, messages: I18nNestedMessages = {}): I18nResolver {
    const mergedMessages: I18nMessages = {
        ...defaultMessages,
        ...flattenObject(messages)
    };

    return (key: string, params?: I18nMessageParams, fallback?: (params?: I18nMessageParams) => string) => {
        const template = mergedMessages[key] ?? fallback?.(params) ?? key;

        return params
            ? Object.keys(params).reduce((acc, param) => acc.replace(`{${param}}`, params[param] as string), template)
            : template;
    };
}

export default resolveI18n

function flattenObject(object: I18nNestedMessages | string, prefix: string[] = []): Record<string, string> {
    return typeof object === "object" && object !== null
        ? Object.keys(object).reduce((acc, key) => ({
            ...acc,
            ...flattenObject(object[key], [...prefix, key])
        }), {})
        : ({ [prefix.join('.')]: object });
}
