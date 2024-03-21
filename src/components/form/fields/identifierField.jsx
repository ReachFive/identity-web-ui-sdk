import React from 'react';

import * as libphonenumber from 'libphonenumber-js';

import { email, Validator } from '../../../core/validation';

import { FormGroup, Input } from '../formControlsComponent';
import { createField } from '../fieldCreator';

/*
* All possible Identifier data is in the `value` prop, they should all be preserved when the type changes.
* {
*   raw: string,
*   type: 'tel' | 'email' | 'other',
*   country: string,
*   formatted: string,
*   isValid: boolean,
* }
*/

function specializeRawIdentifier(withPhoneNumber, inputValue, telCall = () => undefined, emailCall = () => undefined, otherCall = () => undefined) {
    if (withPhoneNumber && (/^\+?[0-9]+$/.test(inputValue))) {
        return ({
            raw: inputValue,
            ...telCall(inputValue),
            type: 'tel',
        })
    } else if (/@/.test(inputValue)) {
        return ({
            raw: inputValue,
            ...emailCall(inputValue),
            type: 'email',
        })
    } else {
        return ({
            raw: inputValue,
            ...otherCall(inputValue),
            type: 'text',
        })
    }
}

function specializeRefinedIdentifier(identifier, telCall = x => x, emailCall = x => x, otherCall = x => x) {
    if (identifier.type === 'tel')
        return telCall(identifier)
    else if (identifier.type === 'email')
        return emailCall(identifier)
    else return otherCall(identifier)
}

class IdentifierField extends React.Component {
    componentDidMount() {
        const { userInput, country } = this.props.value;

        if (!userInput) return

        try {
            const parsed = libphonenumber.parse(userInput, country);
            const phoneValue = country === parsed.country
                ? libphonenumber.format(parsed, 'National')
                : userInput;

            this.asYouType(phoneValue);
        } catch (e) {
            console.error(e)
        }
    }

    componentWillUnmount() {
        this.unmounted = true
    }

    asYouType = (inputValue) => {
        const {value: {country}} = this.props;

        const phone = new libphonenumber.AsYouType(country).input(inputValue);
        const formatted = libphonenumber.format(phone, country, 'International');
        const isValid = libphonenumber.isValidNumber(phone, country);

        return {
            country,
            formatted,
            isValid,
            raw: isValid ? phone : inputValue,
        }
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
            readOnly,
            withPhoneNumber
        } = this.props;

        return <FormGroup
            inputId={inputId}
            labelText={label}
            {...(({ error }) => ({ error }))(validation)}
            showLabel={this.props.showLabel}>
            <Input
                id={inputId}
                name={path}
                type='text'
                value={value.raw || ''}
                placeholder={placeholder}
                title={label}
                autoComplete={this.props.autoComplete}
                required={required}
                readOnly={readOnly}
                hasError={!!validation.error}
                onChange={event =>
                    this.props.onChange({
                        value: {
                            ...this.props.value,
                            ...specializeRawIdentifier(withPhoneNumber, event.target.value, this.asYouType)
                        }
                    })
                }
                onBlur={() => this.props.onChange({ isDirty: true })}
                data-testid={path}/>
        </FormGroup>
    }
}

export default function identifierField(props, config) {
    return createField({
        ...props,
        key: 'identifier',
        label: 'identifier',
        format: {
            bind: x => specializeRawIdentifier(props.withPhoneNumber,
                x,
                () => ({ country: config.countryCode, isValid: true }),
                () => ({ country: config.countryCode, isValid: true }),
                () => ({ country: config.countryCode, isValid: true }),
                ),
            unbind: x => specializeRefinedIdentifier(
                x,
                v => v.formatted || v.raw,
                v => v.raw,
                v => v.raw)
        },
        validator: new Validator({
            rule: value => specializeRefinedIdentifier(value,
                v => v.isValid || !props.withPhoneNumber,
                v => email.rule(v.raw),
                v => v.isValid),
            hint: value => specializeRefinedIdentifier(value,
                () => 'phone',
                () => 'email',
                () => 'identifier')
        }),
        component: IdentifierField,
        extendedParams: {withPhoneNumber: props.withPhoneNumber}
    });
}
