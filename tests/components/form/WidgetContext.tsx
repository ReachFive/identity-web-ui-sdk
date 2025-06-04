/**
 * @jest-environment jsdom
 */

import { Client } from '@reachfive/identity-core';
import React from 'react';
import { ThemeProvider } from 'styled-components';

import { ConfigProvider } from '../../../src/contexts/config';
import { I18nProvider } from '../../../src/contexts/i18n';
import { ReachfiveProvider } from '../../../src/contexts/reachfive';
import { type I18nMessages } from '../../../src/core/i18n';
import { buildTheme } from '../../../src/core/theme';
import type { Config } from '../../../src/types';
import type { Theme } from '../../../src/types/styled';

const theme: Theme = buildTheme({
    primaryColor: '#ff0000',
    spacing: 20,
    input: {
        borderWidth: 1,
        paddingX: 16,
        paddingY: 8,
        height: 40,
    },
});

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
                <ThemeProvider theme={theme}>
                    <I18nProvider defaultMessages={defaultMessages}>{children}</I18nProvider>
                </ThemeProvider>
            </ReachfiveProvider>
        </ConfigProvider>
    );
}
