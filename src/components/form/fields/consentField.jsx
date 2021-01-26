import React from 'react';

import styled from 'styled-components';
import pick from 'lodash-es/pick';

import { withTheme } from '../../widget/widgetContext';

import { Checkbox } from '../formControlsComponent';
import { createField } from '../fieldCreator';
import { MarkdownContent } from '../../miscComponent';

import { checked } from '../../../core/validation';

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

const ConsentField = ({ value, onChange, label, description, path, required, validation }) => {
    const clickUpdate = ({ value }) => ({
        value: !value,
        isDirty: true
    });

    return <div style={{ position: "relative" }}>
        <Checkbox
            value={value}
            onToggle={() => onChange(clickUpdate)}
            name={path}
            label={label}
            {...pick(validation, 'error')}
            data-testid={path}
            required={required} />
        <MarkdownContent root={Description} source={description} />
    </div>
};

export default function consentField(config) {
    const baseProps = {
        ...config,
        required: !!config.required,
        defaultValue: config.defaultValue && { granted: config.defaultValue },
        format: {
            bind: x => !!(x && x.granted),
            unbind: x => ({ granted: x, consentType: config.type })
        },
        component: ConsentField
    }

    const props = config.required ? { ...baseProps, validator: checked } : baseProps;

    return createField(props);
}
