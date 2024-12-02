import React, { useEffect, useMemo, useState } from 'react'
import { DateTime, Info } from 'luxon'
import styled from 'styled-components';

import { ValidatorResult, Validator } from '../../../core/validation';
import { useDebounce } from '../../../helpers/useDebounce';
import { isRichFormValue } from '../../../helpers/utils';

import { createField, FieldComponentProps, FieldCreator, FieldProps } from '../fieldCreator';
import { FormGroup, Input, Select } from '../formControlsComponent';
import { Config } from '../../../types';

const inputRowGutter = 10;

const InputRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: ${inputRowGutter}px;
`;

const InputCol = styled.div<{ width: number }>`
    flex-basis: ${props => props.width}%;
`;

type ExtraParams = {
    locale: string
    yearDebounce?: number
}

interface DateFieldProps extends FieldComponentProps<DateTime, ExtraParams> {}

const DateField = ({
    i18n,
    inputId,
    label,
    locale,
    onChange,
    path,
    required,
    showLabel,
    validation = {} as ValidatorResult,
    value,
    yearDebounce = 1000
}: DateFieldProps) => {
    const date = isRichFormValue(value, 'raw') ? value.raw : value
    const [day, setDay] = useState(date?.day)
    const [month, setMonth] = useState(date?.month)
    const [year, setYear] = useState(date?.year)

    // debounce year value to delay value update when user is currently editing it
    const debouncedYear = useDebounce(year, yearDebounce)

    const setDatePart = (setter: React.Dispatch<React.SetStateAction<number | undefined>>, value: string) => {
        if (Number.isNaN(Number(value))) return // only accept number value
        setter(Number(value))
    }

    const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => setDatePart(setDay, event.target.value)

    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => setDatePart(setMonth, event.target.value)

    const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => setDatePart(setYear, event.target.value)

    const error = typeof validation === 'object' && 'error' in validation ? validation.error : undefined

    useEffect(() => {
        if (day && month && debouncedYear) {
            onChange({
                value: DateTime.fromObject({ year: debouncedYear, month, day }),
                isDirty: true,
            })
        }
    }, [debouncedYear, month, day])

    const months = useMemo(() => Info.months("long", { locale }), [locale])

    const daysInMonth = useMemo(() =>
        [...Array(DateTime.fromObject({ year: debouncedYear, month }).daysInMonth ?? 31).keys()].map(v => v + 1),
        [debouncedYear, month]
    )

    // reset day if current value is out of range
    if (day && !daysInMonth.includes(day)) {
        setDay(undefined)
    }

    // datetime parts ordered by locale 
    const parts = useMemo(() =>
        DateTime.now()
            .setLocale(locale)
            .toLocaleParts()
            .map(part => part.type)
            .filter(type => ['day', 'month', 'year'].includes(type)),
        [locale]
    )

    const fields: Partial<Record<(typeof parts)[number], React.ReactNode>> = {
        day: (
            <InputCol key="day" width={20}>
                <Select
                    name={`${path}.day`}
                    value={day ?? ''}
                    hasError={!!error}
                    required={required}
                    onChange={handleDayChange}
                    placeholder={i18n('day')}
                    options={daysInMonth.map(day => ({ value: `${day}`, label: `${day}` }))}
                    data-testid={`${path}.day`}
                    aria-label={i18n('day')}
                />
            </InputCol>
        ),
        month: (
            <InputCol key="month" width={50}>
                <Select
                    name={`${path}.month`}
                    value={month ?? ''}
                    hasError={!!error}
                    required={required}
                    onChange={handleMonthChange}
                    placeholder={i18n('month')}
                    options={months.map((month, index) => ({ value: `${index + 1}`, label: month }))}
                    data-testid={`${path}.month`}
                    aria-label={i18n('month')}
                />
            </InputCol>
        ),
        year: (
            <InputCol key="year" width={30}>
                <Input
                    type="number"
                    maxLength={4}
                    inputMode="numeric"
                    name={`${path}.year`}
                    value={year ?? ''}
                    hasError={!!error}
                    required={required}
                    onChange={handleYearChange}
                    placeholder={i18n('year')}
                    data-testid={`${path}.year`}
                    aria-label={i18n('year')}
                />
            </InputCol>
        )
    }

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            error={error}
            showLabel={showLabel}
            required={required}
        >
            <InputRow>
                {parts.flatMap(part => fields[part])}
            </InputRow>
        </FormGroup>
    )
}

const dateFormat = (locale: string) => DateTime.now().setLocale(locale).toLocaleParts().map(part => {
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

export const datetimeValidator = (locale: string) => new Validator<DateTime>({
    rule: (value) => value.isValid,
    hint: 'date',
    parameters: { format: dateFormat(locale) }
})

export default function dateField(
    {
        key = 'date',
        label = 'date',
        yearDebounce,
        ...props
    }: Partial<Omit<FieldProps<string, DateTime, DateFieldProps>, 'extendedParams'> & ExtraParams>,
    config: Config
): FieldCreator<DateTime, DateFieldProps, ExtraParams> {
    return createField<string, DateTime, DateFieldProps>({
        key,
        label,
        ...props,
        format: {
            bind: (value) => {
                const dt = value ? DateTime.fromISO(value) : DateTime.invalid('empty value')
                return dt.isValid ? { raw: dt } : undefined
            },
            unbind: (value) => isRichFormValue(value, 'raw') ? value.raw.toISODate() : value?.toISODate() ?? null
        },
        validator: props.validator ? datetimeValidator(config.language).and(props.validator) : datetimeValidator(config.language),
        component: DateField,
        extendedParams: {
            locale: config.language,
            yearDebounce
        }
    })
}
