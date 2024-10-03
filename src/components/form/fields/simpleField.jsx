import React from 'react';

import { FormGroup, Input } from '../formControlsComponent';
import { createField } from '../fieldCreator';

const SimpleField = props => {
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

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            {...(({ error }) => ({ error }))(validation)}
            showLabel={showLabel}
            required={required}
        >
            <Input
                id={inputId}
                name={path}
                type={type}
                value={value || ''}
                placeholder={placeholder}
                autoComplete={autoComplete}
                title={label}
                required={required}
                readOnly={readOnly}
                hasError={!!validation.error}
                onChange={event => onChange({ value: event.target.value })}
                onBlur={() => onChange({ isDirty: true })}
                data-testid={path} />
        </FormGroup>
    );
};

export const simpleField = ({ type, placeholder, ...config }) => createField({
    ...config,
    component: SimpleField,
    extendedParams: {
        type,
        placeholder,
    }
});

export default simpleField;
