import React from 'react';

import * as libphonenumber from 'libphonenumber-js';
import { getCountryCallingCode } from 'libphonenumber-js';
import { countries } from 'iso-3166-1-alpha-2';

import { Validator } from '../../../core/validation';

import { Input, FormGroup } from '../formControlsComponent';
import { createField } from '../fieldCreator';

const countryCallingCodes = Object.keys(countries).reduce((result, countryCode) => {
    try {
        const callingCode = getCountryCallingCode(countryCode);
        result[countryCode] = `+${callingCode}`;
    } catch (error) {
        
    }
    return result;
}, {});

class PhoneNumberField extends React.Component {
    componentDidMount() {
        const { raw, country } = this.props.value;
        if (typeof raw === 'string') {
            try {
                const parsed = libphonenumber.parse(raw, country);
                const phoneValue = country === parsed.country
                    ? libphonenumber.format(parsed, 'National')
                    : raw;
        
                this.asYouType(phoneValue);
            } catch (e) {
                console.error(e)
            }
        }
    }

    componentWillUnmount() {
        this.unmounted = true
    }

    asYouType = (inputValue) => {
        const { value: { country } } = this.props;

        const phone = new libphonenumber.AsYouType(country).input(inputValue);
        const formatted = libphonenumber.format(phone, country, 'International');
        const isValid = libphonenumber.isValidNumber(phone, country);

        this.props.onChange({
            value: {
                country,
                raw: phone,
                formatted,
                isValid
            }
        });
    }

    render() {
        const {
            path,
            value,
            validation = {},
            inputId,
            required = true,
            label,
            placeholder = label,
            countryCode 
        } = this.props;
        
        return (
            <FormGroup
                inputId={inputId}
                labelText={label}
                {...(({ error }) => ({ error }))(validation)}
                showLabel={this.props.showLabel}>
                <select value={countryCode} onChange={this.handleCountryChange}>
                    {Object.entries(countryCallingCodes).map(([countryCode, callingCode]) => (
                        <option value={countryCode} key={countryCode}>
                            {countryCode} ({callingCode})
                        </option>
                    ))}
                </select>
                <Input
                    id={inputId}
                    name={path}
                    type="tel"
                    value={value.raw || ''}
                    placeholder={placeholder}
                    title={label}
                    required={required}
                    hasError={!!validation.error}
                    onChange={event => this.asYouType(event.target.value)}
                    onBlur={() => this.props.onChange({ isDirty: true })}
                    data-testid={path} />
            </FormGroup>
        );
    }

    handleCountryChange = (event) => {
        this.props.onChange({
            value: {
                country: event.target.value,
                raw: this.props.value.raw,
                formatted: this.props.value.formatted,
                isValid: this.props.value.isValid
            }
        });
    }
}

export default function phoneNumberField(props, config) {
    return createField({
        ...props,
        key: 'phone_number',
        label: 'phoneNumber',
        format: {
            bind: x => ({
                country: config.countryCode,
                raw: x,
                isValid: true
            }),
            unbind: x => x.formatted || x.raw
        },
        validator: new Validator({
            rule: value => value.isValid,
            hint: 'phone'
        }),
        component: PhoneNumberField
    });
}
