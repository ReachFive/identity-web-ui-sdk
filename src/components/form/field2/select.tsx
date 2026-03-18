import React from 'react';

import { Required } from '@/components/form/field2/required';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/contexts/i18n';
import { cn } from '@/lib/utils';

type SelectProps = React.ComponentPropsWithoutRef<typeof SelectTrigger> & {
    autoComplete?: string | undefined;
    defaultValue?: string;
    description?: React.ReactNode;
    disabled?: boolean;
    errors?: { message?: string }[];
    label: string;
    name?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    showLabels: boolean;
    value?: string;
    values: {
        label: string;
        value: string;
    }[];
};

const SelectField = React.forwardRef<React.ElementRef<typeof SelectTrigger>, SelectProps>(
    function SelectField(
        {
            autoComplete,
            errors,
            id,
            label,
            description,
            disabled,
            name,
            placeholder,
            required,
            values,
            value,
            defaultValue,
            onValueChange,
            showLabels,
            ...props
        },
        ref
    ) {
        const i18n = useI18n();
        const generatedId = React.useId();
        const resolvedId = id ?? generatedId;
        const hasError = errors !== undefined && errors.length > 0;
        const errorId = `${resolvedId}-error`;
        return (
            <Field data-invalid={hasError}>
                <FieldLabel htmlFor={resolvedId} className={cn(showLabels ? '' : 'sr-only')}>
                    {label}
                    {required && <Required />}
                </FieldLabel>
                <Select
                    autoComplete={autoComplete}
                    defaultValue={defaultValue}
                    disabled={disabled}
                    name={name}
                    onValueChange={onValueChange}
                    required={required}
                    value={value}
                >
                    <SelectTrigger
                        ref={ref}
                        id={resolvedId}
                        aria-label={label}
                        aria-invalid={hasError}
                        aria-errormessage={hasError ? errorId : undefined}
                        {...props}
                    >
                        <SelectValue placeholder={placeholder ?? label} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {values.map(({ value, label }) => (
                                <SelectItem key={`${resolvedId}-${value}`} value={value}>
                                    {i18n(label ?? value)}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                {description && <FieldDescription>{description}</FieldDescription>}
                {errors && <FieldError errors={errors} />}
            </Field>
        );
    }
);
SelectField.displayName = 'SelectField';

export { SelectField };
