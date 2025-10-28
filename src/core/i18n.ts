export type I18nMessages = Record<string, string>;

export type I18nNestedMessages = Record<string, string | I18nMessages>;

export type I18nLocalizedMessages = Record<string, I18nNestedMessages>;

export type I18nMessageParams = Record<string, unknown>;

export type I18nResolver = (
    key: string,
    params?: I18nMessageParams | I18nLocalizedMessages,
    fallback?: (params?: I18nMessageParams) => string
) => string;

function isI18nLocalizedMessages(
    messages: I18nNestedMessages | I18nLocalizedMessages,
    locale?: string
): messages is I18nLocalizedMessages {
    return (
        typeof locale === 'string' &&
        typeof messages === 'object' &&
        messages !== null &&
        Object.entries(messages).every(
            ([_, value]) => typeof value === 'object' && value !== null
        ) &&
        typeof messages[locale] !== 'undefined'
    );
}

export function resolveI18n<T extends Record<string, T> | string>(
    defaultMessages: I18nMessages = {},
    messages: I18nNestedMessages | I18nLocalizedMessages = {},
    locale?: string
): I18nResolver {
    const flattenedMessages: I18nMessages =
        locale && isI18nLocalizedMessages(messages, locale)
            ? flattenObject(messages[locale])
            : flattenObject(messages as I18nNestedMessages);

    const mergedMessages: I18nMessages = {
        ...defaultMessages,
        ...flattenedMessages,
    };

    return (
        key: string,
        params?: I18nMessageParams,
        fallback?: (params?: I18nMessageParams) => string
    ) => {
        const template = mergedMessages[key] ?? fallback?.(params) ?? key;

        return params
            ? Object.keys(params).reduce(
                  (acc, param) => acc.replace(`{${param}}`, params[param] as string),
                  template
              )
            : template;
    };
}

export default resolveI18n;

function flattenObject(
    object: I18nNestedMessages | I18nMessages | string,
    prefix: string[] = []
): I18nMessages {
    return typeof object === 'object' && object !== null
        ? Object.keys(object).reduce(
              (acc, key) => ({
                  ...acc,
                  ...flattenObject(object[key], [...prefix, key]),
              }),
              {}
          )
        : { [prefix.join('.')]: object };
}
