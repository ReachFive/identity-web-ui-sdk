/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import renderer from 'react-test-renderer';
import 'jest-styled-components';

import profileEditorWidget from '../../../src/widgets/profileEditor/profileEditorWidget';

const defaultConfig = {
    domain: 'local.reach5.net'
};

describe('Snapshot', () => {
    const generateSnapshot = (options, user, config = defaultConfig) => () => {
        const apiClient = {
            getUser: jest.fn().mockReturnValueOnce(Promise.resolve(user))
        };

        const tree = profileEditorWidget(
            { ...options, accessToken: 'azerty' },
            { config, apiClient }
        ).then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('profile editor', () => {
        test('basic',
            generateSnapshot(
                {
                    fields: [
                        'given_name',
                        'family_name'
                    ]
                },
                {
                    given_name: 'John',
                    family_name: 'Do'
                }
            )
        );
    });
})
