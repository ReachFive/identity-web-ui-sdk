import React, { PropsWithChildren } from 'react';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';

import i18n, { Resource, ResourceKey, TFunction } from 'i18next';

export type I18nMessages = Record<string, ResourceKey>;

export interface Props {
    defaultMessages?: I18nMessages;
    messages?: I18nMessages;
    locale: string;
}

export type WithI18n<T> = T & { i18n: TFunction };

export function useI18n(): TFunction {
    const { t } = useTranslation();
    return t;
}

/**
 * Writes a language code the way i18next does (`FR` → `fr`, `fr-fr` → `fr-FR`), so that the
 * resources are stored under the code i18next looks up. A code that is not BCP 47 (`en_US`) is
 * kept as is, as i18next does.
 */
function canonicalLocale(code: string): string {
    try {
        return Intl.getCanonicalLocales(code)[0] ?? code;
    } catch {
        return code;
    }
}

/**
 * `messages` holds either the translations of `locale`, or translations keyed by language.
 */
function localizedResources(messages: I18nMessages, lng: string): Resource {
    const isKeyedByLanguage = Object.keys(messages).some(key => canonicalLocale(key) === lng);
    if (!isKeyedByLanguage) return { [lng]: { translation: messages } };

    return Object.fromEntries(
        Object.entries(messages).map(([language, translation]) => [
            canonicalLocale(language),
            { translation },
        ])
    );
}

export function I18nProvider({
    children,
    defaultMessages = {},
    messages = {},
    locale,
}: PropsWithChildren<Props>): JSX.Element | null {
    const lng = canonicalLocale(locale);
    const instance = i18n.createInstance();
    instance.use(initReactI18next).init(
        {
            lng,
            interpolation: {
                escapeValue: false, // react already safes from xss,
                prefix: '{',
                suffix: '}',
            },
            fallbackLng: 'default',
            // An empty custom message hides the text instead of showing the default one.
            returnEmptyString: true,
            resources: {
                default: {
                    translation: defaultMessages,
                },
                ...localizedResources(messages, lng),
            },
        },
        err => {
            if (err) {
                console.error(err);
                return;
            }
        }
    );

    return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
