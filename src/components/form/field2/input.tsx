import React from 'react';

import { Required } from '@/components/form/field2/required';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type InputProps = React.ComponentProps<'input'> & {
    label: string;
    description?: React.ReactNode;
    errors?: { message?: string }[];
    showLabels: boolean;
};

const InputField = React.forwardRef<HTMLInputElement, InputProps>(function InputField(
    { errors, id, label, description, placeholder, required, showLabels, value, ...props },
    ref
) {
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
            <Input
                ref={ref}
                id={resolvedId}
                required={required}
                placeholder={placeholder ?? (!showLabels ? label : undefined)}
                value={value ?? ''}
                aria-label={label}
                aria-invalid={hasError ? true : undefined}
                aria-errormessage={hasError ? errorId : undefined}
                {...props}
            />
            {description && <FieldDescription>{description}</FieldDescription>}
            {errors && <FieldError errors={errors} id={errorId} />}
        </Field>
    );
});
InputField.displayName = 'InputField';

export { InputField };
