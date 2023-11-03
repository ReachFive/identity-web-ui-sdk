/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import renderer from 'react-test-renderer';
import 'jest-styled-components';

import mfaListWidget from '../../../src/widgets/mfa/mfaListWidget';

const defaultConfig = { domain: 'local.reach5.net', language: 'fr' };

describe('Snapshot', () => {
    const generateSnapshot = ({ options = {}, config = defaultConfig, credentials }) => () => {
        const apiClient = {
            listMfaCredentials: jest.fn().mockReturnValueOnce(Promise.resolve({ credentials }))
        };

        const tree = mfaListWidget(
            { ...options, accessToken: 'azerty' },
            { config, apiClient }
        ).then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    test('empty', generateSnapshot({ credentials: []}))

    test('basic', generateSnapshot({ credentials: [
        { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
        { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' }
    ]}))
})
