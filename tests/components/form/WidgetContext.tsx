/**
 * @jest-environment jsdom
 */
import React from 'react';

import { Client } from '@reachfive/identity-core';

import { ConfigProvider } from '../../../src/contexts/config';
import { I18nProvider, type I18nMessages } from '../../../src/contexts/i18n';
import { ReachfiveProvider } from '../../../src/contexts/reachfive';
import { ThemeProvider } from '../../../src/contexts/theme';

import type { Config } from '../../../src/types';
import type { ThemeOptions } from '../../../src/types/theme';

const themeOptions: ThemeOptions = {
    primaryColor: '#ff0000',
    spacing: 20,
    input: {
        borderWidth: 1,
        paddingX: 16,
        paddingY: 8,
    },
};

export function WidgetContext({
    children,
    // @ts-expect-error partial Client
    client = {},
    config,
    defaultMessages = {},
}: React.PropsWithChildren<{
    client?: Client;
    config: Config;
    defaultMessages: I18nMessages;
}>) {
    return (
        <ConfigProvider config={config}>
            <ReachfiveProvider client={client}>
                <ThemeProvider options={themeOptions}>
                    <I18nProvider defaultMessages={defaultMessages} locale={config.language}>
                        {children}
                    </I18nProvider>
                </ThemeProvider>
            </ReachfiveProvider>
        </ConfigProvider>
    );
}
