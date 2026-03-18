import React from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';

import { Required } from '@/components/form/field2/required';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { useI18n } from '@/contexts/i18n';

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    label: string;
    description?: React.ReactNode;
    errors?: { message?: string }[];
    showLabels?: boolean;
};

const CheckboxField = React.forwardRef<
    React.ElementRef<typeof CheckboxPrimitive.Root>,
    CheckboxProps
>(function CheckboxField(
    {
        errors,
        id,
        label,
        checked,
        defaultChecked,
        description,
        onCheckedChange,
        required,
        showLabels: _showLabels,
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
        <FieldGroup>
            <Field orientation="horizontal" data-invalid={hasError}>
                <Checkbox
                    ref={ref}
                    id={resolvedId}
                    required={required}
                    checked={checked ?? (onCheckedChange ? defaultChecked : undefined)}
                    defaultChecked={defaultChecked}
                    onCheckedChange={onCheckedChange}
                    aria-invalid={hasError ? true : undefined}
                    aria-errormessage={hasError ? errorId : undefined}
                    {...props}
                />
                <FieldContent className="gap-0.5">
                    <FieldLabel htmlFor={resolvedId}>
                        {i18n(label)}
                        {required && <Required />}
                    </FieldLabel>
                    {description && <FieldDescription>{description}</FieldDescription>}
                    {errors && <FieldError errors={errors} id={errorId} />}
                </FieldContent>
            </Field>
        </FieldGroup>
    );
});
CheckboxField.displayName = 'CheckboxField';

export { CheckboxField };
