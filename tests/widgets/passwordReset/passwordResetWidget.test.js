import renderer from 'react-test-renderer';
import 'jest-styled-components';
import { render } from 'enzyme';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import passwordResetWidget from '../../../src/widgets/passwordReset/passwordResetWidget'

Enzyme.configure({ adapter: new Adapter() });

describe('Snapshot', () => {
    const generateSnapshot = (options) => () => {
        const tree = passwordResetWidget(options, { config: {}, apiClient: {} })
            .then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('password-reset', () => {
        test('default', generateSnapshot());
    });
});

describe('DOM testing', () => {
    const generateComponent = async (options) => {
        const result = await passwordResetWidget(options, { config: {}, apiClient: {} });

        return render(result);
    };

    describe('password-reset', () => {
        test('basic', async () => {
            expect.assertions(3);

            // When
            const instance = await generateComponent();

            // Then
            expect(instance.find('input[name="password"]')).toHaveLength(1);
            expect(instance.find('input[name="password_confirmation"]')).toHaveLength(1);
            expect(instance.find('button').text()).toBe('Send');
        });
    });
});
