/**
 * @jest-environment jest-fixed-jsdom
 */

import React from 'react'
import { describe, expect, jest, test } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { createForm } from '../../../../src/components/form/formComponent'
import consentField from '../../../../src/components/form/fields/consentField'
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n';
import { defaultConfig, renderWithContext } from '../../../widgets/renderer';

const defaultI18n: I18nMessages = {
    checkbox: 'Check?',
}

const i18nResolver = resolveI18n(defaultI18n)

type Model = { 'consents.myconsent.1': string }

describe('DOM testing', () => {
    test('default settings', async () => {
        const user = userEvent.setup()

        const label = 'My Consent'

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                consentField({
                    key: `consents.myconsent.1`,
                    path: `consents.myconsent`, // Will target the same profile consent value for different versions of the consent
                    label,
                    type: 'opt-in',
                    version: {
                        versionId: 1,
                        language: defaultConfig.language
                    },
                    description: 'Lorem ipsum sit amet',
                    consentCannotBeGranted: false
                })
            ],
        })

        await renderWithContext(
            <Form
                fieldValidationDebounce={0} // trigger validation instantly
                onFieldChange={onFieldChange}
                handler={onSubmit}
            />,
            // @ts-expect-error partial Client
            {},
            defaultConfig,
            defaultI18n
        )

        const checkbox = screen.getByLabelText(i18nResolver(label))
        expect(checkbox).not.toBeChecked()

        const description = screen.queryByTestId('consents.myconsent.1.description')
        expect(description).toBeInTheDocument()
        expect(description).toHaveTextContent('Lorem ipsum sit amet')
        
        await user.click(checkbox)

        expect(checkbox).toBeChecked()

        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                'consents.myconsent.1': expect.objectContaining({
                    isDirty: true,
                    value: true,
                })
            })
        ))

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        await waitFor(() => expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                consents: expect.objectContaining({
                    'myconsent': expect.objectContaining({
                        consentType: 'opt-in',
                        consentVersion: expect.objectContaining({
                            language: defaultConfig.language,
                            versionId: 1
                        }),
                        granted: true
                    })
                })
            })
        ))
    })

    test('initially checked', async () => {
        const user = userEvent.setup()

        const label = 'My Consent'

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                consentField({
                    label,
                    key: `consents.myconsent.1`,
                    path: `consents.myconsent`, // Will target the same profile consent value for different versions of the consent
                    type: 'opt-in',
                    version: {
                        versionId: 1,
                        language: defaultConfig.language
                    },
                    description: 'Lorem ipsum sit amet',
                    consentCannotBeGranted: false,
                    defaultValue: true,
                })
            ],
        })

        await renderWithContext(
            <Form
                fieldValidationDebounce={0} // trigger validation instantly
                onFieldChange={onFieldChange}
                handler={onSubmit}
            />,
            // @ts-expect-error partial Client
            {},
            defaultConfig,
            defaultI18n
        )

        const checkbox = screen.getByLabelText(i18nResolver(label))
        expect(checkbox).toBeChecked()
        
        await user.click(checkbox)

        expect(checkbox).not.toBeChecked()

        await waitFor(() => expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                'consents.myconsent.1': expect.objectContaining({
                    isDirty: true,
                    value: false,
                })
            })
        ))

        const submitBtn = screen.getByRole('button')
        await user.click(submitBtn)

        await waitFor(() => expect(onSubmit).toHaveBeenCalled())

        await waitFor(() => expect(onSubmit).toBeCalledWith(
            expect.objectContaining({
                consents: expect.objectContaining({
                    'myconsent': expect.objectContaining({
                        consentType: 'opt-in',
                        consentVersion: expect.objectContaining({
                            language: defaultConfig.language,
                            versionId: 1
                        }),
                        granted: false
                    })
                })
            })
        ))
    })
})
