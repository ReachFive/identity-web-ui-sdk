import React from 'react';
import { parsePhoneNumberFromString, AsYouType, isValidNumber, getCountryCallingCode, getCountries } from 'libphonenumber-js';
import { Validator } from '../../../core/validation';
import { Input, FormGroup, Select } from '../formControlsComponent';
import { createField } from '../fieldCreator';

const countryCallingCodes = getCountries().reduce((result, countryCode) => {
    const callingCode = getCountryCallingCode(countryCode);
    result[countryCode] = `+${callingCode}`;
    return result;
}, {});

class PhoneNumberField extends React.Component {
    componentDidMount() {
        const { raw, country } = this.props.value;
        if (typeof raw === 'string') {
            try {
                const parsed = parsePhoneNumberFromString(raw, country);
                const phoneValue = country === parsed.country
                    ? parsed.formatNational()
                    : raw;
                this.asYouType(phoneValue);
            } catch (e) {
                console.error(e);
            }
        }
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    asYouType = (inputValue) => {
        const { value: { country } } = this.props;

        const phone = new AsYouType(country).input(inputValue);
        const parsedPhone = parsePhoneNumberFromString(phone, country);
        const formatted = parsedPhone ? parsedPhone.formatInternational() : phone;
        const isValid = parsedPhone ? isValidNumber(parsedPhone) : false;

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

        const options = Object.entries(countryCallingCodes).map(([code, callingCode]) => ({
            label: `${code} (${callingCode})`,
            value: code
        }));

        return (
            <FormGroup
                inputId={inputId}
                labelText={label}
                {...(({ error }) => ({ error }))(validation)}
                showLabel={this.props.showLabel}
            >
                <Select 
                    value={countryCode} 
                    onChange={this.handleCountryChange}
                    options={options}
                    placeholder="Select country"
                />
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
                    onBlur={() => this.props.onChange({ ...value, isDirty: true })}
                    data-testid={path}
                />
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
                country: x.country || config.countryCode,
                raw: x.raw || x,
                isValid: true
            }),
            unbind: x => ({ country: x.country, raw: x.formatted || x.raw })
        },
        validator: new Validator({
            rule: value => isValidNumber(value.raw, value.country),
            hint: 'phone'
        }),
        component: PhoneNumberField
    });
}
