import React from 'react';

import { isValidatorError } from '../../../core/validation';
import { isRichFormValue } from '../../../helpers/utils';
import { createField, type FieldComponentProps, type FieldDefinition } from '../fieldCreator';
import { FormGroup, Select, type SelectProps } from '../formControlsComponent';

type Value = SelectProps['value'];

type SelectOptions = {
    values: SelectProps['options'];
};

export interface SelectFieldProps extends FieldComponentProps<Value, SelectOptions> {}

const SelectField = (props: SelectFieldProps) => {
    const { value = '', validation, onChange, inputId, label, placeholder = label } = props;

    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value;

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
        onChange({
            value: event.target.value,
        });

    const handleBlur = () => onChange({ isDirty: true });

    const error = validation && isValidatorError(validation) ? validation.error : undefined;

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            {...{ error }}
            showLabel={props.showLabel}
            required={props.required}
        >
            <Select
                id={inputId}
                name={props.path}
                required={props.required}
                value={currentValue}
                hasError={!!error}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                options={props.values}
                data-testid={props.path}
            />
        </FormGroup>
    );
};

export default function selectField({
    values,
    ...config
}: FieldDefinition<string, Value> & SelectOptions) {
    return createField<string, Value, SelectFieldProps, SelectOptions>({
        ...config,
        component: SelectField,
        extendedParams: i18n => ({
            values: values.map(({ label, value }) => ({ value, label: i18n(label || value) })),
        }),
    });
}
