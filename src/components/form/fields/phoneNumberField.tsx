import React, { useEffect, useState } from 'react';
import type { Country, Labels, Value } from 'react-phone-number-input';
import {
    default as PhoneInputWithCountrySelect,
    isSupportedCountry,
    parsePhoneNumber,
} from 'react-phone-number-input';
import { default as PhoneInputWithoutCountrySelect } from 'react-phone-number-input/input';
import styles from 'react-phone-number-input/style.css';

import { createGlobalStyle } from 'styled-components';

// import raw css using `rollup-plugin-import-css'`

import { Validator, isValidatorError } from '../../../core/validation';
import { isRichFormValue } from '../../../helpers/utils.ts';
import { Config, Optional } from '../../../types';
import {
    createField,
    type FieldComponentProps,
    type FieldCreator,
    type FieldDefinition,
} from '../fieldCreator';
import { FormGroup, Input } from '../formControlsComponent';

function isValidCountryCode(code?: string): code is Country {
    return typeof code === 'string' && isSupportedCountry(code);
}

const ReactPhoneNumberInputStyle = createGlobalStyle`
    ${styles}

    :root {
        --PhoneInput-color--focus: ${props => props.theme.primaryColor};
        --PhoneInputCountrySelect-marginRight: ${props => props.theme.spacing}px;
        --PhoneInputCountrySelectArrow-marginLeft: var(--PhoneInputCountrySelect-marginRight);
        --PhoneInputCountrySelectArrow-borderWidth: 2px;
        --PhoneInputCountrySelectArrow-color: ${props => props.theme.textColor};
        --PhoneInputCountrySelectArrow-transform: rotate(45deg);
        --PhoneInputCountrySelectArrow-width: 0.3em;
        --PhoneInputCountryFlag-height: ${props => props.theme.input.height - (props.theme.input.paddingY + props.theme.input.borderWidth) * 2}px;
    }
`;

function importLocale(locale: string) {
    return import(
        `../../../../node_modules/react-phone-number-input/locale/${locale}.json.js`
    ).then((module: { default: Labels }) => module.default);
}

export type PhoneNumberOptions = {
    /**
     * If defaultCountry is specified then the phone number can be input both in "international" format and "national" format.
     * A phone number that's being input in "national" format will be parsed as a phone number belonging to the defaultCountry.
     */
    defaultCountry?: Country;
    /**
     * If country is specified then the phone number can only be input in "national" (not "international") format,
     * and will be parsed as a phone number belonging to the country.
     */
    country?: Country;
    /**
     * If locale is specified then translate component using the given language.
     * @see https://gitlab.com/catamphetamine/react-phone-number-input/tree/master/locale
     */
    locale?: string;
    /**
     * If `withCountryCallingCode` property is explicitly set to true then the "country calling code" part (e.g. "+1" when country is "US") is included in the input field (but still isn't editable).
     * @default true
     */
    withCountryCallingCode?: boolean;
    /**
     * If `withCountrySelect` property is `true` then the user can select the country for the phone number. Must be a supported {@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements country code}.
     * @default false
     */
    withCountrySelect?: boolean;
};

/**
 * If neither country nor defaultCountry are specified then the phone number can only be input in "international" format.
 */
export interface PhoneNumberFieldProps extends FieldComponentProps<Value>, PhoneNumberOptions {}

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
        validation,
        value,
        withCountryCallingCode = true,
        withCountrySelect = false,
    } = props;

    const [labels, setLabels] = useState<Labels>({});
    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value;
    const error = validation && isValidatorError(validation) ? validation.error : undefined;

    useEffect(() => {
        async function fetchLabels() {
            const result = await importLocale(locale);
            if (!ignore) {
                setLabels(result);
            }
        }
        /**
         * @note the ignore variable which is initialized to false, and is set to true during cleanup.
         * This ensures your code doesn’t suffer from “race conditions”: network responses may arrive in a different order than you sent them.
         */
        let ignore = false;
        fetchLabels();
        return () => {
            ignore = true;
        };
    }, [locale]);

    const handlePhoneChange = (value: Value) => {
        onChange({
            value,
        });
    };

    const PhoneInput = withCountrySelect
        ? PhoneInputWithCountrySelect
        : PhoneInputWithoutCountrySelect;

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            {...{ error }}
            showLabel={showLabel}
            required={required}
        >
            <ReactPhoneNumberInputStyle />
            <PhoneInput
                id={inputId}
                name={path}
                value={currentValue}
                placeholder={placeholder}
                required={required}
                data-testid={path}
                onChange={handlePhoneChange}
                labels={labels}
                international={true}
                withCountryCallingCode={withCountryCallingCode}
                {...(withCountrySelect
                    ? {
                          defaultCountry: country,
                      }
                    : {
                          country,
                      })}
                inputComponent={Input}
                hasError={!!error}
            />
        </FormGroup>
    );
};

const phoneNumberField = (
    {
        key = 'phone_number',
        label = 'phoneNumber',
        defaultCountry,
        country,
        locale,
        withCountryCallingCode,
        withCountrySelect,
        ...props
    }: Optional<FieldDefinition<string, Value>, 'key' | 'label'> & PhoneNumberOptions,
    config: Config
): FieldCreator<Value, PhoneNumberFieldProps> => {
    return createField<string, Value, PhoneNumberFieldProps>({
        component: PhoneNumberField,
        ...props,
        key,
        label,
        format: {
            bind: value => {
                const phoneNumber = value ? parsePhoneNumber(value) : undefined;
                return {
                    country: phoneNumber?.country,
                    raw: phoneNumber?.number ?? ('' as Value),
                    isValid: phoneNumber?.isValid() ?? false,
                };
            },
            unbind: formValue => {
                const value =
                    typeof formValue === 'object' && 'raw' in formValue ? formValue.raw : formValue;
                return value == '' ? undefined : value;
            },
        },
        validator: new Validator<Value, unknown>({
            rule: value => {
                const phoneNumber = value ? parsePhoneNumber(value) : undefined;
                return phoneNumber?.isValid() ?? false;
            },
            hint: 'phone',
        }),
        extendedParams: {
            defaultCountry,
            country:
                country ??
                (isValidCountryCode(config.countryCode) ? config.countryCode : undefined),
            locale: locale ?? config.language,
            withCountryCallingCode,
            withCountrySelect,
        },
    });
};

export default phoneNumberField;
