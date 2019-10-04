import renderer from 'react-test-renderer';
import 'jest-styled-components';

import socialAccountsWidget from '../../../src/widgets/socialAccounts/socialAccountsWidget';

const defaultConfig = {
    domain: 'local.reach5.net',
    socialProviders: ['facebook', 'google']
};

describe('Snapshot', () => {
    const generateSnapshot = ({ options = {}, config = defaultConfig, socialIdentities }) => () => {
        const apiClient = {
            getUser: jest.fn().mockReturnValueOnce(Promise.resolve({ socialIdentities }))
        };

        const tree = socialAccountsWidget(
            { ...options, accessToken: 'azerty' },
            { config, apiClient }
        ).then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    test('basic', generateSnapshot({ socialIdentities: [{ id: '123456778', provider: 'facebook', name: 'John Doe' }] }))
})
