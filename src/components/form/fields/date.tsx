import React from 'react';

import { formatISO, getDate, getDaysInMonth, getMonth, getYear, intlFormat } from 'date-fns';

import { Required } from '@/components/form/fields/required';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { cn } from '@/lib/utils';

type DateProps = Omit<React.ComponentProps<'input'>, 'value' | 'onChange'> & {
    description?: React.ReactNode;
    errors?: { message?: string }[];
    label: string;
    locale?: Intl.ResolvedDateTimeFormatOptions['locale'];
    onChange?: (value: string) => void;
    showLabels: boolean;
    value?: string | number | Date;
    yearRange?: number;
};

const DateField = React.forwardRef<HTMLInputElement, DateProps>(function DateField(
    {
        errors,
        description,
        id,
        label,
        onChange,
        placeholder,
        required,
        showLabels,
        value,
        yearRange,
        ...props
    },
    ref
) {
    const config = useConfig();
    const i18n = useI18n();

    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current!);

    const { locale: propLocale, ...inputProps } = props;

    const locale = propLocale ?? config.locale ?? config.language;

    const generatedId = React.useId();
    const resolvedId = id ?? generatedId;
    const errorId = `${resolvedId}-error`;
    const labelId = `${resolvedId}-label`;
    const hasError = errors !== undefined && errors.length > 0;

    // string value as Date — null when no value provided (fix #2)
    const valueDate = value ? new Date(value) : null;

    const [day, setDay] = React.useState<number | undefined>(() =>
        valueDate ? getDate(valueDate) : undefined
    );
    const [month, setMonth] = React.useState<number | undefined>(() =>
        valueDate ? getMonth(valueDate) : undefined
    );
    const [year, setYear] = React.useState<number | undefined>(() =>
        valueDate ? getYear(valueDate) : undefined
    );

    // Sync external value prop changes to internal state (fix #5)
    React.useEffect(() => {
        if (value) {
            const d = new Date(value);
            setDay(getDate(d));
            setMonth(getMonth(d));
            setYear(getYear(d));
        } else {
            setDay(undefined);
            setMonth(undefined);
            setYear(undefined);
        }
    }, [value]);

    // Clamp day when month/year changes and selected day exceeds max days (fix #10)
    React.useEffect(() => {
        if (day !== undefined && month !== undefined && year !== undefined) {
            const maxDays = getDaysInMonth(new Date(year, month));
            if (day > maxDays) {
                setDay(undefined);
            }
        }
    }, [month, year, day]);

    // Keep latest onChange in a ref to avoid it being a useEffect dependency
    const onChangeRef = React.useRef(onChange);
    React.useLayoutEffect(() => {
        onChangeRef.current = onChange;
    });

    // Fill hidden input and call onChange with ISO date (fix #4, #6)
    React.useEffect(() => {
        if (inputRef.current && year !== undefined && month !== undefined && day !== undefined) {
            const date = new Date(year, month, day);
            const isoValue = formatISO(date, { representation: 'date' });
            inputRef.current.value = isoValue;
            onChangeRef.current?.(isoValue);
        }
    }, [year, month, day]); // onChange intentionally omitted — accessed via ref

    // Date parts ordered by locale (fix #9, #12)
    const parts = React.useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
                .formatToParts(new Date())
                .flatMap(part =>
                    ['day', 'month', 'year'].includes(part.type)
                        ? [part.type as 'day' | 'month' | 'year']
                        : []
                ),
        [locale]
    );

    return (
        <Field aria-labelledby={labelId} data-invalid={hasError}>
            <FieldLabel id={labelId} className={cn(showLabels ? '' : 'sr-only')}>
                {i18n(label)}
                {required && <Required />}
            </FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
            <input type="hidden" {...inputProps} ref={inputRef} />
            <div className="grid grid-cols-3 gap-4">
                {parts.map(part => {
                    switch (part) {
                        case 'year':
                            return (
                                <YearField
                                    name={resolvedId}
                                    year={year}
                                    yearRange={yearRange}
                                    onChange={setYear}
                                    aria-required={required}
                                    aria-invalid={hasError ? true : undefined}
                                    aria-errormessage={hasError ? errorId : undefined}
                                    key={part}
                                />
                            );
                        case 'month':
                            return (
                                <MonthField
                                    name={resolvedId}
                                    month={month}
                                    onChange={setMonth}
                                    aria-required={required}
                                    aria-invalid={hasError ? true : undefined}
                                    aria-errormessage={hasError ? errorId : undefined}
                                    key={part}
                                />
                            );
                        case 'day':
                            return (
                                <DayField
                                    name={resolvedId}
                                    day={day}
                                    month={month}
                                    year={year}
                                    onChange={setDay}
                                    aria-required={required}
                                    aria-invalid={hasError ? true : undefined}
                                    aria-errormessage={hasError ? errorId : undefined}
                                    key={part}
                                />
                            );
                    }
                })}
            </div>
            {errors && <FieldError id={errorId} errors={errors} />}
        </Field>
    );
});
DateField.displayName = 'DateField';

type DayFieldProps = React.ComponentPropsWithoutRef<typeof Select> & {
    day?: number;
    year?: number;
    month?: number;
    onChange?: (day: number) => void;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
    'aria-errormessage'?: string;
};

const DayField = React.forwardRef<React.ElementRef<typeof Select>, DayFieldProps>(function DayField(
    {
        name,
        day,
        month,
        year,
        onChange,
        'aria-required': ariaRequired,
        'aria-invalid': ariaInvalid,
        'aria-errormessage': ariaErrorMessage,
        ...props
    },
    ref
) {
    const i18n = useI18n();

    const daysInMonth = React.useMemo(() => {
        const maxDays =
            year !== undefined && month !== undefined ? getDaysInMonth(new Date(year, month)) : 31;
        return Array.from({ length: maxDays }, (_, i) => i + 1);
    }, [year, month]);

    return (
        <Select
            onValueChange={v => {
                const num = Number(v);
                if (!Number.isNaN(num)) onChange?.(num);
            }}
            value={day?.toString() ?? ''}
        >
            <SelectTrigger
                id={`${name}-day`}
                ref={ref}
                aria-label={i18n('day')}
                aria-required={ariaRequired}
                aria-invalid={ariaInvalid}
                aria-errormessage={ariaErrorMessage}
                {...props}
            >
                <SelectValue placeholder={i18n('day')} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {daysInMonth.map(d => (
                        <SelectItem key={d} value={d.toString()}>
                            {d}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
});
DayField.displayName = 'DayField';

type MonthFieldProps = React.ComponentPropsWithoutRef<typeof Select> & {
    month?: number;
    onChange?: (month: number) => void;
    locale?: Intl.ResolvedDateTimeFormatOptions['locale'];
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
    'aria-errormessage'?: string;
};

const MonthField = React.forwardRef<React.ElementRef<typeof Select>, MonthFieldProps>(
    function MonthField(
        {
            name,
            month,
            onChange,
            'aria-required': ariaRequired,
            'aria-invalid': ariaInvalid,
            'aria-errormessage': ariaErrorMessage,
            ...props
        },
        ref
    ) {
        const config = useConfig();
        const i18n = useI18n();

        const { locale: propLocale, ...inputProps } = props;
        const locale = propLocale ?? config.locale ?? config.language;

        // fix #1, #13: use index as value; simpler month generation
        const months = React.useMemo(
            () =>
                Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1)).map(d =>
                    intlFormat(d, { month: 'long' }, { locale })
                ),
            [locale]
        );

        return (
            <Select
                onValueChange={v => {
                    const num = Number(v);
                    if (!Number.isNaN(num)) onChange?.(num);
                }}
                value={month?.toString() ?? ''}
            >
                <SelectTrigger
                    id={`${name}-month`}
                    ref={ref}
                    aria-label={i18n('month')}
                    aria-required={ariaRequired}
                    aria-invalid={ariaInvalid}
                    aria-errormessage={ariaErrorMessage}
                    {...inputProps}
                >
                    <SelectValue placeholder={i18n('month')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {months.map((label, i) => (
                            <SelectItem key={i} value={String(i)}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        );
    }
);
MonthField.displayName = 'MonthField';

type YearFieldProps = React.ComponentPropsWithoutRef<typeof Select> & {
    yearRange?: number;
    year?: number;
    onChange?: (year: number) => void;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
    'aria-errormessage'?: string;
};

const YearField = React.forwardRef<React.ElementRef<typeof Select>, YearFieldProps>(
    function YearField(
        {
            name,
            yearRange = 129,
            year,
            onChange,
            'aria-required': ariaRequired,
            'aria-invalid': ariaInvalid,
            'aria-errormessage': ariaErrorMessage,
            ...props
        },
        ref
    ) {
        const i18n = useI18n();

        const years = React.useMemo(() => {
            const currentYear = getYear(new Date());
            return Array.from({ length: yearRange + 1 }, (_, i) => currentYear - i);
        }, [yearRange]);

        return (
            <Select
                onValueChange={v => {
                    const num = Number(v);
                    if (!Number.isNaN(num)) onChange?.(num);
                }}
                value={year?.toString() ?? ''}
            >
                <SelectTrigger
                    id={`${name}-year`}
                    ref={ref}
                    aria-label={i18n('year')}
                    aria-errormessage={ariaErrorMessage}
                    aria-required={ariaRequired}
                    aria-invalid={ariaInvalid}
                    {...props}
                >
                    <SelectValue placeholder={i18n('year')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {years.map(y => (
                            <SelectItem key={y} value={y.toString()}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        );
    }
);
YearField.displayName = 'YearField';

export { DateField };
