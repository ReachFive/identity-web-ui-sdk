import Enzyme, {render} from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import passwordlessWidget from "../../../src/widgets/passwordless/passwordlessWidget";
import renderer from "react-test-renderer";
import MfaCredentialsWidget from "../../../src/widgets/mfa/MfaCredentialsWidget";
import $ from "cheerio";


Enzyme.configure({ adapter: new Adapter() });
const defaultConfig = { domain: 'local.reach5.net', mfaEmailEnabled: true, mfaSmsEnabled: true };
const textFilter = expected => (i, el) => $(el).text() === expected;

describe('Snapshot', () => {
    const generateSnapshot = (options, config = defaultConfig) => () => {
        const tree = MfaCredentialsWidget(options, { config, apiClient: {} })
            .then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('mfaCredentials', () => {
        test('default', generateSnapshot());

        test('no intro', generateSnapshot({ showIntro: false }));
    });
});
describe('DOM testing', () => {
    const generateComponent = async (options, config = defaultConfig) => {
        const result = await MfaCredentialsWidget(options, { config, apiClient: {} });

        return render(result);
    };

    describe('mfaCredentials', () => {
        test('default', async () => {
            const instance = await generateComponent({});
            // Intro
            expect(
                instance.find('div').filter(textFilter('mfa.email.explain'))
            ).toHaveLength(1);

            // Form button sms
            expect(
                instance.find('button').filter(textFilter('mfa.register.phoneNumber'))
            ).toHaveLength(1);

            // Form button email
            expect(
                instance.find('button').filter(textFilter('mfa.register.email'))
            ).toHaveLength(1);
        });
    });
});
