import React from 'react';

import styled from 'styled-components';

import { withTheme } from '../../widget/widgetContext';

import { Checkbox } from '../formControlsComponent';
import { createField } from '../fieldCreator';
import { MarkdownContent } from '../../miscComponent';

const Description = withTheme(styled.div`
    font-size: ${props => props.theme.get('smallTextFontSize')}px;
    color: ${props => props.theme.get('mutedTextColor')};
    margin: 5px 5px 10px 5px;
    text-align: justify;
    display: block;

    & > p {
        margin-top: 1px;
        margin-bottom: 1px;
    }
`);

const ConsentField = ({ value, onChange, label, description, path }) => {
    const clickUpdate = ({ value }) => ({
        value: !value,
        isDirty: true
    });

    return <div style={{ position: "relative" }}>
        <Checkbox value={value}
            onToggle={() => onChange(clickUpdate)}
            name={path}
            label={label} />
        <MarkdownContent root={Description} source={description} />
    </div>
};

export default function consentField(config) {
    return createField({
        ...config,
        defaultValue: config.defaultValue && { granted: config.defaultValue },
        format: {
            bind: x => !!(x && x.granted),
            unbind: x => ({ granted: x, consentType: consentTypeFromInitialValue(config.defaultValue) })
        },
        component: ConsentField
    });
}

const consentTypeFromInitialValue = (value) => value ? "opt-out" : "opt-in"
