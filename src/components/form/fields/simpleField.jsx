import React from 'react';

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
        label,
        placeholder = label
    } = props;

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            {...(({ error }) => ({ error }))(validation)}
            showLabel={showLabel}>
            <Input
                id={inputId}
                name={path}
                type={props.type}
                value={value || ''}
                placeholder={placeholder}
                autoComplete={props.autoComplete}
                title={label}
                required={props.required}
                readOnly={props.readOnly}
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

export default simpleField;
