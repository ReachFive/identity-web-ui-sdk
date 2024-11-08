/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import { render, waitFor } from '@testing-library/react';
import 'jest-styled-components';

import profileEditorWidget from '../../../src/widgets/profileEditor/profileEditorWidget';

const defaultConfig = {
    domain: 'local.reach5.net'
};

describe('Snapshot', () => {
    const generateSnapshot = (options, user, config = defaultConfig) => async () => {
        const apiClient = {
            getUser: jest.fn().mockReturnValueOnce(Promise.resolve(user))
        };

        const widget = await profileEditorWidget(
            { ...options, accessToken: 'azerty' },
            { config, apiClient }
        )

        await waitFor(async () => {
            const { container, rerender } = await render(widget);

            await waitFor(() => expect(apiClient.getUser).toHaveBeenCalled())
    
            await rerender(widget)

            expect(container).toMatchSnapshot();
        })
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
