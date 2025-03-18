import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { Client } from '@reachfive/identity-core';

import {I18nMessages} from "../../../src/core/i18n";
import TrustedDevicesWidget from "../../../src/widgets/mfa/trustedDevicesWidget";
import {AppError} from "../../../src/helpers/errors";
import { componentGenerator } from "../renderer";

const defaultI18n: I18nMessages = {}

describe('DOM testing', () => {
    const listTrustedDevices = jest.fn<Client['listTrustedDevices']>()

    const onError = jest.fn()
    const onSuccess = jest.fn()

    beforeEach(() => {
        onError.mockClear()
        onSuccess.mockClear()
        listTrustedDevices.mockClear()
    })

    // @ts-expect-error partial Client
    const apiClient: Client = {
        listTrustedDevices,
    }

    const generateComponent = componentGenerator(TrustedDevicesWidget, apiClient, defaultI18n)

    describe('trustedDevices', () => {
            test('no trusted device', async () => {
                listTrustedDevices.mockResolvedValue({ trustedDevices: []})
                await generateComponent({ accessToken: 'azerty', onError, onSuccess, showRemoveTrustedDevice: true });

                expect(screen.queryByText('trustedDevices.empty')).toBeInTheDocument();
            });

            test('has trusted devices',  async () => {
                listTrustedDevices.mockResolvedValue({ trustedDevices: [
                        {id: 'id1', userId: 'userid1', createdAt: '2022-09-21', metadata: {}},
                        {id: 'id2', userId: 'userid2', createdAt: '2022-09-21', metadata: {}},
                        {id: 'id3', userId: 'userid3', createdAt: '2022-09-21', metadata: {}}
                    ]})
                await generateComponent({ accessToken: 'azerty', onError, onSuccess, showRemoveTrustedDevice: true });

                const trustedDevices = screen.queryAllByTestId('trustedDevice')
                expect(trustedDevices).toHaveLength(3)

                expect(onSuccess).toBeCalled()
                expect(onError).not.toBeCalled()
            });

            test('api error', async () => {
                const error: AppError = { errorId: '0', error: 'unexpected_error', errorDescription: "Unexpected error"}
                listTrustedDevices.mockRejectedValue(error)

                await generateComponent({ accessToken: 'azerty', onError, onSuccess })
                expect(onSuccess).not.toBeCalled()
                expect(onError).toBeCalledWith(error)
            })
    });
});
