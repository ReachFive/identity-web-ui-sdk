import React from 'react';

import pick from 'lodash-es/pick';

import { createField } from '../fieldCreator';
import { Checkbox } from '../formControlsComponent';

const CheckboxField = props => {
    const { value, onChange, label, path, required, validation = {} } = props
    const clickUpdate = ({ value }) => ({
        value: !value,
        isDirty: true
    });

    return <Checkbox value={value}
        onToggle={() => onChange(clickUpdate)}
        name={path}
        label={label}
        {...pick(validation, 'error')}
        required={required} />
};

export default function checkboxField(config) {
    return createField({
        ...config,
        format: {
            bind: x => !!x,
            unbind: x => x
        },
        component: CheckboxField
    });
}
