/**
 * @jest-environment jest-fixed-jsdom
 */
import React, { useEffect } from 'react';

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import 'jest-styled-components';
import nock from 'nock';

import { Client, Config } from '@reachfive/identity-core';

import { ReachfiveProvider, useReachfive } from '@/contexts/reachfive';

import { defaultConfig } from '../widgets/renderer';

function Consumer() {
    const { client, config } = useReachfive();

    useEffect(() => {
        const requets = async () => await client.getSessionInfo();
        requets();
    }, []);

    return (
        <>
            <p>{config.domain}</p>
            <p>{config.language}</p>
            <p>
                providers:{' '}
                {config.socialProviders.map(provider => (
                    <span key={provider}>{provider}</span>
                ))}
            </p>
            <dl>
                {Object.entries(config.consentsVersions).map(([key, consent]) => (
                    <React.Fragment key={key}>
                        <dt>{key}</dt>
                        <dd>{consent.consentType}</dd>
                    </React.Fragment>
                ))}
            </dl>
        </>
    );
}

describe('ReachfiveProvider', () => {
    const getSessionInfo = jest
        .fn<Client['getSessionInfo']>()
        .mockResolvedValue({ isAuthenticated: true });

    // @ts-expect-error partial Client
    const client: Client = {
        getSessionInfo,
        get remoteSettings() {
            return Promise.resolve(defaultConfig);
        },
    };

    const remoteSettingsSpy = jest
        .spyOn(client, 'remoteSettings', 'get')
        .mockResolvedValue(defaultConfig);

    let frConsentsInterceptor: nock.Scope;
    let esConsentsInterceptor: nock.Scope;
    let frI18nInterceptor: nock.Scope;
    let esI18nInterceptor: nock.Scope;

    beforeEach(() => {
        frConsentsInterceptor = nock(`https://${defaultConfig.domain}`)
            .persist()
            .get(/\/identity\/v1\/config\/consents/)
            .query({ lang: 'fr' })
            .reply(200, defaultConfig.consentsVersions);

        esConsentsInterceptor = nock(`https://${defaultConfig.domain}`)
            .persist()
            .get(/\/identity\/v1\/config\/consents/)
            .query({ lang: 'es' })
            .reply(200, defaultConfig.consentsVersions);

        frI18nInterceptor = nock(defaultConfig.resourceBaseUrl)
            .persist()
            .get(/\/fr\.json$/)
            .reply(200, {
                sample: "Texte d'exemple",
            });

        esI18nInterceptor = nock(defaultConfig.resourceBaseUrl)
            .persist()
            .get(/\/es\.json$/)
            .reply(200, {
                sample: 'Texto de ejemplo',
            });
    });

    afterEach(() => {
        nock.cleanAll();
        remoteSettingsSpy.mockClear();
        getSessionInfo.mockClear();
    });

    test('should load settings before rendering children', async () => {
        const config: Config = {
            clientId: defaultConfig.clientId,
            domain: defaultConfig.domain,
        };

        render(
            <ReachfiveProvider client={client} config={config}>
                <Consumer />
            </ReachfiveProvider>
        );

        expect(remoteSettingsSpy).toBeCalled();
        await waitFor(() => expect(frConsentsInterceptor.isDone()).toBeTruthy());
        await waitFor(() => expect(frI18nInterceptor.isDone()).toBeTruthy());

        await waitFor(() => expect(getSessionInfo).toBeCalled());

        expect(screen.getByText(config.domain)).toBeInTheDocument();
        expect(screen.getByText(defaultConfig.language)).toBeInTheDocument();
        expect(screen.getByText(defaultConfig.socialProviders[0])).toBeInTheDocument();
        expect(screen.getByText(defaultConfig.consentsVersions.aConsent.key)).toBeInTheDocument();
    });

    test('should load settings before rendering children with custom language', async () => {
        const config: Config = {
            clientId: defaultConfig.clientId,
            domain: defaultConfig.domain,
            language: 'es',
        };

        render(
            <ReachfiveProvider client={client} config={config}>
                <Consumer />
            </ReachfiveProvider>
        );

        await waitFor(() => expect(remoteSettingsSpy).toBeCalled());
        await waitFor(() => expect(esConsentsInterceptor.isDone()).toBeTruthy());
        await waitFor(() => expect(esI18nInterceptor.isDone()).toBeTruthy());

        await waitFor(() => expect(getSessionInfo).toBeCalled());

        expect(screen.getByText(config.domain)).toBeInTheDocument();
        expect(screen.getByText('es')).toBeInTheDocument();
        expect(screen.getByText(defaultConfig.socialProviders[0])).toBeInTheDocument();
        expect(screen.getByText(defaultConfig.consentsVersions.aConsent.key)).toBeInTheDocument();
    });
});
