import React from 'react';

import * as libphonenumber from 'libphonenumber-js';

import { Validator } from '../../../core/validation';

import { Input, FormGroup } from '../formControlsComponent';
import { createField } from '../fieldCreator';

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
            country,
            raw: phone,
            formatted,
            isValid
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
            placeholder = label
        } = this.props;
        
        return <FormGroup
            inputId={inputId}
            labelText={label}
            {...(({ error }) => ({ error }))(validation)}
            showLabel={this.props.showLabel}>
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
                data-testid={path} />
        </FormGroup>
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
            rule: value => libphonenumber.isValidNumber(value.raw, value.country),
            hint: 'phone'
        }),
        component: PhoneNumberField
    });
}
