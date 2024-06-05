import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { createField } from '../fieldCreator';
import { FormGroup } from '../formControlsComponent';
import { Validator } from '../../../core/validation';

class PhoneNumberField extends React.Component {
    handlePhoneChange = (value) => {
        const { onChange, value: currentValue } = this.props;
        const country = currentValue && currentValue.country ? currentValue.country : this.props.countryCode;
        onChange({
            value: {
                country,
                raw: value,
                isValid: value && value.length > 0
            }
        });
    }

    render() {
        const {
            path,
            value = {}, // Ensure value is not undefined
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
                showLabel={this.props.showLabel}
            >
                <PhoneInput
                    id={inputId}
                    name={path}
                    country={value.country || countryCode}
                    value={value.raw || ''}
                    placeholder={placeholder}
                    required={required}
                    data-testid="phone_number"
                    onChange={this.handlePhoneChange}
                    onBlur={() => this.props.onChange({ ...value, isDirty: true })}
                />
            </FormGroup>
        );
    }
}

export default function phoneNumberField(props, config) {
    return createField({
        ...props,
        key: 'phone_number',
        label: 'phoneNumber',
        format: {
            bind: x => ({
                country: x?.country || config.countryCode,
                raw: x?.raw || x || '',
                isValid: true
            }),
            unbind: x => ({ country: x?.country, raw: x?.formatted || x?.raw || '' })
        },
        validator: new Validator({
            rule: value => value && value.raw && value.raw.length > 0,
            hint: 'phone'
        }),
        component: PhoneNumberField
    });
}
