/**
 * @jest-environment jsdom
 */

import React from 'react';
import { ThemeProvider } from 'styled-components';
import { beforeAll, afterAll, afterEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import type { Config } from '../../../src/types';
import type { Theme } from '../../../src/types/styled'

import { createForm, FieldValues, FormContext } from '../../../src/components/form/formComponent';
import { simpleField } from '../../../src/components/form/fields/simpleField';
import { ConfigProvider } from '../../../src/contexts/config';
import { I18nProvider } from '../../../src/contexts/i18n';
import resolveI18n, { I18nMessages } from '../../../src/core/i18n';
import { buildTheme } from '../../../src/core/theme'
import { Validator } from '../../../src/core/validation';
import { FieldCreator } from '../../../src/components/form/fieldCreator';
import { WebAuthnLoginViewButtons } from '../../../src/components/form/webAuthAndPasswordButtonsComponent';

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google'],
    customFields: [],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
    consentsVersions: {},
};

const defaultI18n: I18nMessages = {
    'custom.submitLabel': 'Envoyer',
    'form.failure': 'An error occured!',
}

const i18nResolver = resolveI18n(defaultI18n)

const theme: Theme = buildTheme({
    primaryColor: '#ff0000',
    spacing: 20,
    input: {
        borderWidth: 1,
        paddingX: 16,
        paddingY: 8,
        height: 40,
    }
})

type Model = {
    simpleField: string
}

describe('DOM testing', () => {

    let consoleErrorMock: jest.SpiedFunction<typeof global.console.error>;

    beforeAll(() => {
        consoleErrorMock = jest.spyOn(global.console, 'error').mockImplementation(() => {});
    })

    afterEach(() => {
        consoleErrorMock.mockClear();
    })

    afterAll(() => {
        consoleErrorMock.mockRestore();
    })

    describe('createForm', () => {

        const onSubmit = jest.fn<(data: Model) => Promise<Model>>((data: Model) => Promise.resolve(data))

        afterEach(() => {
            onSubmit.mockClear()
        })
        
        test('default config', async () => {
            const Form = createForm<Model>({})

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form handler={onSubmit} />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            expect(screen.queryByTestId('submit')).toBeInTheDocument();
        })

        test('define submitLabel', async () => {
            const Form = createForm<Model>({
                submitLabel: 'custom.submitLabel'
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form handler={onSubmit} />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const submit = screen.queryByTestId('submit')
            expect(submit).toBeInTheDocument();
            expect(submit).toHaveTextContent(i18nResolver('custom.submitLabel'))
        })

        test('define fields', async () => {
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form handler={onSubmit} />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            expect(screen.queryByTestId('simpleField')).toBeInTheDocument();
            expect(screen.queryByLabelText('Simple field')).toBeInTheDocument();
        })

        test('define fields as function', async () => {
            type CustomOptions = { simpleFieldLabel: string }
            const customOptions: CustomOptions = { simpleFieldLabel: 'Simple field' }

            const fieldsBuilder = jest.fn<({ simpleFieldLabel }: CustomOptions) => FieldCreator<any, any, any, any>[]>(({ simpleFieldLabel }) => ([
                simpleField({
                    key: 'simpleField',
                    label: simpleFieldLabel,
                    type: 'text',
                }),
            ]))

            const Form = createForm<Model, CustomOptions>({
                fields: fieldsBuilder
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form
                                    handler={onSubmit}
                                    {...customOptions}
                                />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            

            expect(fieldsBuilder).toBeCalledWith(
                expect.objectContaining({
                    config: expect.objectContaining({ ...defaultConfig  }),
                    i18n: expect.anything(),
                    ...customOptions,
                })
            )

            expect(screen.queryByTestId('simpleField')).toBeInTheDocument();
            expect(screen.queryByLabelText('Simple field')).toBeInTheDocument();
        })

        test('define static content in fields', async () => {
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                    {
                        staticContent: <span data-testid="static-content" key="static-content" />
                    }
                ],
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form handler={onSubmit} />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            expect(screen.queryByTestId('simpleField')).toBeInTheDocument();
            expect(screen.queryByTestId('static-content')).toBeInTheDocument();
        })

        test('initialize fields with initial model', async () => {
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form
                                    handler={onSubmit}
                                    initialModel={{
                                        simpleField: 'default value'
                                    }}
                                />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const input = screen.queryByTestId('simpleField')
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue('default value');
        })

        test('handle field change event', async () => {
            const user = userEvent.setup()
            const handleChange = jest.fn<(values: FieldValues<Model>) => void>();
            
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ]
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form
                                    onFieldChange={handleChange}
                                    handler={onSubmit}
                                    initialModel={{
                                        simpleField: 'default value'
                                    }}
                                />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const input = screen.getByTestId('simpleField')
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue('default value');

            // triggering multiple change events in a row
            await user.clear(input)
            await user.type(input, 'my value')

            expect(input).toHaveValue('my value');

            expect(handleChange).toHaveBeenLastCalledWith({
                simpleField: {
                    isDirty: false,
                    value: 'my value',
                },
            });
        })

        test('validate field value on changed', async () => {
            jest.useFakeTimers()

            const user = userEvent.setup({
                // https://github.com/testing-library/user-event/issues/833#issuecomment-1171452841
                advanceTimers: jest.advanceTimersByTime
            });

            const validatorUnderling = jest.fn<(value: string, ctx: FormContext<{}>) => boolean>();
            const validator = new Validator({
                rule: validatorUnderling
            });
            
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                        validator
                    }),
                ],
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form handler={onSubmit} />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const input = screen.getByTestId('simpleField')
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value')

            expect(input).toHaveValue('my value');

            // Fast-forward time
            jest.runAllTimers();

            // validation is debounced and should be call once in time interval defined by `fieldValidationDebounce` property.
            expect(validatorUnderling).toHaveBeenCalledTimes(1);
            expect(validatorUnderling).toHaveBeenLastCalledWith('my value', expect.anything());

            jest.useRealTimers();
        })

        test('handle form submit', async () => {
            const user = userEvent.setup();

            const beforeSubmit = jest.fn<(data: Model) => Model>().mockImplementation(data =>
                Object.fromEntries(
                    Object.entries(data)
                        .map(([key, value]) => [key, `${value} (processed)`])
                ) as Model
            );
            const onSuccess = jest.fn();
            const onError = jest.fn();
            
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form
                                    handler={onSubmit}
                                    beforeSubmit={beforeSubmit}
                                    onSuccess={onSuccess}
                                    onError={onError}
                                />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const input = screen.getByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value');

            expect(input).toHaveValue('my value');

            const submit = screen.getByTestId('submit');
            await user.click(submit);

            // isLoading = true
            expect(submit).toBeDisabled();

            expect(beforeSubmit).toHaveBeenCalledTimes(1);
            expect(beforeSubmit).toHaveBeenLastCalledWith({
                simpleField: 'my value',
            });

            expect(onSubmit).toHaveBeenCalledTimes(1);
            expect(onSubmit).toHaveBeenLastCalledWith({
                simpleField: 'my value (processed)',
            });

            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();

            // isLoading = false
            // should only re-enable sumit button if `supportMultipleSubmits` prop is True
            expect(submit).toBeDisabled();
        })

        test('support multiple submits', async () => {
            const user = userEvent.setup();
            
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
                supportMultipleSubmits: true,
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form handler={onSubmit} />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const input = screen.getByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value')

            expect(input).toHaveValue('my value');

            const submit = screen.getByTestId('submit');
            await user.click(submit);

            expect(onSubmit).toHaveBeenCalledTimes(1);

            // should only re-enable sumit button if `supportMultipleSubmits` prop is True
            expect(submit).not.toBeDisabled();
        })

        test('handle form submit failure', async () => {
            const user = userEvent.setup()

            const error = {
                errorMessageKey: 'form.failure',
                errorUserMsg: i18nResolver('form.failure'),
            }
            const onSubmitFailure = jest.fn<(data: Model) => Promise<Model>>().mockRejectedValue(error);
            const onSuccess = jest.fn();
            const onError = jest.fn();
            
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form
                                    handler={onSubmitFailure}
                                    onSuccess={onSuccess}
                                    onError={onError}
                                />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const input = screen.getByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value');
            expect(input).toHaveValue('my value');


            const submit = screen.getByTestId('submit');
            await user.click(submit);

            expect(onSubmitFailure).toHaveBeenCalledTimes(1);
            expect(onSuccess).not.toHaveBeenCalled();
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(error);

            // error should be diplayed in form rendering
            expect(screen.queryByText(i18nResolver('form.failure'))).toBeInTheDocument();

            // should not be reset
            expect(input).toHaveValue('my value');

            // should re-enable sumit button
            expect(submit).not.toBeDisabled();
        })

        test('skip error', async () => {
            const user = userEvent.setup()

            const error = new Error('Failure')
            const onSubmitFailure = jest.fn<(data: Model) => Promise<Model>>().mockRejectedValue(error);
            const onSuccess = jest.fn();
            const onError = jest.fn();
            const skipError = jest.fn<(error: unknown) => boolean>().mockReturnValue(true);
            
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form
                                    handler={onSubmitFailure}
                                    onSuccess={onSuccess}
                                    onError={onError}
                                    skipError={skipError}
                                />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const input = screen.getByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value');
            expect(input).toHaveValue('my value');


            const submit = screen.getByTestId('submit');
            await user.click(submit);
            
            expect(onSubmitFailure).toHaveBeenCalledTimes(1);
            expect(skipError).toHaveBeenCalledWith(error);
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();

        })

        test('reset after error', async () => {
            const user = userEvent.setup()

            const error = new Error('Failure')
            const onSubmitFailure = jest.fn<(data: Model) => Promise<Model>>().mockRejectedValue(error);
            
            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
                resetAfterError: true
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form
                                    handler={onSubmitFailure}
                                />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const input = screen.getByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value');
            expect(input).toHaveValue('my value');


            const submit = screen.getByTestId('submit');
            await user.click(submit);
            
            expect(onSubmitFailure).toHaveBeenCalledTimes(1)

            expect(global.console.error).toHaveBeenCalledWith(error);

            // should be be reset
            expect(input).toHaveValue('');
        })

        test('Custom submit component (WebAuthn login)', async () => {
            const user = userEvent.setup()

            const redirect = jest.fn<(data: Model) => void>();

            const Form = createForm<Model>({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
            })

            await waitFor(async () => {   
                return render(
                    <ConfigProvider config={defaultConfig}>
                        <ThemeProvider theme={theme}>
                            <I18nProvider defaultMessages={defaultI18n}>
                                <Form
                                    handler={onSubmit}
                                    SubmitComponent={({ disabled, onClick }) => (
                                        <WebAuthnLoginViewButtons
                                            disabled={disabled}
                                            enablePasswordAuthentication
                                            onPasswordClick={() => onClick(redirect)}
                                        />
                                    )}
                                />
                            </I18nProvider>
                        </ThemeProvider>
                    </ConfigProvider>
                )
            })

            const input = screen.getByTestId('simpleField');
            expect(input).toBeInTheDocument();
            
            await user.type(input, 'my value');
            expect(input).toHaveValue('my value');

            const webauthnButton = screen.getByTestId('webauthn-button');
            expect(webauthnButton).toBeInTheDocument();

            const passwordButton = screen.getByTestId('password-button');
            expect(passwordButton).toBeInTheDocument();

            await user.click(passwordButton);

            expect(redirect).toHaveBeenCalledWith({
                simpleField: 'my value'
            })
        })

    })
})