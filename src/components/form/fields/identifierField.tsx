import React from 'react';

import * as libphonenumber from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

import { email, Validator } from '../../../core/validation';

import { FormGroup, Input } from '../formControlsComponent';
import { createField, type FieldComponentProps, type FieldDefinition } from '../fieldCreator';
import { Config, Optional } from '../../../types';
import { isRichFormValue } from '../../../helpers/utils';

/*
* All possible Identifier data is in the `value` prop, they should all be preserved when the type changes.
*/
interface IdentifierData {
    value?: string,
    type?: 'tel' | 'email' | 'text',
    country?: CountryCode,
    formatted?: string,
    isValid?: boolean,
}


function specializeRawIdentifier(
    withPhoneNumber?: boolean,
    inputValue?: string,
    telCall?: (value?: string) => IdentifierData,
    emailCall?: (value?: string) => IdentifierData,
    otherCall?: (value?: string) => IdentifierData
): IdentifierData {
    if (withPhoneNumber && inputValue && (/^\+?[0-9]+$/.test(inputValue))) {
        return ({
            value: inputValue,
            ...(telCall?.(inputValue) ?? {}),
            type: 'tel',
        })
    } else if (inputValue?.includes('@')) {
        return ({
            value: inputValue,
            ...(emailCall?.(inputValue) ?? {}),
            type: 'email',
        })
    } else {
        return ({
            value: inputValue,
            ...(otherCall?.(inputValue) ?? {}),
            type: 'text',
        })
    }
}

function specializeRefinedIdentifier<T>(
    identifier: IdentifierData,
    telCall: (identifier: IdentifierData) => T,
    emailCall: (identifier: IdentifierData) => T,
    otherCall: (identifier: IdentifierData) => T
) {
    if (identifier.type === 'tel')
        return telCall(identifier)
    else if (identifier.type === 'email')
        return emailCall(identifier)
    else return otherCall(identifier)
}

type IdentifierFieldExtraProps = {
    withPhoneNumber?: boolean
}

export interface IdentifierFieldProps extends FieldComponentProps<IdentifierData, IdentifierFieldExtraProps> {}

function IdentifierField({
    autoComplete,
    inputId,
    label,
    onChange,
    path,
    placeholder = label,
    required = true,
    showLabel,
    readOnly,
    validation = {},
    value,
    withPhoneNumber,
}: IdentifierFieldProps) {
    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value

    const asYouType = (inputValue?: string): IdentifierData => {
        if (!inputValue) return {}

        const parsed = libphonenumber.parsePhoneNumberFromString(inputValue)
        return parsed ? {
            country: parsed.country,
            formatted: parsed.formatInternational(),
            isValid: parsed.isValid(),
            value: inputValue
        } : {
            isValid: false,
            value: inputValue,
        }
    }

    const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue: IdentifierData = {
            ...currentValue,
            ...specializeRawIdentifier(withPhoneNumber, event.target.value, asYouType)
        }
        onChange({ value: newValue, isDirty: false })
    }

    const error = typeof validation === 'object' && 'error' in validation ? validation.error : undefined

    return <FormGroup
        inputId={inputId}
        labelText={label}
        {...{ error }}
        showLabel={showLabel}
        required={required}
    >
        <Input
            id={inputId}
            name={path}
            type='text'
            value={currentValue?.value ?? ''}
            placeholder={placeholder}
            title={label}
            autoComplete={autoComplete}
            required={required}
            readOnly={readOnly}
            hasError={!!error}
            onChange={changeHandler}
            onBlur={() => onChange({ isDirty: true })}
            data-testid={path}
        />
    </FormGroup>
}

function isValidCountryCode(code?: string): code is CountryCode {
    return typeof code === 'string' && libphonenumber.isSupportedCountry(code)
}

export default function identifierField(
    {
        key = 'identifier',
        label = 'identifier',
        ...props
    }: Optional<FieldDefinition<string, IdentifierData>, 'key' | 'label'> & IdentifierFieldExtraProps,
    config: Config
) {
    return createField<string, IdentifierData, IdentifierFieldProps>({
        ...props,
        key,
        label,
        format: {
            bind: value => specializeRawIdentifier(
                props.withPhoneNumber,
                value,
                () => ({ country: isValidCountryCode(config.countryCode) ? config.countryCode : undefined, isValid: true } satisfies IdentifierData),
                () => ({ country: isValidCountryCode(config.countryCode) ? config.countryCode : undefined, isValid: true } satisfies IdentifierData),
                () => ({ country: isValidCountryCode(config.countryCode) ? config.countryCode : undefined, isValid: true } satisfies IdentifierData),
                ),
            unbind: value => value ? specializeRefinedIdentifier(
                isRichFormValue(value, 'raw') ? value.raw : value,
                v => v?.formatted ?? v?.value ?? null,
                v => v?.value ?? null,
                v => v?.value ?? null
            ) : null
        },
        validator: new Validator<IdentifierData>({
            rule: (value, ctx) => specializeRefinedIdentifier(
                value,
                v => v?.isValid ?? !props.withPhoneNumber,
                v => email.rule(v?.value ?? '', ctx),
                v => v?.isValid
            ) ?? true,
            hint: value => specializeRefinedIdentifier(
                value,
                () => 'phone',
                () => 'email',
                () => 'identifier'
            )
        }),
        component: IdentifierField,
        extendedParams: {
            withPhoneNumber: props.withPhoneNumber
        }
    });
}
