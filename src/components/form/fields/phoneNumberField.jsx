import React from 'react';

import pick from 'lodash-es/pick';

import { Validator } from '../../../core/validation';

import { Input, FormGroup } from '../formControlsComponent';
import { createField } from '../fieldCreator';

class PhoneNumberField extends React.Component {
    state = {
        libphonenumber: null
    };

    componentDidMount() {
        import('libphonenumber-js').then(libphonenumber => {
            if (this.unmounted) return;

            const { phone, country } = this.props.value;

            this.setState({ libphonenumber });

            try {
                const parsed = libphonenumber.parse(phone, country);
                const phoneValue = country === parsed.country
                    ? libphonenumber.format(parsed, 'National')
                    : phone;

                this.asYouType(phoneValue);
            } catch (e) { }
        })
    }

    componentWillUnmount() {
        this.unmounted = true
    }

    asYouType = (inputValue) => {
        const { onChange, value: { country } } = this.props;
        const { libphonenumber } = this.state;

        const phone = libphonenumber ? new libphonenumber.AsYouType(country).input(inputValue) : inputValue;
        const formatted = libphonenumber ? libphonenumber.format(phone, country, 'International') : undefined;
        const isValid = libphonenumber ? libphonenumber.isValidNumber(phone, country) : true;

        onChange({
            value: {
                country,
                phone,
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
            onChange,
            showLabel,
            inputId,
            required = true,
            label,
            placeholder = label
        } = this.props;
        const { phone } = value;

        return <FormGroup
            inputId={inputId}
            labelText={label}
            {...pick(validation, 'error')}
            showLabel={showLabel}>
            <Input
                id={inputId}
                name={path}
                type="tel"
                value={phone || ''}
                placeholder={placeholder}
                title={label}
                required={required}
                hasError={!!validation.error}
                onChange={event => this.asYouType(event.target.value)}
                onBlur={() => onChange({ isDirty: true })} />
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
                country: config.countryCode,
                phone: x,
                isValid: true
            }),
            unbind: x => x.formatted || x.phone
        },
        validator: new Validator({
            rule: value => value.isValid,
            hint: 'phone'
        }),
        component: PhoneNumberField
    });
}
