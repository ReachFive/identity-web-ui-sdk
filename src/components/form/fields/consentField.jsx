import React from 'react';

import styled from 'styled-components';

import { Checkbox } from '../formControlsComponent';
import { createField } from '../fieldCreator';
import { MarkdownContent } from '../../miscComponent';

import { checked, empty } from '../../../core/validation';

const Description = styled.div`
    font-size: ${props => props.theme.smallTextFontSize}px;
    color: ${props => props.theme.mutedTextColor};
    margin: 5px 5px 10px 5px;
    text-align: justify;
    display: block;

    & > p {
        margin-top: 1px;
        margin-bottom: 1px;
    }
`;

const ConsentField = ({ value, onChange, label, description, path, required, validation, consentCannotBeGranted }) => {
    const clickUpdate = ({ value }) => ({
        value: consentCannotBeGranted ? false : !value,
        isDirty: true
    });

    return <div style={{ position: "relative" }}>
        <Checkbox
            value={value}
            onToggle={() => onChange(clickUpdate)}
            name={path}
            label={label}
            data-testid={path}
            required={required}
            {...(({ error }) => ({ error }))(validation)}
        />
        <MarkdownContent root={Description} source={description} />
    </div>
};

export default function consentField(config) {
    return createField({
        ...config,
        required: !!config.required,
        defaultValue: config.defaultValue && { granted: config.defaultValue },
        format: {
            bind: x => !!(x && x.granted),
            unbind: x => ({
                granted: x,
                consentType: config.type,
                consentVersion: config.extendedParams.version
            })
        },
        validator: config.required ? checked : empty,
        rawProperty: 'granted',
        component: ConsentField
    });
}
