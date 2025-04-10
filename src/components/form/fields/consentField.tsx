import React from 'react';

import styled from 'styled-components';

import { ConsentType } from '@reachfive/identity-core';

import { Checkbox } from '../formControlsComponent';
import { createField, type FieldComponentProps, type FieldDefinition } from '../fieldCreator';
import { MarkdownContent } from '../../miscComponent';

import { PathMapping } from '../../../core/mapping';
import { checked, empty, isValidatorError } from '../../../core/validation';
import { isRichFormValue } from '../../../helpers/utils';
import { snakeCasePath } from '../../../helpers/transformObjectProperties';

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

type ConsentFieldOptions = {
    type: ConsentType
    consentCannotBeGranted?: boolean
    description: string
    version: {
        language: string
        versionId: number
    }
}

export interface ConsentFieldProps extends FieldComponentProps<boolean, ConsentFieldOptions, {}, 'granted'> {}

const ConsentField = ({ value, onChange, label, description, path, required, validation, consentCannotBeGranted }: ConsentFieldProps) => {
    const granted = (isRichFormValue(value, 'granted') ? value.granted : value) ?? false

    const onToggle = () => onChange({
        value: consentCannotBeGranted ? false : !granted,
        isDirty: true
    });

    const error = validation && isValidatorError(validation) ? validation.error : undefined

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
        <MarkdownContent root={Description} source={description} data-testid={`${path}.description`} />
    </div>
};

type Value = {
    consentType?: ConsentType
    consentVersion?: {
        language: string
        versionId: number
    }
    granted: boolean
}

export default function consentField({
    type,
    required = false,
    consentCannotBeGranted,
    description,
    version,
    ...props
}: Omit<FieldDefinition<Value, boolean>, 'defaultValue'> & { defaultValue?: boolean } & ConsentFieldOptions) {
    return createField<Value, boolean, ConsentFieldProps, ConsentFieldOptions, 'granted'>({
        ...props,
        required,
        defaultValue: { granted: props.defaultValue ?? false },
        mapping: new PathMapping(snakeCasePath(props.path ?? props.key)), // Consent key should be snake_case
        format: {
            bind: value => value,
            unbind: value => value !== undefined
                ? {
                    granted: (isRichFormValue(value, 'granted') ? value.granted : value) ?? false,
                    consentType: type,
                    consentVersion: version
                }
                : null,
        },
        validator: required ? checked : empty,
        rawProperty: 'granted',
        component: ConsentField,
        extendedParams: {
            consentCannotBeGranted,
            description,
            type,
            version,
        }
    });
}
