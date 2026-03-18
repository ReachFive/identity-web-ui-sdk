import React from 'react';

import { CountryCode, isSupportedCountry } from 'libphonenumber-js/min';

import { Required } from '@/components/form/field2/required';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { cn } from '@/lib/utils';

import { PhoneNumberInputProvider } from './PhoneNumberInputContext';
import { PhoneNumberInputWithCountry } from './PhoneNumberInputWithCountry';
import { PhoneNumberInputWithoutCountry } from './PhoneNumberInputWithoutCountry';

export type BasePhoneNumberInputProps = Omit<
    React.ComponentProps<'input'>,
    'defaultValue' | 'value' | 'onChange'
>;

export interface PhoneNumberInputProps extends BasePhoneNumberInputProps {
    defaultCountry?: CountryCode;
    onBlur?: () => void;
    onChange: (val: string | undefined) => void;
    value: string | undefined;
    /**
     * Whether international phone numbers are allowed. Defaults to `true`.
     * If allowed, the phone number input will be prefixed with the country code,
     * and the selected country will be displayed in the input's left add-on, and
     * autoformatting will be enabled.
     */
    allowInternational?: boolean;
    label: string;
    description?: React.ReactNode;
    errors?: { message?: string }[];
    showLabels: boolean;
}

export const PhoneNumberInput = React.forwardRef<HTMLInputElement, PhoneNumberInputProps>(
    function PhoneNumberInput(
        {
            allowInternational = true,
            defaultCountry,
            description,
            errors,
            id,
            label,
            onChange,
            onBlur,
            placeholder,
            required,
            showLabels,
            value,
            ...props
        },
        ref
    ) {
        const config = useConfig();
        const i18n = useI18n();

        const locale = defaultCountry ?? config.locale ?? config.countryCode ?? config.language;

        const generatedId = React.useId();
        const resolvedId = id ?? generatedId;

        const hasError = errors !== undefined && errors.length > 0;

        return (
            <PhoneNumberInputProvider
                allowInternational={allowInternational}
                defaultCountry={isSupportedCountry(locale) ? locale : 'FR'}
                onChange={onChange}
                onBlur={onBlur}
                defaultValue={value ?? ''}
            >
                <Field data-invalid={hasError}>
                    <FieldLabel htmlFor={resolvedId} className={cn(showLabels ? '' : 'sr-only')}>
                        {i18n(label)}
                        {required && <Required />}
                    </FieldLabel>
                    {allowInternational ? (
                        <PhoneNumberInputWithCountry
                            ref={ref}
                            id={resolvedId}
                            placeholder={placeholder ?? (!showLabels ? label : undefined)}
                            required={required}
                            aria-invalid={hasError ? true : undefined}
                            {...props}
                        />
                    ) : (
                        <PhoneNumberInputWithoutCountry
                            ref={ref}
                            id={resolvedId}
                            placeholder={placeholder ?? (!showLabels ? label : undefined)}
                            required={required}
                            aria-invalid={hasError ? true : undefined}
                            {...props}
                        />
                    )}
                    {description && <FieldDescription>{description}</FieldDescription>}
                    {errors && <FieldError errors={errors} />}
                </Field>
            </PhoneNumberInputProvider>
        );
    }
);
