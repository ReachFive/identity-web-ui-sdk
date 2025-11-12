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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Validator, ValidatorResult, isValidatorError } from '../../../core/validation';
import { isRichFormValue } from '../../../helpers/utils';

import type { Config, Optional } from '../../../types';
import {
    createField,
    type FieldComponentProps,
    type FieldCreator,
    type FieldDefinition,
} from '../fieldCreator';
import { FormGroup, Select } from '../formControlsComponent';

const inputRowGutter = 10;

const InputRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: ${inputRowGutter}px;
`;

const InputCol = styled.div<{ width: number; minWidth?: number }>`
    flex-basis: ${props => props.width}%;
    ${props => (props.minWidth ? `min-width: ${props.minWidth}px;` : '')}
`;

type ExtraParams = {
    locale: string;
    yearRange?: number;
};

export interface DateFieldProps extends FieldComponentProps<Date, ExtraParams> {}

const DEFAULT_YEAR_RANGE = 129;
const MAX_DAYS_IN_MONTH = 31;

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
    yearRange = DEFAULT_YEAR_RANGE,
}: DateFieldProps) => {
    const date = isRichFormValue(value, 'raw') ? value.raw : value;

    const [day, setDay] = useState<number | undefined>(() => (date ? getDate(date) : undefined));
    const [month, setMonth] = useState<number | undefined>(() =>
        date ? getMonth(date) : undefined
    );
    const [year, setYear] = useState<number | undefined>(() => (date ? getYear(date) : undefined));

    // Sync the local state with the value prop
    useEffect(() => {
        const newDate = isRichFormValue(value, 'raw') ? value.raw : value;
        if (newDate && isValid(newDate)) {
            setDay(getDate(newDate));
            setMonth(getMonth(newDate));
            setYear(getYear(newDate));
        } else if (!newDate) {
            setDay(undefined);
            setMonth(undefined);
            setYear(undefined);
        }
    }, [value]);

    const isValidDate = useCallback((year?: number, month?: number, day?: number): boolean => {
        if (year === undefined || month === undefined || day === undefined) {
            return false;
        }

        // Check that the month is valid (0-11)
        if (month < 0 || month > 11) {
            return false;
        }

        // Check that the day is valid for this month/year
        const maxDays = getDaysInMonth(new Date(year, month));
        if (day < 1 || day > maxDays) {
            return false;
        }

        // Create the date and check that it matches the entered values
        const date = new Date(year, month, day);
        return (
            !isNaN(date.getTime()) &&
            date.getFullYear() === year &&
            date.getMonth() === month &&
            date.getDate() === day
        );
    }, []);

    const updateDate = useCallback(
        (year?: number, month?: number, day?: number) => {
            if (isValidDate(year, month, day)) {
                onChange({
                    value: new Date(year!, month!, day!),
                    isDirty: true,
                });
            }
        },
        [isValidDate, onChange]
    );

    // Generic handler to handle all date changes
    const createChangeHandler = useCallback(
        (part: 'day' | 'month' | 'year') => (event: React.ChangeEvent<HTMLSelectElement>) => {
            const newValue = Number(event.target.value);
            if (Number.isNaN(newValue)) return;

            const newYear = part === 'year' ? newValue : year;
            const newMonth = part === 'month' ? newValue : month;
            let newDay = part === 'day' ? newValue : day;

            // Setter
            const setters = { day: setDay, month: setMonth, year: setYear };
            setters[part](newValue);

            // Validate and adjust the day if year or month change
            if (
                part !== 'day' &&
                newYear !== undefined &&
                newMonth !== undefined &&
                newDay !== undefined
            ) {
                const maxDays = getDaysInMonth(new Date(newYear, newMonth));
                if (newDay > maxDays) {
                    newDay = undefined;
                    setDay(undefined);
                }
            }

            updateDate(newYear, newMonth, newDay);
        },
        [year, month, day, updateDate]
    );

    const handleDayChange = useMemo(() => createChangeHandler('day'), [createChangeHandler]);
    const handleMonthChange = useMemo(() => createChangeHandler('month'), [createChangeHandler]);
    const handleYearChange = useMemo(() => createChangeHandler('year'), [createChangeHandler]);

    const months = useMemo(
        () =>
            eachMonthOfInterval({
                start: startOfYear(new Date()),
                end: endOfYear(new Date()),
            }).map(month => intlFormat(month, { month: 'long' }, { locale })),
        [locale]
    );

    const years = useMemo(() => {
        const currentYear = getYear(new Date());
        return Array.from({ length: yearRange + 1 }, (_, i) => currentYear - i);
    }, [yearRange]);

    // Days in month
    const daysInMonth = useMemo(() => {
        const maxDays =
            year !== undefined && month !== undefined
                ? getDaysInMonth(new Date(year, month))
                : MAX_DAYS_IN_MONTH;
        return Array.from({ length: maxDays }, (_, i) => i + 1);
    }, [year, month]);

    // Date parts ordered by locale (memoized)
    const parts = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
                .formatToParts()
                .map(part => part.type)
                .filter((type): type is 'day' | 'month' | 'year' =>
                    ['day', 'month', 'year'].includes(type)
                ),
        [locale]
    );

    const error = validation && isValidatorError(validation) ? validation.error : undefined;

    const dayOptions = useMemo(
        () => daysInMonth.map(day => ({ value: String(day), label: String(day) })),
        [daysInMonth]
    );

    const monthOptions = useMemo(
        () => months.map((month, index) => ({ value: String(index), label: month })),
        [months]
    );

    const yearOptions = useMemo(
        () => years.map(year => ({ value: String(year), label: String(year) })),
        [years]
    );

    const fields: Record<'day' | 'month' | 'year', React.ReactNode> = {
        day: (
            <InputCol key="day" width={20} minWidth={70}>
                <Select
                    name={`${path}.day`}
                    value={day ?? ''}
                    hasError={!!error}
                    required={required}
                    onChange={handleDayChange}
                    placeholder={i18n('day')}
                    options={dayOptions}
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
                    options={monthOptions}
                    data-testid={`${path}.month`}
                    aria-label={i18n('month')}
                />
            </InputCol>
        ),
        year: (
            <InputCol key="year" width={30} minWidth={100}>
                <Select
                    name={`${path}.year`}
                    value={year ?? ''}
                    hasError={!!error}
                    required={required}
                    onChange={handleYearChange}
                    placeholder={i18n('year')}
                    options={yearOptions}
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
            <InputRow>{parts.map(part => fields[part])}</InputRow>
        </FormGroup>
    );
};

const dateFormat = (locale: string): string =>
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
                default:
                    return '';
            }
        })
        .join('');

export const datetimeValidator = (locale: string): Validator<Date> =>
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
        yearRange,
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
            yearRange,
        },
    });
}
