import React from 'react';

import { createField } from '../fieldCreator';
import {RadioGroup} from "../formControlsComponent";

const RadioboxField = props => {
    const { options, onChange, inputId} = props

    return <RadioGroup options={options} inputId={inputId} onChange={onChange} {...props}/>
}
export default function radioboxField({options, ...config}) {
    return createField({
        ...config,
        component: RadioboxField,
        extendedParams: i18n => ({
            options: options.map(({ label, value, key }) => ({ value, label: i18n(label || value), key}))
        })
    });
}
