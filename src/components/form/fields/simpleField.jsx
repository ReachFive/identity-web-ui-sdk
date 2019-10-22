import React from 'react';
import pick from 'lodash-es/pick';

import { FormGroup, Input } from '../formControlsComponent';
import { createField } from '../fieldCreator';

const SimpleField = props => {
    const {
        path,
        value,
        validation = {},
        onChange,
        showLabel,
        inputId,
        type,
        required,
        label,
        autoComplete,
        placeholder = label
    } = props;
    return (
        <FormGroup inputId={inputId}
            labelText={label}
            {...pick(validation, 'error')}
            showLabel={showLabel}>
            <Input id={inputId}
                name={path}
                type={type}
                value={value || ''}
                placeholder={placeholder}
                autoComplete={autoComplete}
                title={label}
                required={required}
                hasError={!!validation.error}
                onChange={event => onChange({ value: event.target.value })}
                onBlur={() => onChange({ isDirty: true })}
                data-testid={path} />
        </FormGroup>
    );
};

export const simpleField = ({ type, placeholder, autoComplete, ...config }) => createField({
    ...config,
    component: SimpleField,
    extendedParams: {
        type,
        placeholder,
        autoComplete
    }
});
