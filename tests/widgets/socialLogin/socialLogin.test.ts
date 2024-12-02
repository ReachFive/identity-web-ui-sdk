/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from '@jest/globals';
import renderer from 'react-test-renderer';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { I18nMessages } from '../../../src/core/i18n';
import { providers, type ProviderId } from '../../../src/providers/providers';
import { type Config } from '../../../src/types';

import socialLoginWidget from '../../../src/widgets/socialLogin/socialLoginWidget';

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google'],
    customFields: [],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
    consentsVersions: {},
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    }
};

const defaultI18n: I18nMessages = {}

describe('Snapshot', () => {
    const generateSnapshot = (options: Parameters<typeof socialLoginWidget>[0] = {}, config: Config = defaultConfig) => () => {
        const apiClient = {} as Client;

        const tree = socialLoginWidget(options, { config, apiClient, defaultI18n })
            .then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('social login', () => {
        test('basic',
            generateSnapshot()
        );
    });
})

describe('DOM testing', () => {
    const generateComponent = async (options: Parameters<typeof socialLoginWidget>[0] = {}, config: Config = defaultConfig) => {
        const result = await socialLoginWidget(options, { config, apiClient: {} as Client, defaultI18n });

        return render(result);
    };

    test('basic', async () => {
        await generateComponent({});

        defaultConfig.socialProviders.forEach((provider) => {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).toBeInTheDocument()
        })
    })

    test('themed', async () => {
        await generateComponent({
            theme: {
                primaryColor: '#ff0000',
            }
        });

        defaultConfig.socialProviders.forEach((provider) => {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).toBeInTheDocument()
        })
    })
})