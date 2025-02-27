import React, { ComponentProps, ComponentType } from 'react';
import { expect } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import nock from 'nock';

import type { Client, Config as CoreConfig } from '@reachfive/identity-core';

import { type I18nMessages } from '../../src/core/i18n';
import type { Config } from '../../src/types';
import { ReachfiveProvider } from '../../src/contexts/reachfive';
import { buildTheme } from '../../src/core/theme';
import { type Theme } from '../../src/types/styled';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import { I18nProvider } from '../../src/contexts/i18n';

export const coreConfig: CoreConfig = {
    clientId: 'local',
    domain: 'local.reach5.net',
}

export const defaultConfig: Config = {
    ...coreConfig,
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google'],
    customFields: [],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: true,
    mfaEmailEnabled: true,
    rbaEnabled: false,
    consentsVersions: {
        aConsent: {
            key: 'aConsent',
            versions: [{
                versionId: 1,
                title: 'consent title',
                description: 'consent description',
                language: 'fr',
            }],
            consentType: 'opt-in',
            status: 'active'
        }
    },
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    }
};

export function componentGenerator<Component extends ComponentType<any>>(
    Component: Component,
    coreClient: Client,
    defaultI18n: I18nMessages = {},
) {
    return async (options: ComponentProps<Component>, config: Partial<Config> = {}, waitCallback?: () => void) => {
        const remoteSettings = { ...defaultConfig, ...config }

        const consentsInterceptor = nock(`https://${remoteSettings.domain}`)
            .persist()
            .get(/\/identity\/v1\/config\/consents/)
            .reply(200, remoteSettings.consentsVersions)

        const i18nInterceptor = nock(remoteSettings.resourceBaseUrl)
            .persist()
            .get(/\/[a-z]+\.json$/)
            .reply(200, defaultI18n)

            
        const client = {
            ...coreClient,
            remoteSettings: Promise.resolve(remoteSettings),
        }
        
        const widget = (
            // <ReachfiveProvider client={apiClient} config={{ ...defaultConfig, ...config }} i18n={defaultI18n}>
            <ReachfiveProvider client={client} config={coreConfig} fallback={<p>Loading...</p>}>
                <Component {...options} />
            </ReachfiveProvider>
        )
    
        const result = render(widget);

        await waitFor(() => expect(consentsInterceptor.isDone()).toBeTruthy())
        await waitFor(() => expect(i18nInterceptor.isDone()).toBeTruthy())

        // wait for suspense
        waitCallback
            ? await waitFor(waitCallback)
            : await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument())

        return result
    }  
};

export function snapshotGenerator<Component extends ComponentType<any>>(
    Component: Component,
    coreClient: Client,
    defaultI18n: I18nMessages = {},
) {
    const generateComponent = componentGenerator(Component, coreClient, defaultI18n)

    return (options: ComponentProps<Component>, config: Partial<Config> = {}) => async () => {
        const { container } = await generateComponent(options, config);
        expect(container).toMatchSnapshot();
    };
}

export async function renderWithContext(
    children: React.ReactNode,
    // @ts-expect-error partial Client
    coreClient?: Client = {},
    config: Config,
    defaultI18n?: I18nMessages = {}
) {
    const theme: Theme = buildTheme()

    const WidgetWithContext = () => (
        <StyleSheetManager>
            <ThemeProvider theme={theme}>
                <I18nProvider defaultMessages={defaultI18n}>
                    {children}
                </I18nProvider>
            </ThemeProvider>
        </StyleSheetManager>
    )

    const generateComponent = componentGenerator(WidgetWithContext, coreClient, defaultI18n)
    return await generateComponent({}, config)
}
