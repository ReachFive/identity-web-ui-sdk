import React from 'react';

import { FormGroup, Select } from '../formControlsComponent';
import { createField } from '../fieldCreator';

const SelectField = props => {
    const {
        value = '',
        validation = {},
        onChange,
        inputId,
        label,
        placeholder = label
    } = props;

    const handleChange = event => onChange({ value: event.target.value });

    const handleBlur = () => onChange({ isDirty: true });

    return <FormGroup
        inputId={inputId}
        labelText={label}
        {...(({ error }) => ({ error }))(validation)}
        showLabel={props.showLabel}>
        <Select
            id={inputId}
            name={props.path}
            required={props.required}
            value={value}
            hasError={!!validation.error}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            options={props.values}
            data-testid={props.path} />
    </FormGroup>;
};

export default function selectField({ values, ...config }) {
    return createField({
        ...config,
        component: SelectField,
        extendedParams: i18n => ({
            values: values.map(({ label, value }) => ({ value, label: i18n(label || value) }))
        })
    });
}
