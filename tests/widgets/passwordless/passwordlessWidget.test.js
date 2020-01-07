import renderer from 'react-test-renderer';
import 'jest-styled-components';
import $ from 'cheerio';
import { render } from 'enzyme';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import passwordlessWidget from '../../../src/widgets/passwordless/passwordlessWidget'

Enzyme.configure({ adapter: new Adapter() });

const textFilter = expected => (i, el) => $(el).text() === expected;

const defaultConfig = { domain: 'local.reach5.net' };

describe('Snapshot', () => {
    const generateSnapshot = (options, config = defaultConfig) => () => {
        const tree = passwordlessWidget(options, { config, apiClient: {} })
            .then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('passwordless', () => {
        test('default', generateSnapshot());

        test('no intro', generateSnapshot({ showIntro: false }));

        test('sms', generateSnapshot({ authType: "sms" }));
    });
});

describe('DOM testing', () => {
    const generateComponent = async (options, config = defaultConfig) => {
        const result = await passwordlessWidget(options, { config, apiClient: {} });

        return render(result);
    };

    describe('passwordless', () => {
        test('default', async () => {
            expect.assertions(4);
            const instance = await generateComponent({});

            // Intro
            expect(
                instance.find('div').filter(textFilter('passwordless.intro'))
            ).toHaveLength(1);

            // Label
            expect(instance.find('label').text()).toBe('email');

            // Input email
            expect(instance.find('[type="email"]')).toHaveLength(1);

            // Form button
            expect(instance.find('button').text()).toBe('send');
        });

        test('no intro', async () => {
            expect.assertions(1);
            const instance = await generateComponent({ showIntro: false });

            // Intro
            expect(
                instance.find('div').filter(textFilter('passwordless.intro'))
            ).toHaveLength(0);
        });

        test('by phone number', async () => {
            expect.assertions(4);
            const instance = await generateComponent({ authType: "sms" });

            // Intro
            expect(
                instance.find('div').filter(textFilter('passwordless.sms.intro'))
            ).toHaveLength(1);

            // Label
            expect(instance.find('label').text()).toBe('phoneNumber');

            // Input phone number
            expect(instance.find('[type="tel"]')).toHaveLength(1);

            // Form button
            expect(instance.find('button').text()).toBe('send');
        });
    });
});
