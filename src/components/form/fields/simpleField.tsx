import React from 'react';

import { FormGroup, Input } from '../formControlsComponent';
import { createField, FieldComponentProps, FieldProps } from '../fieldCreator';
import { isRichFormValue } from '../../../helpers/utils';

type SimpleFieldOptions = {
    placeholder?: React.HTMLAttributes<HTMLInputElement>['placeholder']
    type?: React.HTMLInputTypeAttribute
}

interface SimpleFieldProps extends FieldComponentProps<string, SimpleFieldOptions> {}

const SimpleField = (props: SimpleFieldProps) => {
    const {
        autoComplete,
        path,
        value,
        validation = {},
        onChange,
        showLabel,
        inputId,
        label,
        placeholder = label,
        readOnly,
        required,
        type
    } = props;

    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value

    const error = typeof validation === 'object' && 'error' in validation ? validation.error : undefined

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            {...{ error }}
            showLabel={showLabel}
            required={required}
        >
            <Input
                id={inputId}
                name={path}
                type={type}
                value={currentValue ?? ''}
                placeholder={placeholder}
                autoComplete={autoComplete}
                title={label}
                required={required}
                readOnly={readOnly}
                hasError={!!error}
                onChange={event => onChange({ value: event.target.value })}
                onBlur={() => onChange({ isDirty: true })}
                data-testid={path}
            />
        </FormGroup>
    );
};

export const simpleField = ({ placeholder, type, ...props }: Omit<FieldProps<string, string, SimpleFieldProps>, 'component' | 'extendedParams'> & SimpleFieldOptions) => {
    return createField<string, string, SimpleFieldProps>({
        ...props,
        component: SimpleField,
        extendedParams: {
            placeholder,
            type,
        }
    })
};

export default simpleField;
