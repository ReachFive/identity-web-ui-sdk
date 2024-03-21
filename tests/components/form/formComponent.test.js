/**
 * @jest-environment jsdom
 */

import React from 'react';
import { ThemeProvider } from 'styled-components';
import { beforeAll, afterAll, afterEach, describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { createForm } from '../../../src/components/form/formComponent.tsx';
import { simpleField } from '../../../src/components/form/fields/simpleField';
import { WebAuthnLoginViewButtons } from '../../../src/components/form/webAuthAndPasswordButtonsComponent';
import { ConfigProvider } from '../../../src/contexts/config';
import { I18nProvider } from '../../../src/contexts/i18n';
import { buildTheme } from '../../../src/core/theme'
import { Validator } from '../../../src/core/validation';

const defaultConfig = {
    domain: 'local.reach5.net',
    language: 'fr'
};

const defaultI18n = {
    'custom.submitLabel': 'Envoyer',
    'form.failure': 'An error occured!',
}

const defaultTheme = buildTheme()

describe('DOM testing', () => {

    beforeAll(() => {
        jest.spyOn(global.console, 'error').mockImplementation(() => {});
    })

    afterEach(() => {
        global.console.error.mockClear();
    })

    afterAll(() => {
        global.console.error.mockRestore();
    })

    describe('createForm', () => {

        const generateComponent = async (config, formProps = {}) => {
            const Form = createForm(config)
            return render(
                <ConfigProvider config={defaultConfig}>
                    <ThemeProvider theme={defaultTheme}>
                        <I18nProvider defaultMessages={defaultI18n}T>
                            <Form {...formProps} />
                        </I18nProvider>
                    </ThemeProvider>
                </ConfigProvider>
            );
        }
        
        test('default config', async () => {
            await generateComponent({})
            expect(screen.queryByTestId('submit')).toBeInTheDocument();
        })

        test('define submitLabel', async () => {
            await generateComponent({
                submitLabel: 'custom.submitLabel',
            })
            const submit = screen.queryByTestId('submit')
            expect(submit).toBeInTheDocument();
            expect(submit).toHaveTextContent(defaultI18n['custom.submitLabel'])
        })

        test('define fields', async () => {
            await generateComponent({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
            })
            expect(screen.queryByTestId('simpleField')).toBeInTheDocument();
            expect(screen.queryByLabelText('Simple field')).toBeInTheDocument();
        })

        test('define fields as function', async () => {
            const fieldsBuilder = jest.fn().mockImplementation(() => ([
                simpleField({
                    key: 'simpleField',
                    label: 'Simple field',
                    type: 'text',
                }),
            ]))

            const props = {
                fields: fieldsBuilder,
            }
            const formProps = {
                myProp: 'myProp'
            }
            await generateComponent(props, formProps)

            expect(fieldsBuilder).toBeCalledWith(
                expect.objectContaining({
                    config: expect.objectContaining(defaultConfig),
                    i18n: expect.anything(),
                    ...formProps,
                })
            )

            expect(screen.queryByTestId('simpleField')).toBeInTheDocument();
            expect(screen.queryByLabelText('Simple field')).toBeInTheDocument();
        })

        test('define static content in fields', async () => {
            await generateComponent({
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
            expect(screen.queryByTestId('simpleField')).toBeInTheDocument();
            expect(screen.queryByTestId('static-content')).toBeInTheDocument();
        })

        test('initialize fields with initial model', async () => {
            await generateComponent({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
                initialModel: {
                    simpleField: 'my value'
                },
            })

            expect(screen.queryByTestId('simpleField')).toBeInTheDocument();
            expect(screen.queryByDisplayValue('my value')).toBeInTheDocument();
        })

        test('handle field change event', async () => {
            const user = userEvent.setup()
            const handleChange = jest.fn();
            
            await generateComponent({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
                onFieldChange: handleChange
            })

            const input = screen.queryByTestId('simpleField')
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value')

            expect(input).toHaveValue('my value');

            expect(handleChange).toHaveBeenCalledTimes(8)
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

            const validatorUnderling = jest.fn();
            const validator = new Validator({
                rule: validatorUnderling
            });
            
            await generateComponent({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                        validator
                    }),
                ],
            })

            const input = screen.queryByTestId('simpleField')
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

            const beforeSubmit = jest.fn().mockImplementation(data =>
                Object.fromEntries(
                    Object.entries(data)
                        .map(([key, value]) => [key, `${value} (processed)`])
                )
            );
            const handler = jest.fn().mockResolvedValue();
            const onSuccess = jest.fn();
            const onError = jest.fn();
            
            await generateComponent({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
                beforeSubmit,
                handler,
                onSuccess,
                onError,
            })

            const input = screen.queryByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value');

            expect(input).toHaveValue('my value');

            const submit = screen.queryByTestId('submit');
            await user.click(submit);

            // isLoading = true
            expect(submit).toBeDisabled();

            expect(beforeSubmit).toHaveBeenCalledTimes(1);
            expect(beforeSubmit).toHaveBeenLastCalledWith({
                simpleField: 'my value',
            });

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenLastCalledWith({
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
            
            const handler = jest.fn().mockResolvedValue();
            
            await generateComponent({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
                handler,
                supportMultipleSubmits: true,
            })

            const input = screen.queryByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value')

            expect(input).toHaveValue('my value');

            const submit = screen.queryByTestId('submit');
            await user.click(submit);

            expect(handler).toHaveBeenCalledTimes(1);

            // should only re-enable sumit button if `supportMultipleSubmits` prop is True
            expect(submit).not.toBeDisabled();
        })

        test('handle form submit failure', async () => {
            const user = userEvent.setup()

            const error = {
                errorMessageKey: 'form.failure',
                errorUserMsg: defaultI18n['form.failure'],
            }
            const handler = jest.fn().mockRejectedValue(error);
            const onSuccess = jest.fn();
            const onError = jest.fn();
            
            await generateComponent({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
                handler,
                onSuccess,
                onError,
            })

            const input = screen.queryByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value');
            expect(input).toHaveValue('my value');


            const submit = screen.queryByTestId('submit');
            await user.click(submit);

            expect(onSuccess).not.toHaveBeenCalled();
            expect(onError).toHaveBeenCalledTimes(1);
            expect(onError).toHaveBeenCalledWith(error);

            // error should be diplayed in form rendering
            expect(screen.queryByText(defaultI18n['form.failure'])).toBeInTheDocument();

            // should not be reset
            expect(input).toHaveValue('my value');

            // should re-enable sumit button
            expect(submit).not.toBeDisabled();
        })

        test('skip error', async () => {
            const user = userEvent.setup()

            const error = new Error('Failure')
            const handler = jest.fn().mockRejectedValue(error);
            const onSuccess = jest.fn();
            const onError = jest.fn();
            const skipError = jest.fn().mockReturnValue(true);
            
            await generateComponent({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
                handler,
                onSuccess,
                onError,
                skipError,
            })

            const input = screen.queryByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value');
            expect(input).toHaveValue('my value');


            const submit = screen.queryByTestId('submit');
            await user.click(submit);
            
            expect(handler).toHaveBeenCalledTimes(1);
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onError).not.toHaveBeenCalled();

            expect(skipError).toHaveBeenCalledWith(error);
        })

        test('reset after error', async () => {
            const user = userEvent.setup()

            const error = new Error('Failure')
            const handler = jest.fn().mockRejectedValue(error);
            
            await generateComponent({
                fields: [
                    simpleField({
                        key: 'simpleField',
                        label: 'Simple field',
                        type: 'text',
                    }),
                ],
                handler,
                resetAfterError: true
            })

            const input = screen.queryByTestId('simpleField');
            expect(input).toBeInTheDocument();

            // triggering multiple change events in a row
            await user.type(input, 'my value');
            expect(input).toHaveValue('my value');


            const submit = screen.queryByTestId('submit');
            await user.click(submit);
            
            expect(handler).toHaveBeenCalledTimes(1)

            expect(global.console.error).toHaveBeenCalledWith(error);

            // should be be reset
            expect(input).toHaveValue('');
        })

        // test('allow WebAuthn login', async () => {
        //     const user = userEvent.setup()

        //     const redirect = jest.fn();

        //     await generateComponent({
        //         fields: [
        //             simpleField({
        //                 key: 'simpleField',
        //                 label: 'Simple field',
        //                 type: 'text',
        //             }),
        //         ],
        //         allowWebAuthnLogin: true,
        //         webAuthnButtons: (disabled, onPasswordClick) => (
        //             <WebAuthnLoginViewButtons
        //                 disabled={disabled}
        //                 onPasswordClick={onPasswordClick}
        //             />
        //         ),
        //         redirect,
        //     });

        //     const input = screen.queryByTestId('simpleField');
        //     expect(input).toBeInTheDocument();
            
        //     await user.type(input, 'my value');
        //     expect(input).toHaveValue('my value');

        //     const webauthnButton = screen.queryByTestId('webauthn-button');
        //     expect(webauthnButton).toBeInTheDocument();

        //     const passwordButton = screen.queryByTestId('password-button');
        //     expect(passwordButton).toBeInTheDocument();

        //     await user.click(passwordButton);

        //     expect(redirect).toHaveBeenCalledWith({
        //         simpleField: 'my value'
        //     })
        // })

    })
})
