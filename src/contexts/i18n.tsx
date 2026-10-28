import React, { PropsWithChildren } from 'react';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';

import i18n, { ResourceKey, TFunction } from 'i18next';

export type I18nMessages = Record<string, ResourceKey>;

const TRANSLATION_NS = 'translation';
const DEFAULT_NS = 'default';

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

export function I18nProvider({
    children,
    defaultMessages = {},
    messages = {},
    locale,
}: PropsWithChildren<Props>): JSX.Element | null {
    const instance = i18n.createInstance();
    // `messages` is either keyed by language or holds the messages of `locale` directly.
    const translations = (locale in messages ? messages : { [locale]: messages }) as Record<
        string,
        I18nMessages
    >;
    instance.use(initReactI18next).init(
        {
            lng: locale,
            interpolation: {
                escapeValue: false, // react already safes from xss,
                prefix: '{',
                suffix: '}',
            },
            fallbackLng: 'dev',
            // Default messages live in their own namespace under the configured language (not
            // under a pseudo-language), so plural forms follow that language's rules.
            ns: [TRANSLATION_NS, DEFAULT_NS],
            defaultNS: TRANSLATION_NS,
            fallbackNS: DEFAULT_NS,
            resources: {
                ...Object.fromEntries(
                    Object.entries(translations).map(([language, translation]) => [
                        language,
                        { [TRANSLATION_NS]: translation },
                    ])
                ),
                [locale]: { [TRANSLATION_NS]: translations[locale], [DEFAULT_NS]: defaultMessages },
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
