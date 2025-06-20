import {
    eachMonthOfInterval,
    endOfYear,
    formatISO,
    getDate,
    getDaysInMonth,
    getMonth,
    getYear,
    intlFormat,
    isValid,
    parseISO,
    startOfYear,
} from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Validator, ValidatorResult, isValidatorError } from '../../../core/validation';
import { useDebounce } from '../../../helpers/useDebounce';
import { isRichFormValue } from '../../../helpers/utils';

import type { Config, Optional } from '../../../types';
import {
    createField,
    type FieldComponentProps,
    type FieldCreator,
    type FieldDefinition,
} from '../fieldCreator';
import { FormGroup, Input, Select } from '../formControlsComponent';

const inputRowGutter = 10;

const InputRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: ${inputRowGutter}px;
`;

const InputCol = styled.div<{ width: number; minWidth?: number }>`
    flex-basis: ${props => props.width}%;
    ${props => (props.minWidth ? `min-width: ${props.minWidth}px;` : undefined)}
`;

type ExtraParams = {
    locale: string;
    yearDebounce?: number;
};

export interface DateFieldProps extends FieldComponentProps<Date, ExtraParams> {}

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
    yearDebounce = 1000,
}: DateFieldProps) => {
    const date = isRichFormValue(value, 'raw') ? value.raw : value;
    const [day, setDay] = useState(date ? getDate(date) : undefined);
    const [month, setMonth] = useState(date ? getMonth(date) : undefined);
    const [year, setYear] = useState(date ? getYear(date) : undefined);

    // debounce year value to delay value update when user is currently editing it
    const debouncedYear = useDebounce(year, yearDebounce);

    const setDatePart = (
        setter: React.Dispatch<React.SetStateAction<number | undefined>>,
        value: string
    ) => {
        if (Number.isNaN(Number(value))) return; // only accept number value
        setter(Number(value));
    };

    const handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
        setDatePart(setDay, event.target.value);

    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) =>
        setDatePart(setMonth, event.target.value);

    const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) =>
        setDatePart(setYear, event.target.value);

    const error = validation && isValidatorError(validation) ? validation.error : undefined;

    useEffect(() => {
        if (
            typeof day !== 'undefined' &&
            typeof month !== 'undefined' &&
            typeof debouncedYear !== 'undefined'
        ) {
            onChange({
                value: new Date(debouncedYear, month, day),
                isDirty: true,
            });
        }
    }, [debouncedYear, month, day]);

    const months = useMemo(
        () =>
            eachMonthOfInterval({
                start: startOfYear(new Date()),
                end: endOfYear(new Date()),
            }).map(month => intlFormat(month, { month: 'long' }, { locale })),
        [locale]
    );

    const daysInMonth = useMemo(
        () =>
            [
                ...Array(
                    debouncedYear && month ? getDaysInMonth(new Date(debouncedYear, month, 1)) : 31
                ).keys(),
            ].map(v => v + 1),
        [debouncedYear, month]
    );

    // reset day if current value is out of range
    if (day && !daysInMonth.includes(day)) {
        setDay(undefined);
    }

    // datetime parts ordered by locale
    const parts = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
                .formatToParts()
                .map(part => part.type)
                .filter(type => ['day', 'month', 'year'].includes(type)),
        [locale]
    );

    const fields: Partial<Record<(typeof parts)[number], React.ReactNode>> = {
        day: (
            <InputCol key="day" width={20} minWidth={70}>
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
                    options={months.map((month, index) => ({ value: `${index}`, label: month }))}
                    data-testid={`${path}.month`}
                    aria-label={i18n('month')}
                />
            </InputCol>
        ),
        year: (
            <InputCol key="year" width={30} minWidth={100}>
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
        ),
    };

    return (
        <FormGroup
            inputId={inputId}
            labelText={label}
            error={error}
            showLabel={showLabel}
            required={required}
        >
            <InputRow>{parts.flatMap(part => fields[part])}</InputRow>
        </FormGroup>
    );
};

const dateFormat = (locale: string) =>
    new Intl.DateTimeFormat(locale)
        .formatToParts()
        .map(part => {
            switch (part.type) {
                case 'day':
                    return 'dd';
                case 'month':
                    return 'mm';
                case 'year':
                    return 'yyyy';
                case 'literal':
                    return part.value;
            }
        })
        .join('');

export const datetimeValidator = (locale: string) =>
    new Validator<Date>({
        rule: value => isValid(value),
        hint: 'date',
        parameters: { format: dateFormat(locale) },
    });

export default function dateField(
    {
        format,
        key = 'date',
        label = 'date',
        locale,
        validator,
        yearDebounce,
        ...props
    }: Optional<FieldDefinition<string, Date>, 'key' | 'label'> & Optional<ExtraParams, 'locale'>,
    config: Config
): FieldCreator<Date, DateFieldProps, ExtraParams> {
    return createField<string, Date, DateFieldProps>({
        key,
        label,
        ...props,
        format: format ?? {
            bind: value => {
                const dt = value ? parseISO(value) : undefined;
                return dt && isValid(dt) ? { raw: dt } : undefined;
            },
            unbind: value => {
                return isRichFormValue(value, 'raw')
                    ? formatISO(value.raw, { representation: 'date' })
                    : value
                      ? formatISO(value, { representation: 'date' })
                      : null;
            },
        },
        validator: validator
            ? datetimeValidator(config.language).and(validator)
            : datetimeValidator(config.language),
        component: DateField,
        extendedParams: {
            locale: locale ?? config.language,
            yearDebounce,
        },
    });
}
