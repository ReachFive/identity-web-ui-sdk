/**
 * @jest-environment jest-fixed-jsdom
 */

import React from 'react'
import { describe, expect, jest, test } from '@jest/globals'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components'

import identifierField from '../../../../src/components/form/fields/identifierField'
import resolveI18n, { I18nMessages } from '../../../../src/core/i18n'
import { format } from 'libphonenumber-js'
import { createForm } from '../../../../src/components/form/formComponent'
import { defaultConfig, renderWithContext } from '../../../widgets/renderer'

const defaultI18n: I18nMessages = {
    identifier: 'Identifiant'
}

const i18nResolver = resolveI18n(defaultI18n)

type Model = { identifier: string }

describe('DOM testing', () => {
    test('with phone number enabled', async () => {
        const user = userEvent.setup()

        const key = 'identifier'
        const label = 'identifier'
        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                identifierField({ key, label, withPhoneNumber: true }, defaultConfig)
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

        const input = screen.queryByLabelText(i18nResolver(label))
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('id', key)
        expect(input).toHaveValue('')

        if (!input) return

        const emailValue = 'alice@reach5.co'
        await user.clear(input)
        await user.type(input, emailValue)
        expect(input).toHaveValue(emailValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: expect.objectContaining({
                    value: expect.objectContaining({
                        type: 'email',
                        value: emailValue,
                    })
                })
            })
        );

        const phoneValue = '+33123456789'
        await user.clear(input)
        await user.type(input, phoneValue)
        expect(input).toHaveValue(phoneValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: expect.objectContaining({
                    value: expect.objectContaining({
                        type: 'tel',
                        country: 'FR',
                        formatted: format(phoneValue, 'FR', 'INTERNATIONAL'),
                        value: phoneValue,
                        isValid: true,
                    })
                })
            })
        );

        const otherValue = 'Alice971'
        await user.clear(input)
        await user.type(input, otherValue)
        expect(input).toHaveValue(otherValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: expect.objectContaining({
                    value: expect.objectContaining({
                        type: 'text',
                        value: otherValue,
                    })
                }) 
            })
        );
    })

    test('with phone number disabled', async () => {
        const user = userEvent.setup()

        const key = 'identifier'
        const label = 'identifier'
        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                identifierField({ key, label, withPhoneNumber: false }, defaultConfig)
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

        const input = screen.queryByLabelText(i18nResolver(label))
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('id', key)
        expect(input).toHaveValue('')

        if (!input) return

        const emailValue = 'alice@reach5.co'
        await user.clear(input)
        await user.type(input, emailValue)
        expect(input).toHaveValue(emailValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: expect.objectContaining({
                    value: expect.objectContaining({
                        type: 'email',
                        value: emailValue,
                    })
                })
            })
        );

        const phoneValue = '+33123456789'
        await user.clear(input)
        await user.type(input, phoneValue)
        expect(input).toHaveValue(phoneValue)

        // phone value is handled as "other" value type
        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: expect.objectContaining({
                    value: expect.objectContaining({
                        type: 'text',
                        value: phoneValue,
                    })
                })
            })
        );

        const otherValue = 'Alice971'
        await user.clear(input)
        await user.type(input, otherValue)
        expect(input).toHaveValue(otherValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: expect.objectContaining({
                    value: expect.objectContaining({
                        type: 'text',
                        value: otherValue,
                    })
                })
            })
        );
    })

    test('with defaultIdentifier setted', async () => {
        const user = userEvent.setup()

        const key = 'identifier'
        const label = 'identifier'
        const defaultValue = 'alice@reach5.co'

        const onFieldChange = jest.fn()
        const onSubmit = jest.fn<(data: Model) => Promise<Model>>(data => Promise.resolve(data))

        const Form = createForm<Model>({
            fields: [
                identifierField({ key, label, defaultValue, withPhoneNumber: true }, defaultConfig)
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

        const input = screen.queryByLabelText(i18nResolver(label))
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('id', key)
        expect(input).toHaveValue(defaultValue)

        if (!input) return

        const phoneValue = '+33123456789'
        await user.clear(input)
        await user.type(input, phoneValue)
        expect(input).toHaveValue(phoneValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: expect.objectContaining({
                    value: expect.objectContaining({
                        type: 'tel',
                        country: 'FR',
                        formatted: format(phoneValue, 'FR', 'INTERNATIONAL'),
                        value: phoneValue,
                        isValid: true,
                    })
                })
            })
        );

        const emailValue = 'bob@reach5.co'
        await user.clear(input)
        await user.type(input, emailValue)
        expect(input).toHaveValue(emailValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: expect.objectContaining({
                    value: expect.objectContaining({
                        type: 'email',
                        value: emailValue,
                    })
                })
            })
        );

        const otherValue = 'Alice971'
        await user.clear(input)
        await user.type(input, otherValue)
        expect(input).toHaveValue(otherValue)

        expect(onFieldChange).toHaveBeenLastCalledWith(
            expect.objectContaining({
                identifier: expect.objectContaining({
                    value: expect.objectContaining({
                        type: 'text',
                        value: otherValue,
                    })
                })
            })
        );
    })
})
