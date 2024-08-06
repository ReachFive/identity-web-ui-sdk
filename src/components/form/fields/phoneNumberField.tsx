import React, { useEffect, useState } from 'react';
import { default as PhoneInputWithCountrySelect, isSupportedCountry, parsePhoneNumber } from 'react-phone-number-input'
import { default as PhoneInputWithoutCountrySelect } from 'react-phone-number-input/input';
import type { Country, Labels, Value } from 'react-phone-number-input';
import styled from 'styled-components';

import styles from 'react-phone-number-input/style.css'; // import raw css using `rollup-plugin-import-css'`

import { FieldComponentProps, FieldCreator, createField } from '../fieldCreator';
import { FormGroup } from '../formControlsComponent';
import { Validator } from '../../../core/validation';
import { Config } from '../../../types';
import { Input } from '../formControlsComponent';

function isValidCountryCode(code?: string): code is Country {
    return typeof code === 'string' && isSupportedCountry(code)
}

const PhoneInputStyles = styled.div`
    ${styles}

    --PhoneInput-color--focus: ${props => props.theme.primaryColor};
    --PhoneInputCountrySelect-marginRight: ${props => props.theme.spacing}px;
    --PhoneInputCountrySelectArrow-marginLeft: var(--PhoneInputCountrySelect-marginRight);
    --PhoneInputCountrySelectArrow-borderWidth: 2px;
	--PhoneInputCountrySelectArrow-transform: rotate(45deg);
    --PhoneInputCountrySelectArrow-width: 0.3em;
    --PhoneInputCountryFlag-height: ${props => props.theme.input.height - ((props.theme.input.paddingY + props.theme.input.borderWidth) * 2)}px;

`

function importLocale(locale: string) {
    return import(`../../../../node_modules/react-phone-number-input/locale/${locale}.json.js`)
        .then(module => module.default as Labels);
}

export type PhoneNumberOptions = {
    /**
     * If `withCountrySelect` property is `true` then the user can select the country for the phone number. Must be a supported {@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements country code}.
     * @default false
     */
    withCountrySelect?: boolean
}

/**
 * If neither country nor defaultCountry are specified then the phone number can only be input in "international" format.
 */
export interface PhoneNumberFieldProps extends FieldComponentProps<Value>, PhoneNumberOptions {
    /**
     * If defaultCountry is specified then the phone number can be input both in "international" format and "national" format.
     * A phone number that's being input in "national" format will be parsed as a phone number belonging to the defaultCountry.
     */
    defaultCountry?: Country
    /**
     * If country is specified then the phone number can only be input in "national" (not "international") format,
     * and will be parsed as a phonenumber belonging to the country.
     */
    country?: Country
    /**
     * If locale is specified then translate component using the given language.
     * @see https://gitlab.com/catamphetamine/react-phone-number-input/tree/master/locale
     */
    locale?: string
}

const PhoneNumberField = (props: PhoneNumberFieldProps) => {
    const {
        country,
        inputId,
        label,
        locale = 'en',
        onChange,
        path,
        placeholder = label,
        required = true,
        showLabel,
        validation = {},
        value,
        withCountrySelect = false,
    } = props;

    const [labels, setLabels] = useState<Labels>()

    useEffect(() => {
        async function fetchLabels() {
            const result = await importLocale(locale)
            if (!ignore) {
                setLabels(result)
            }
        }
        /**
         * @node the ignore variable which is initialized to false, and is set to true during cleanup.
         * This ensures your code doesn’t suffer from “race conditions”: network responses may arrive in a different order than you sent them.
         */
        let ignore = false;
        fetchLabels();
        return () => {
            ignore = true;
        }
    }, [locale])

    const currentValue = value !== null && typeof value === 'object' && 'raw' in value ? value.raw : value
    const error = typeof validation === 'object' && 'error' in validation ? validation.error : undefined

    const handlePhoneChange = (value: Value) => {
        onChange({
            value,
        });
    }

    const PhoneInput = withCountrySelect ? PhoneInputWithCountrySelect : PhoneInputWithoutCountrySelect

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            {...{ error }}
            showLabel={showLabel}
        >
            <PhoneInputStyles>
                <PhoneInput
                    id={inputId}
                    name={path}
                    value={currentValue}
                    placeholder={placeholder}
                    required={required}
                    data-testid="phone_number"
                    onChange={handlePhoneChange}
                    labels={labels}
                    international={true}
                    withCountryCallingCode={true}
                    {...(withCountrySelect
                        ? ({
                            defaultCountry: country,
                        })
                        : ({
                            country,
                        })
                    )}
                    inputComponent={Input}
                    hasError={!!error}
                />
            </PhoneInputStyles>
        </FormGroup>
    );
}

const phoneNumberField = (
    {
        key = 'phone_number',
        label = 'phoneNumber',
        ...props
    }: Partial<PhoneNumberFieldProps>,
    config: Config
): FieldCreator<Value, PhoneNumberFieldProps> => {
    return createField<string, Value, PhoneNumberFieldProps>({
        component: PhoneNumberField,
        ...props,
        key,
        label,
        format: {
            bind: (value) => {
                const phoneNumber = value ? parsePhoneNumber(value) : undefined
                console.log("VALUE: " +value)
                console.log("PHONE NUMBER: " +phoneNumber)
                console.log("PHNE NUMBER NUMBER" + phoneNumber?.number)
                console.log("RAW" + (phoneNumber?.number ?? '' as Value))
                return {
                    country: phoneNumber?.country,
                    raw: phoneNumber?.number ?? '' as Value,
                    isValid: phoneNumber?.isValid() ?? false
                }
            },
            unbind: formValue => {
                console.log("FORM RAW" + JSON.stringify(formValue, null,2))
                return (
                    typeof formValue === 'object' && 'raw' in formValue ?
                        (formValue.raw == '' ? null : formValue.raw) :
                        formValue) ?? null
            }
        },
        validator: new Validator<Value>({
            rule: value => {
                const phoneNumber = value ? parsePhoneNumber(value) : undefined
                return phoneNumber?.isValid() ?? false
            },
            hint: 'phone'
        }),
        extendedParams: {
            country: isValidCountryCode(config.countryCode) ? config.countryCode : undefined,
            locale: config.language,
        }
    });
}

export default phoneNumberField
