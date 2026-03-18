import React from 'react';

import { Required } from '@/components/form/field2/required';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/contexts/i18n';
import { cn } from '@/lib/utils';

type RadioGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroup> & {
    label: string;
    description?: React.ReactNode;
    values: {
        description?: string;
        label: string;
        value: string;
    }[];
    errors?: { message?: string }[];
    showLabels: boolean;
};

const RadioGroupField = React.forwardRef<React.ElementRef<typeof RadioGroup>, RadioGroupProps>(
    function RadioGroupField(
        { description, errors, id, label, required, showLabels, value, values, ...props },
        ref
    ) {
        const i18n = useI18n();
        const generatedId = React.useId();
        const resolvedId = id ?? generatedId;
        const hasError = errors !== undefined && errors.length > 0;
        const errorId = `${resolvedId}-error`;
        return (
            <FieldSet>
                <FieldLegend variant="label" className={cn(showLabels ? '' : 'sr-only')}>
                    {i18n(label)}
                    {required && <Required />}
                </FieldLegend>
                {description && <FieldDescription>{description}</FieldDescription>}
                <RadioGroup ref={ref} value={value ?? ''} {...props}>
                    {values.map(({ value, label, description }) => (
                        <Field
                            orientation="horizontal"
                            key={`${resolvedId}-${value}`}
                            data-invalid={hasError}
                            aria-errormessage={hasError ? errorId : undefined}
                        >
                            <RadioGroupItem
                                value={value}
                                id={`${resolvedId}-${value}`}
                                aria-invalid={hasError}
                            />
                            <FieldContent>
                                <FieldLabel htmlFor={`${resolvedId}-${value}`}>
                                    {i18n(label ?? value)}
                                </FieldLabel>
                                {description && <FieldDescription>{description}</FieldDescription>}
                            </FieldContent>
                        </Field>
                    ))}
                </RadioGroup>
            </FieldSet>
        );
    }
);
RadioGroupField.displayName = 'RadioGroupField';

export { RadioGroupField };
