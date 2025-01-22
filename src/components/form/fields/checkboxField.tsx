import React from 'react';

import { createField, type FieldComponentProps, type FieldProps } from '../fieldCreator';
import { Checkbox } from '../formControlsComponent';
import { isValidatorError } from '../../../core/validation';
import { isRichFormValue } from '../../../helpers/utils';

export interface CheckboxFieldProps extends FieldComponentProps<boolean> {}

function CheckboxField({ value, onChange, label, path, required, validation }: CheckboxFieldProps) {
    const checked = isRichFormValue(value, 'raw') ? value.raw : value

    const onToggle = () => onChange({
        value: !value,
        isDirty: true
    })

    const error = validation && isValidatorError(validation) ? validation.error : undefined

    return (
        <Checkbox
            value={checked ? String(checked) : undefined}
            onToggle={onToggle}
            name={path}
            label={label}
            error={error}
            required={required}
            data-testid={path}
        />
    )
};

export default function checkboxField(props: Omit<FieldProps<boolean | string, boolean, CheckboxFieldProps>, 'format' | 'component'>) {
    return createField<boolean | string, boolean, CheckboxFieldProps>({
        ...props,
        format: {
            bind: value => !!value,
            unbind: value => value ? (isRichFormValue(value, 'raw') ? value.raw : value) : false
        },
        component: CheckboxField
    });
}
