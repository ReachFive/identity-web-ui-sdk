import React from 'react';

import styled from 'styled-components';

import { Checkbox } from '../formControlsComponent';
import { createField, FieldComponentProps, FieldProps } from '../fieldCreator';
import { MarkdownContent } from '../../miscComponent';

import { checked, empty } from '../../../core/validation';
import { isRichFormValue } from '../../../helpers/utils';
import { ConsentType } from '@reachfive/identity-core';

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

type ExtraParams = {
    consentCannotBeGranted?: boolean
    description: string
    version: {
        language: string
        versionId: number
    }
}

interface ConsentFieldProps extends FieldComponentProps<boolean, ExtraParams, {}, 'granted'> {}

const ConsentField = ({ value, onChange, label, description, path, required, validation={}, consentCannotBeGranted }: ConsentFieldProps) => {
    const granted = (isRichFormValue(value, 'granted') ? value.granted : value) ?? false

    const onToggle = () => onChange({
        value: consentCannotBeGranted ? false : !granted,
        isDirty: true
    });

    const error = typeof validation === 'object' && 'error' in validation ? validation.error : undefined

    return <div style={{ position: "relative" }}>
        <Checkbox
            value={granted ? String(granted) : undefined}
            onToggle={onToggle}
            name={path}
            label={label}
            data-testid={path}
            required={required}
            error={error}
        />
        <MarkdownContent root={Description} source={description} />
    </div>
};

type Props = { defaultValue?: boolean, extendedParams: ExtraParams, type: ConsentType } & Omit<FieldProps<boolean, boolean, ConsentFieldProps, ExtraParams, 'granted'>, 'defaultValue' | 'type' | 'format' | 'component' | 'extendedParams'>

type Value = {
    consentType?: ConsentType
    consentVersion?: {
        language: string
        versionId: number
    }
    granted: boolean
}

export default function consentField(config: Props) {
    return createField<Value, boolean, ConsentFieldProps, ExtraParams, 'granted'>({
        ...config,
        required: !!config.required,
        defaultValue: { granted: config.defaultValue ?? false },
        format: {
            bind: value => value,
            unbind: value => value
                ? {
                    granted: (isRichFormValue(value, 'granted') ? value.granted : value) ?? false,
                    consentType: config.type,
                    consentVersion: config.extendedParams?.version
                }
                : null,
        },
        validator: config.required ? checked : empty,
        rawProperty: 'granted',
        component: ConsentField
    });
}
