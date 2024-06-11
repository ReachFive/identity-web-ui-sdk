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

/**
 * If neither country nor defaultCountry are specified then the phone number can only be input in "international" format.
 */
export interface PhoneNumberFieldProps extends FieldComponentProps<Value> {
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
     * If country is specified and international property is true then the phone number can only be input in "international" format for that country.
     */
    international?: boolean
    /**
     * If locale is specified then translate component using the given language.
     * @see https://gitlab.com/catamphetamine/react-phone-number-input/tree/master/locale
     */
    locale?: string
    /**
     * If country is specified and international property is true then the phone number can only be input in "international" format for that country.
     * By default, the "country calling code" part (example: +1 when country is US) is not included in the input field.
     * To change that, pass withCountryCallingCode property, and it will include the "country calling code" part in the input field.
     */
    withCountryCallingCode?: boolean
    /**
     * Whether displayed the phone input with a country selector or not.
     */
    withCountrySelect?: boolean
}

const PhoneNumberField = (props: PhoneNumberFieldProps) => {
    const {
        defaultCountry,
        country,
        inputId,
        international = true,
        label,
        locale = 'en',
        onChange,
        path,
        placeholder = label,
        required = true,
        showLabel,
        validation = {},
        value,
        withCountryCallingCode = true,
        withCountrySelect = true
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
                    country={country}
                    value={currentValue}
                    placeholder={placeholder}
                    required={required}
                    data-testid="phone_number"
                    onChange={handlePhoneChange}
                    labels={labels}
                    international={international}
                    defaultCountry={defaultCountry}
                    withCountryCallingCode={withCountryCallingCode}
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
        defaultCountry,
        country,
        international,
        withCountryCallingCode,
        withCountrySelect,
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
                return {
                    country: phoneNumber?.country,
                    raw: phoneNumber?.number ?? '' as Value,
                    isValid: phoneNumber?.isValid() ?? false
                }
            },
            unbind: formValue => {
                return (typeof formValue === 'object' && 'raw' in formValue ? formValue.raw : formValue) ?? null
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
            defaultCountry: defaultCountry ?? (isValidCountryCode(config.countryCode) ? config.countryCode : undefined),
            country,
            international,
            withCountryCallingCode,
            withCountrySelect,
            locale: config.language,
        }
    });
}

export default phoneNumberField
