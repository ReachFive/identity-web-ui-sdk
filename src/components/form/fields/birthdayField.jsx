import React from 'react';

import styled from 'styled-components';
import { clearFix } from 'polished';
import pick from 'lodash-es/pick';

import { isNumeric, isISO8601 } from 'validator';

import { isValued, formatISO8601Date } from '../../../helpers/utils';
import generateId from '../../../helpers/inputIdGenerator';

import { Input, FormGroup, Select } from '../formControlsComponent';
import {DateTime} from 'luxon'

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
                    onBlur={handleFieldBlur('day')}
                    data-testid={`${BIRTHDAY_PATH}.day`} />
            </InputCol>
            <InputCol width={50}>
                <Select name={`${BIRTHDAY_PATH}.month`}
                    value={month.value || ''}
                    hasError={!!validation.month}
                    required={required}
                    onChange={handleFieldChange('month')}
                    onBlur={handleFieldBlur('month')}
                    placeholder={i18n('month')}
                    options={months}
                    data-testid={`${BIRTHDAY_PATH}.month`} />
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
                    onBlur={handleFieldBlur('year')}
                    data-testid={`${BIRTHDAY_PATH}.year`} />
            </InputCol>
        </InputRow>
    </FormGroup>;
};

const validateLimitAge = (day, month, year) => {
    const yearNbr = parseInt(year, 10);
    const dayNbr = parseInt(day, 10);
    const monthNbr = parseInt(month, 10);
    const age = DateTime.now().diff(DateTime.local(yearNbr, monthNbr, dayNbr), "years").years
    if (age < 6 || age > 129) {
        return 'birthdate.yearLimit'
    }
    return false
}

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

                    if ((isSubmitted || day.isDirty || month.isDirty || year.isDirty)) {

                        if (!isNumeric(year.value.toString()) || !DateTime.fromObject({ year: parseInt(year.value, 10) }).isValid) {
                            return {
                                error: i18n(`validation.birthdate.year`),
                                year: true
                            };
                        }

                        const birthdate = format(state);
                        if (!birthdate || !isISO8601(birthdate)) {
                            return {
                                error: i18n('validation.birthdate.dayOfMonth'),
                                day: true
                            };
                        }

                        if (!(isNumeric(month.value.toString()) && isNumeric(day.value.toString())) || !DateTime.fromObject({ year: year.value, month: month.value, day: day.value }).isValid) {
                            return {
                                error: i18n(`validation.birthdate.dayOfMonth`),
                                day: true
                            }
                        }

                        const limitAge = validateLimitAge(day.value, month.value, year.value)
                        if (limitAge) {
                            return {
                                error: i18n(`validation.${limitAge}`)
                            };
                        }
                    }

                    return {};
                }
            };
        }
    }
}
