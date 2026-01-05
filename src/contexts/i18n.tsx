import React, { PropsWithChildren } from 'react';
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next';

import i18n, { ResourceKey, TFunction } from 'i18next';

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

export function I18nProvider({
    children,
    defaultMessages = {},
    messages = {},
    locale,
}: PropsWithChildren<Props>): JSX.Element | null {
    const instance = i18n.createInstance();
    instance.use(initReactI18next).init(
        {
            lng: locale,
            interpolation: {
                escapeValue: false, // react already safes from xss,
                prefix: '{',
                suffix: '}',
            },
            fallbackLng: ['default', 'dev'],
            resources: {
                default: {
                    translation: defaultMessages,
                },
                ...(locale in messages
                    ? Object.fromEntries(
                          Object.entries(messages).map(([language, translation]) => [
                              language,
                              { translation },
                          ])
                      )
                    : { [locale]: { translation: messages } }),
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
