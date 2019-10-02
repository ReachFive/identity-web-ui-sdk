import renderer from 'react-test-renderer';
import 'jest-styled-components';
import $ from 'cheerio';
import { render } from 'enzyme';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { randomString } from '../../../src/helpers/random';
import authWidget from '../../../src/widgets/auth/authWidget'

Enzyme.configure({ adapter: new Adapter() })

const textFilter = expected => (i, el) => $(el).text() === expected;

const defaultConfig = {
    domain: 'local.reach5.net',
    passwordPolicy: {
        minLength: 8,
        minStrength: 2
    },
    socialProviders: ['facebook', 'google'],
    consents: [{
        key: 'aConsent',
        title: 'consent title',
        description: 'consent description'
    }]
};

describe('Snapshot', () => {
    const generateSnapshot = (options, config = defaultConfig) => () => {
        const tree = authWidget(options, { config, apiClient: {} })
            .then(result => renderer.create(result).toJSON())
            .catch(e => console.error(e) || Promise.reject(e));

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('login view', () => {
        test('default', generateSnapshot({}));

        test('no signup', generateSnapshot({
            allowSignup: false
        }));

        test('with remember me', generateSnapshot({
            showRememberMe: true
        }));

        test('with canShowPassword', generateSnapshot({
            canShowPassword: true
        }));

        test('no forgot password', generateSnapshot({
            allowForgotPassword: false
        }));

        test('inline social buttons', generateSnapshot({
            theme: {
                socialButton: {
                    inline: true
                }
            }
        }));
    });

    describe('signup view', () => {
        test('default', generateSnapshot({
            initialScreen: 'signup'
        }));

        test('no login', generateSnapshot({
            initialScreen: 'signup',
            allowLogin: false
        }));

        test('show labels', generateSnapshot({
            initialScreen: 'signup',
            showLabels: true
        }));

        test('inline social buttons', generateSnapshot({
            initialScreen: 'signup',
            theme: {
                socialButton: {
                    inline: true
                }
            }
        }));

        test('with user agreement', generateSnapshot({
            initialScreen: 'signup',
            userAgreement: 'En vous inscrivant, vous acceptez les [conditions générales d\'utilisation](https://sandbox-local.reach5.co/).'
        }));

        test('with consents', generateSnapshot({
            initialScreen: 'signup',
            signupFields: ['email', 'password', 'consents.aConsent']
        }));
    });

    describe('forgot password view', () => {
        test('default', generateSnapshot({
            initialScreen: 'forgot-password'
        }));
    });
});

describe('DOM testing', () => {
    const generateComponent = async (options, config = defaultConfig) => {
        const result = await authWidget(options, { config, apiClient: {} });

        return render(result);
    };

    describe('login view', () => {
        test('default config', async () => {
            expect.assertions(7);
            const instance = await generateComponent({});

            // Form button
            expect(instance.find('button').text()).toBe('Log in');

            // Links
            const links = instance.find('a');
            expect(links).toHaveLength(2);
            expect(links.eq(0).text()).toEqual('Don\'t remember your password?');
            expect(links.eq(1).text()).toEqual('Sign up');

            // Social buttons
            expect(instance.find('span').filter(textFilter('Facebook'))).toHaveLength(1);
            expect(instance.find('span').filter(textFilter('Google'))).toHaveLength(1);

            // No remember me
            expect(instance.find('[type="checkbox"]')).toHaveLength(0);
        });

        test('login only', async () => {
            expect.assertions(2);
            const instance = await generateComponent({
                allowSignup: false
            });

            const links = instance.find('a');
            expect(links).toHaveLength(1);
            expect(links.eq(0).text()).toEqual('Don\'t remember your password?');
        });

        test('without forgot password', async () => {
            expect.assertions(1);
            const instance = await generateComponent({
                allowSignup: false,
                allowForgotPassword: false
            });

            const links = instance.find('a');
            expect(links).toHaveLength(0);
        });

        test('with remember me', async () => {
            expect.assertions(2);
            const instance = await generateComponent({
                showRememberMe: true
            });

            expect(instance.find('a')).toHaveLength(2);

            const checkbox = instance.find('label').filter(textFilter('Remember me'));
            expect(checkbox).toHaveLength(1);
        });

        test('with canShowPassword', async () => {
            expect.assertions(1);
            const instance = await generateComponent({
                canShowPassword: true
            });

            expect(instance.find('svg')).toHaveLength(1);
        });

        test('inline social buttons', async () => {
            expect.assertions(4);
            const instance = await generateComponent({
                theme: {
                    socialButton: {
                        inline: true
                    }
                }
            });

            // Social buttons
            expect(instance.find('span').filter(textFilter('Facebook'))).toHaveLength(0);
            expect(instance.find('span').filter(textFilter('Google'))).toHaveLength(0);
            expect(instance.find('[title="Facebook"]')).toHaveLength(1);
            expect(instance.find('[title="Google"]')).toHaveLength(1);
        });

        describe('i18n', () => {
            test('overwrite title', async () => {
                expect.assertions(1);
                const title = randomString();
                const instance = await generateComponent({
                    i18n: {
                        'login.title': title
                    }
                });

                expect(instance.find('div').filter(textFilter(title))).toHaveLength(1);
            });

            test('overwrite title - expanded', async () => {
                expect.assertions(1);
                const title = randomString();
                const instance = await generateComponent({
                    i18n: {
                        login: {
                            title
                        }
                    }
                });

                expect(instance.find('div').filter(textFilter(title))).toHaveLength(1);
            });
        });
    });

    describe('signup view', () => {
        test('default config', async () => {
            expect.assertions(5);
            const instance = await generateComponent({
                initialScreen: 'signup'
            });

            // Form button
            expect(instance.find('button').text()).toBe('Sign up');

            // Log in link
            const links = instance.find('a');
            expect(links).toHaveLength(1);
            expect(links.eq(0).text()).toEqual('Log in');

            // Social buttons
            expect(instance.find('span').filter(textFilter('Facebook'))).toHaveLength(1);
            expect(instance.find('span').filter(textFilter('Google'))).toHaveLength(1);
        });

        test('inline social buttons', async () => {
            expect.assertions(4);
            const instance = await generateComponent({
                initialScreen: 'signup',
                theme: {
                    socialButton: {
                        inline: true
                    }
                }
            });

            // Social buttons
            expect(instance.find('span').filter(textFilter('Facebook'))).toHaveLength(0);
            expect(instance.find('span').filter(textFilter('Google'))).toHaveLength(0);
            expect(instance.find('[title="Facebook"]')).toHaveLength(1);
            expect(instance.find('[title="Google"]')).toHaveLength(1);
        });

        test('with user agreement', async () => {
            expect.assertions(3);
            const instance = await generateComponent({
                initialScreen: 'signup',
                userAgreement: 'I agreed [terms of use](https://example.com/termsofuse).'
            });

            expect(instance.find('[data-text="md"]')).toHaveLength(1);

            const links = instance.find('a');
            expect(links).toHaveLength(2);
            expect(links.eq(0).text()).toEqual('terms of use');
        });

        test('default signup fields', async () => {
            expect.assertions(6);
            const instance = await generateComponent({
                initialScreen: 'signup'
            });

            // Social buttons
            expect(instance.find('input')).toHaveLength(5);
            [
                'given_name',
                'family_name',
                'email',
                'password',
                'password_confirmation'
            ].forEach(field => {
                expect(instance.find(`input[name="${field}"]`)).toHaveLength(1)
            });
        });

        test('signup fields selection', async () => {
            expect.assertions(4);
            const signupFields = ['email', 'password', 'password_confirmation'];
            const instance = await generateComponent({
                initialScreen: 'signup',
                signupFields
            });

            expect(instance.find('input')).toHaveLength(3);
            signupFields.forEach(field => {
                expect(instance.find(`input[name="${field}"]`)).toHaveLength(1);
            });
        });

        test('signup fields selection with custom field', async () => {
            expect.assertions(4);
            const signupFields = ['email', 'password', 'custom_fields.newsletter_optin'];
            const instance = await generateComponent({
                initialScreen: 'signup',
                signupFields
            }, {
                ...defaultConfig,
                customFields: [
                    {
                        id: 'newsletter_optin',
                        name: 'Newsletter optin',
                        path: 'newsletter_optin',
                        dataType: 'checkbox'
                    }
                ]
            });

            expect(instance.find('input')).toHaveLength(3);
            signupFields.forEach(field => {
                expect(instance.find(`input[name="${field}"]`)).toHaveLength(1);
            });
        });
    });
});
