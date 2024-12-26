import React from 'react';

import { createField, type FieldComponentProps, type FieldDefinition } from '../fieldCreator';
import { RadioGroup, type RadioGroupProps } from '../formControlsComponent';
import { isRichFormValue } from '../../../helpers/utils';

type Value = RadioGroupProps['value']

type RadioGroupOptions = {
    options: RadioGroupProps['options']
}

export interface RadioboxFieldProps extends FieldComponentProps<Value>, RadioGroupOptions {}

const RadioboxField = (props: RadioboxFieldProps) => {
    const { label, value, ...radioProps } = props

    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value

    return <RadioGroup labelText={label} value={currentValue} {...radioProps} />
}

export default function radioboxField({ defaultValue, options, ...props }: FieldDefinition<string, Value> & RadioGroupOptions) {
    return createField<string, Value, RadioboxFieldProps, RadioGroupOptions>({
        ...props,
        defaultValue: defaultValue ?? (options.length === 1 ? String(options[0].value) : undefined),
        component: RadioboxField,
        extendedParams: i18n => ({
            options: options.map(({ label, value }) => ({
                value,
                label:
                    label
                        ? typeof label === 'string'
                            ? i18n(label)
                            : label
                        : typeof value === 'string'
                            ? i18n(value)
                            : value
            }))
        })
    });
}
