import React from 'react';

import styled from 'styled-components';
import { clearFix } from 'polished';
import pick from 'lodash-es/pick';

import { isNumeric, isISO8601 } from 'validator';

import { isValued, formatISO8601Date } from '../../../helpers/utils';
import generateId from '../../../helpers/inputIdGenerator';

import { Input, FormGroup, Select } from '../formControlsComponent';

const BIRTHDAY_PATH = 'birthdate'

const months = i18n => [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december'
].map((m, i) => ({ value: i + 1, label: i18n(m) }));

const inputRowGutter = 10;

const InputRow = styled.div`
    margin-right: ${-inputRowGutter / 2}px;
    margin-left: ${-inputRowGutter / 2}px;
    ${clearFix()}
`;

const InputCol = styled.div`
    float: left;
    padding-right: ${inputRowGutter / 2}px;
    padding-left: ${inputRowGutter / 2}px;
    width: ${props => props.width}%;
    box-sizing: border-box;
`;

const BirthdateField = props => {
    const {
        day,
        month,
        year,
        validation = {},
        onChange,
        showLabel,
        inputId,
        label,
        required = true,
        months,
        i18n
    } = props;

    const handleFieldChange = field => e => {
        const value = e.target.value;
        onChange(state => ({
            [field]: {
                ...state[field],
                value
            }
        }));
    };

    const handleFieldBlur = field => () => onChange(state => ({
        [field]: {
            ...state[field],
            isDirty: true
        }
    }));

    return <FormGroup
        inputId={inputId}
        labelText={label}
        {...pick(validation, 'error')}
        showLabel={showLabel}>
        <InputRow>
            <InputCol width={20}>
                <Input type="text"
                    id={inputId}
                    name={`${BIRTHDAY_PATH}.day`}
                    maxlength="2"
                    inputmode="numeric"
                    value={day.value}
                    hasError={!!validation.day}
                    required={required}
                    placeholder={i18n('day')}
                    onChange={handleFieldChange('day')}
                    onBlur={handleFieldBlur('day')} />
            </InputCol>
            <InputCol width={50}>
                <Select name={`${BIRTHDAY_PATH}.month`}
                    value={month.value || ''}
                    hasError={!!validation.month}
                    required={required}
                    onChange={handleFieldChange('month')}
                    onBlur={handleFieldBlur('month')}
                    placeholder={i18n('month')}
                    options={months} />
            </InputCol>
            <InputCol width={30}>
                <Input type="text"
                    name={`${BIRTHDAY_PATH}.year`}
                    maxlength="4"
                    inputmode="numeric"
                    value={year.value}
                    hasError={!!validation.year}
                    required={required}
                    placeholder={i18n('year')}
                    onChange={handleFieldChange('year')}
                    onBlur={handleFieldBlur('year')} />
            </InputCol>
        </InputRow>
    </FormGroup>;
};

const validateDay = day => {
    if (isNumeric(day)) {
        const dayNbr = parseInt(day);
        if (dayNbr <= 31 && dayNbr >= 1) {
            return false
        }
    }

    return 'birthdate.dayOfMonth';
};

const validateYear = year => {
    if (isNumeric(year)) {
        const yearNbr = parseInt(year);
        const currentYear = new Date().getFullYear();
        const age = currentYear - yearNbr;
        if (age > 5 && age < 130) {
            return false
        }
    }

    return 'birthdate.year';
};

const format = ({ day, month, year }) => formatISO8601Date(year.value, month.value, day.value);

export default function birthdateField({
    label,
    required = true,
    defaultValue
}) {
    return {
        path: BIRTHDAY_PATH,
        create: ({ i18n, showLabel }) => {
            const staticProps = {
                inputId: generateId(BIRTHDAY_PATH),
                label: label || i18n(BIRTHDAY_PATH),
                months: months(i18n),
                required,
                i18n,
                showLabel
            };

            return {
                key: BIRTHDAY_PATH,
                modelPath: BIRTHDAY_PATH,
                render: ({ state, ...props }) => (
                    <BirthdateField key={BIRTHDAY_PATH} {...state} {...props} {...staticProps} />
                ),
                initialize: model => {
                    const modelValue = model.birthdate || defaultValue;
                    const [year = '', month = '', day = ''] = modelValue ? modelValue.split('-') : [];

                    return {
                        day: {
                            value: day,
                            isDirty: false
                        },
                        month: {
                            value: parseInt(month),
                            isDirty: false
                        },
                        year: {
                            value: year,
                            isDirty: false
                        }
                    };
                },
                unbind: (model, state) => ({
                    ...model,
                    birthdate: format(state)
                }),
                validate: (state, { isSubmitted }) => {
                    const { required } = staticProps
                    const { day, month, year } = state;

                    const missingFields = ['day', 'month', 'year'].filter(
                        field => (isSubmitted || state[field].isDirty) && !isValued(state[field].value)
                    );

                    if (missingFields.length) {
                        return required || missingFields.length < 3 ? {
                            error: i18n('validation.required'),
                            ...missingFields.reduce((acc, field) => ({ ...acc, [field]: true }), {})
                        } : {};
                    }

                    if (isSubmitted || day.isDirty) {
                        const dayError = validateDay(day.value);
                        if (dayError) {
                            return {
                                error: i18n(`validation.${dayError}`),
                                day: true
                            };
                        }
                    }

                    if (isSubmitted || year.isDirty) {
                        const yearError = validateYear(year.value);
                        if (yearError) {
                            return {
                                error: i18n(`validation.${yearError}`),
                                year: true
                            };
                        }
                    }

                    if ((isSubmitted || day.isDirty || month.isDirty || year.isDirty)) {
                        const birthdate = format(state);
                        if (!birthdate || !isISO8601(birthdate)) {
                            return {
                                error: i18n('validation.birthdate.dayOfMonth'),
                                day: true
                            };
                        }
                    }

                    return {};
                }
            };
        }
    }
}
