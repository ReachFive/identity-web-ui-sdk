import React from 'react';

import { isValidatorError } from '../../../core/validation';
import { isRichFormValue } from '../../../helpers/utils';
import { createField, type FieldComponentProps, type FieldDefinition } from '../fieldCreator';
import { FormGroup, Input } from '../formControlsComponent';

type SimpleFieldOptions = {
    placeholder?: React.InputHTMLAttributes<HTMLInputElement>['placeholder'];
    type?: React.HTMLInputTypeAttribute;
};

export interface SimpleFieldProps extends FieldComponentProps<string, SimpleFieldOptions> {}

const SimpleField = (props: SimpleFieldProps) => {
    const {
        autoComplete,
        path,
        value,
        validation,
        onChange,
        showLabel,
        inputId,
        label,
        placeholder = label,
        readOnly,
        required,
        type,
    } = props;

    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value;

    const error = validation && isValidatorError(validation) ? validation.error : undefined;

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

export const simpleField = ({
    placeholder,
    type,
    ...props
}: FieldDefinition<string | number, string> & SimpleFieldOptions) => {
    return createField<string | number, string, SimpleFieldProps>({
        ...props,
        component: SimpleField,
        extendedParams: {
            placeholder,
            type,
        },
    });
};

export default simpleField;
