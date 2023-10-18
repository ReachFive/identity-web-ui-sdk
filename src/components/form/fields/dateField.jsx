import React, { useEffect, useMemo, useState } from 'react'
import { DateTime, Info } from 'luxon'
import styled from 'styled-components';

import { Validator } from '../../../core/validation';
import { useDebounce } from '../../../helpers/useDebounce';
import { isValued } from '../../../helpers/utils';

import { createField } from '../fieldCreator';
import { FormGroup, Input, Select } from '../formControlsComponent';

const inputRowGutter = 10;

const InputRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: ${inputRowGutter}px;
`;

const InputCol = styled.div`
    flex-basis: ${props => props.width}%;
`;

const DateField = ({ i18n, inputId, label, locale, onChange, path, required, showLabel, validation, value }) => {
    const [day, setDay] = useState(isValued(value) ? value.raw.day : undefined)
    const [month, setMonth] = useState(isValued(value) ? value.raw.month : undefined)
    const [year, setYear] = useState(isValued(value) ? value.raw.year : undefined)

    // debounce year value to delay value update when user is currently editing it
    const debouncedYear = useDebounce(year, 1000)

    const setDatePart = (setter, value) => {
        if (Number.isNaN(Number(value))) return // only accept number value
        setter(Number(value))
    }

    const handleDayChange = event => setDatePart(setDay, event.target.value)

    const handleMonthChange = event => setDatePart(setMonth, event.target.value)

    const handleYearChange = event => setDatePart(setYear, event.target.value)

    useEffect(() => {
        if (day && month && debouncedYear) {
            onChange(() => ({
                value: { raw: DateTime.fromObject({ year: debouncedYear, month, day }) },
                isDirty: true,
            }))
        }
    }, [debouncedYear, month, day]) // eslint-disable-line react-hooks/exhaustive-deps

    const months = useMemo(() => Info.months("long", { locale }), [locale])
    const daysInMonth = useMemo(() =>
        Array.from({ length: DateTime.fromObject({ year: debouncedYear, month }).daysInMonth }, (_value, index) => index + 1),
        [debouncedYear, month]
    )

    // reset day if current value is out of range
    if (day && !daysInMonth.includes(day)) {
        setDay(undefined)
    }

    const parts = useMemo(() =>
        DateTime.now().setLocale(locale).toLocaleParts().map(part => part.type).filter(type => type !== 'literal'),
        [locale]
    )

    const error = typeof validation === 'object' && 'error' in validation ? validation.error : null

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            error={error}
            showLabel={showLabel}
        >
            <InputRow>
                {parts.map(part => {
                    if (part === 'day') {
                        return (
                            <InputCol key="day" width={20}>
                                <Select
                                    name={`${path}.day`}
                                    value={day || ''}
                                    hasError={error}
                                    required={required}
                                    onChange={handleDayChange}
                                    placeholder={i18n('day')}
                                    options={daysInMonth.map(day => ({ value: day, label: day }))}
                                    data-testid={`${path}.day`}
                                    aria-label={i18n('day')}
                                />
                            </InputCol>
                        )
                    } else if (part === 'month') {
                        return (
                            <InputCol key="month" width={50}>
                                <Select
                                    name={`${path}.month`}
                                    value={month || ''}
                                    hasError={error}
                                    required={required}
                                    onChange={handleMonthChange}
                                    placeholder={i18n('month')}
                                    options={months.map((month, index) => ({ value: index + 1, label: month }))}
                                    data-testid={`${path}.month`}
                                    aria-label={i18n('month')}
                                />
                            </InputCol>
                        )
                    } else if (part === 'year') {
                        return (
                            <InputCol key="year" width={30}>
                                <Input
                                    type="number"
                                    maxlength="4"
                                    inputmode="numeric"
                                    name={`${path}.year`}
                                    value={year || ''}
                                    hasError={error}
                                    required={required}
                                    onChange={handleYearChange}
                                    placeholder={i18n('year')}
                                    data-testid={`${path}.year`}
                                    aria-label={i18n('year')}
                                />
                            </InputCol>
                        )
                    }
                })}
            </InputRow>
        </FormGroup>
    )
}

const dateFormat = locale => DateTime.now().setLocale(locale).toLocaleParts().map(part => {
    switch (part.type) {
        case 'day':
            return 'dd'
        case 'month':
            return 'mm';
        case 'year':
            return 'yyyy'
        case 'literal':
            return part.value;
    }
}).join('')

const datetimeValidator = locale => new Validator({
    rule: (value) => isValued(value) && value.raw.isValid,
    hint: 'date',
    parameters: [dateFormat(locale)]
})

export default function dateField(props, config) {
    return createField({
        ...props,
        format: {
            bind: (value) => {
                const dt = value ? DateTime.fromISO(value) : DateTime.invalid('empty value')
                return dt.isValid ? { raw: dt } : undefined
            },
            unbind: (value) => value.raw.toISODate()
        },
        validator: props.validator ? datetimeValidator(config.language).and(props.validator) : datetimeValidator(config.language),
        component: DateField,
        extendedParams: { locale: config.language }
    })
}
