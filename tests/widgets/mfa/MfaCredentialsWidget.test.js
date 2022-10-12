import Enzyme, {render} from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import renderer from "react-test-renderer";
import MfaCredentialsWidget from "../../../src/widgets/mfa/MfaCredentialsWidget";
import $ from "cheerio";


Enzyme.configure({ adapter: new Adapter() });
const defaultConfig = { domain: 'local.reach5.net', mfaEmailEnabled: true, mfaSmsEnabled: true };
const textFilter = expected => (i, el) => $(el).text() === expected;

describe('Snapshot', () => {
    const generateSnapshot = ({options = {showIntro: true}, config = defaultConfig, credentials }) => () => {
        const apiClient = {
            listMfaCredentials: jest.fn().mockReturnValueOnce(Promise.resolve({ credentials }))
        }
        const tree = MfaCredentialsWidget(options, {config, apiClient} )
            .then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('mfaCredentials', () => {
        test('default', generateSnapshot({ credentials: []}));

        test('no intro', generateSnapshot({ options: {showIntro: false}, credentials: [
            { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
            { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' }
        ]}));
    });
});
describe('DOM testing', () => {
    const generateComponent = async (options, config = defaultConfig, credentials) => {

        const apiClient = {
            listMfaCredentials: jest.fn().mockReturnValueOnce(Promise.resolve({ credentials }))
        }
        const result = await MfaCredentialsWidget(options, { config, apiClient });

        return render(result);
    };

    describe('mfaCredentials', () => {
        test('default', async () => {
            const instance = await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, [
                    { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
                    { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' }
                ]);
            // Intro
            expect(
                instance.find('div').filter(textFilter('mfa.email.explain'))
            ).toHaveLength(1);

            // Form button sms
            expect(
                instance.find('button').filter(textFilter('mfa.register.phoneNumber'))
            ).toHaveLength(1);

            // // Form button email
            expect(
                instance.find('button').filter(textFilter('mfa.register.email'))
            ).toHaveLength(1);

            // // Form button remove email
            expect(
                instance.find('button').filter(textFilter('mfa.remove.email'))
            )

            // // Form button remove phone number
            expect(
                instance.find('button').filter(textFilter('mfa.remove.phoneNumber'))
            )
        });
    });
});
