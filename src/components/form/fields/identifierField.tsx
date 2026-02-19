import React from 'react';

import {
    AsYouType,
    isSupportedCountry,
    isValidPhoneNumber,
    parsePhoneNumberFromString,
    type CountryCode,
} from 'libphonenumber-js';
import isEmail from 'validator/lib/isEmail';

import {
    createField,
    type FieldComponentProps,
    type FieldDefinition,
} from '@/components/form/fieldCreator';
import { FormGroup, Input } from '@/components/form/formControlsComponent';
import { useConfig } from '@/contexts/config';
import { isValidatorError, Validator } from '@/core/validation';
import { isRichFormValue } from '@/helpers/utils';
import { Config, Optional } from '@/types';

/*
 * All possible Identifier data is in the `value` prop, they should all be preserved when the type changes.
 */
export interface IdentifierData {
    value?: string;
    type?: 'tel' | 'email' | 'text';
    country?: CountryCode;
    formatted?: string;
    isValid?: boolean;
}

function specializeRawIdentifier(
    withPhoneNumber?: boolean,
    inputValue?: string,
    telCall?: (value?: string) => IdentifierData,
    emailCall?: (value?: string) => IdentifierData,
    otherCall?: (value?: string) => IdentifierData
): IdentifierData {
    if (withPhoneNumber && inputValue && /^\+?[0-9\s\-()]+$/.test(inputValue)) {
        return {
            type: 'tel',
            country: undefined,
            formatted: undefined,
            value: inputValue,
            ...(telCall?.(inputValue) ?? {}),
        };
    } else if (inputValue && isEmail(inputValue)) {
        return {
            type: 'email',
            country: undefined,
            formatted: undefined,
            value: inputValue,
            ...(emailCall?.(inputValue) ?? {}),
        };
    } else {
        return {
            type: 'text',
            country: undefined,
            formatted: undefined,
            value: inputValue,
            ...(otherCall?.(inputValue) ?? {}),
        };
    }
}

function specializeRefinedIdentifier<T>(
    identifier: IdentifierData,
    telCall: (identifier: IdentifierData) => T,
    emailCall: (identifier: IdentifierData) => T,
    otherCall: (identifier: IdentifierData) => T
) {
    if (identifier.type === 'tel') return telCall(identifier);
    else if (identifier.type === 'email') return emailCall(identifier);
    else return otherCall(identifier);
}

type IdentifierFieldExtraProps = {
    withPhoneNumber?: boolean;
    isWebAuthnLogin?: boolean;
};

export interface IdentifierFieldProps extends FieldComponentProps<
    IdentifierData,
    IdentifierFieldExtraProps
> {}

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
    validation,
    value,
    withPhoneNumber,
}: IdentifierFieldProps) {
    const config = useConfig();

    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value;

    const country: CountryCode = React.useMemo(() => {
        if (currentValue?.value) {
            const parsed = parsePhoneNumberFromString(currentValue.value);
            if (parsed?.country) return parsed.country;
        }
        if (config.locale && isSupportedCountry(config.locale)) return config.locale;
        if (config.countryCode && isSupportedCountry(config.countryCode.toLocaleUpperCase()))
            return config.countryCode.toLocaleUpperCase() as CountryCode;
        if (config.language && isSupportedCountry(config.language.toLocaleUpperCase()))
            return config.language.toLocaleUpperCase() as CountryCode;
        return 'FR' satisfies CountryCode;
    }, [currentValue]);

    const asYouType = (inputValue?: string): IdentifierData => {
        if (!inputValue) return {};
        const formatter = new AsYouType(country);
        const formatted = formatter.input(inputValue);
        const parsed = parsePhoneNumberFromString(formatted, country);
        const isValid = parsed?.number ? isValidPhoneNumber(parsed.number) : false;
        return {
            country: parsed?.country ?? formatter.country ?? country,
            formatted,
            isValid,
            type: 'tel',
            value: parsed?.number ?? inputValue,
        };
    };

    const changeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue: IdentifierData = {
            ...currentValue,
            ...specializeRawIdentifier(withPhoneNumber, event.target.value, asYouType),
        };
        onChange({ value: newValue, isDirty: false });
    };

    const error = validation && isValidatorError(validation) ? validation.error : undefined;

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            {...{ error }}
            showLabel={showLabel}
            required={required}
        >
            <Input
                id={inputId}
                name={path}
                type="text"
                value={currentValue?.formatted ?? currentValue?.value ?? ''}
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
    );
}

function computeDefaultKeyLabel({ loginTypeAllowed }: Config, isWebAuthnLogin: boolean) {
    if ((loginTypeAllowed.email && loginTypeAllowed.phoneNumber) || isWebAuthnLogin) {
        return { k: 'identifier', l: 'identifier' };
    } else if (loginTypeAllowed.email) {
        return { k: 'email', l: 'email' };
    } else if (loginTypeAllowed.phoneNumber) {
        return { k: 'phone_number', l: 'phoneNumber' };
    } else {
        return { k: 'identifier', l: 'identifier' };
    }
}

export default function identifierField(
    {
        key,
        label,
        isWebAuthnLogin = false,
        ...props
    }: Optional<FieldDefinition<string, IdentifierData>, 'key' | 'label'> &
        IdentifierFieldExtraProps,
    config: Config
) {
    const { k, l } = computeDefaultKeyLabel(config, isWebAuthnLogin);

    return createField<string, IdentifierData, IdentifierFieldProps>({
        ...props,
        key: key ?? k,
        label: label ?? l,
        format: {
            bind: value =>
                specializeRawIdentifier(
                    props.withPhoneNumber,
                    value,
                    () => ({ isValid: isValidPhoneNumber(value ?? '') }) satisfies IdentifierData,
                    () => ({ isValid: isEmail(value ?? '') }) satisfies IdentifierData,
                    () => ({ isValid: true }) satisfies IdentifierData
                ),
            unbind: value => {
                const identifier = isRichFormValue(value, 'raw') ? value.raw : value;
                return identifier
                    ? specializeRefinedIdentifier(
                          identifier,
                          v => v?.value ?? null,
                          v => v?.value ?? null,
                          v => v?.value ?? null
                      )
                    : null;
            },
        },
        validator: new Validator<IdentifierData, unknown>({
            rule: (value: IdentifierData) =>
                specializeRefinedIdentifier<boolean>(
                    value,
                    v => v.isValid ?? !props.withPhoneNumber,
                    v => isEmail(v.value ?? ''),
                    v => v.isValid ?? true
                ) ?? true,
            hint: value =>
                specializeRefinedIdentifier(
                    value,
                    () => 'phone',
                    () => 'email',
                    () => 'identifier'
                ),
        }),
        component: IdentifierField,
        extendedParams: {
            withPhoneNumber: props.withPhoneNumber,
        },
    });
}
