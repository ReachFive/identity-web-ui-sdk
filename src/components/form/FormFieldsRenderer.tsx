import React from 'react';
import {
    Control,
    Controller,
    ControllerFieldState,
    ControllerRenderProps,
    FieldPath,
    FieldValue,
    FieldValues,
    useFormContext,
} from 'react-hook-form';

import z from 'zod';

import { CheckboxField } from '@/components/form/fields/checkbox';
import { DateField } from '@/components/form/fields/date';
import { IdentifierField } from '@/components/form/fields/identifier';
import { InputField } from '@/components/form/fields/input';
import { PasswordField, PasswordPolicyRules } from '@/components/form/fields/password';
import { PhoneNumberField } from '@/components/form/fields/phone';
import { RadioGroupField } from '@/components/form/fields/radio-group';
import { SelectField } from '@/components/form/fields/select';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { type FieldDefinition, type StaticContent } from '@/lib/form';

type FormFieldsRendererProps<
    TFieldValues extends FieldValues = FieldValues,
    TTransformedValues = TFieldValues,
> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: Control<TFieldValues, any, TTransformedValues>;
    errorArchivedConsents?: boolean;
    fields: (FieldDefinition | StaticContent)[];
    showLabels: boolean;
};

const FormFieldsRenderer = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
    TTransformedValues = TFieldValues,
>({
    control,
    fields,
    showLabels,
}: FormFieldsRendererProps<TFieldValues, TTransformedValues>) => {
    const client = useReachfive();
    const config = useConfig();
    const i18n = useI18n();
    const { watch } = useFormContext();

    return fields.map((fieldDefinition, index) => {
        if (typeof fieldDefinition === 'object' && 'staticContent' in fieldDefinition) {
            return (
                <React.Fragment key={`static-content-${index}`}>
                    {fieldDefinition.staticContent}
                </React.Fragment>
            );
        }

        const key = fieldDefinition.parent
            ? `${typeof fieldDefinition.parent === 'string' ? fieldDefinition.parent : fieldDefinition.parent.join('.')}.${fieldDefinition.key}`
            : fieldDefinition.key;

        return (
            <Controller
                key={key}
                name={key as TName}
                control={control}
                rules={{
                    required: fieldDefinition.required
                        ? {
                              value: fieldDefinition.required,
                              message: i18n('validation.required'),
                          }
                        : undefined,
                    validate: async (value: FieldValue<TFieldValues>) => {
                        if (fieldDefinition.validation) {
                            const validate = z.nullish(
                                fieldDefinition.validation({
                                    client,
                                    config,
                                    definition: fieldDefinition,
                                    i18n,
                                    watch,
                                })
                            );
                            const result = await validate.safeParseAsync(value);
                            if (result.success) return;
                            return z.treeifyError(result.error).errors[0];
                        }
                    },
                }}
                render={({ field, fieldState }) =>
                    renderField(
                        {
                            ...fieldDefinition,
                            label: i18n(fieldDefinition.label ?? fieldDefinition.key),
                        },
                        field,
                        fieldState,
                        showLabels
                    )
                }
            />
        );
    });
};
FormFieldsRenderer.displayName = 'FormFieldsRenderer';

function renderField<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
    fieldDefinition: FieldDefinition & { label: string },
    { onChange, value, ...field }: ControllerRenderProps<TFieldValues, TName>,
    fieldState: ControllerFieldState,
    showLabels: boolean
) {
    switch (fieldDefinition.type) {
        case 'string':
        case 'object':
        case 'tags':
        case undefined: {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <InputField
                    type="text"
                    {...props}
                    showLabels={showLabels}
                    onChange={e => onChange(transform?.output(e) ?? e)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'number': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <InputField
                    type="number"
                    {...props}
                    showLabels={showLabels}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'integer': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <InputField
                    type="number"
                    pattern="\d*"
                    {...props}
                    showLabels={showLabels}
                    onChange={e => onChange(transform?.output(e) ?? e)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'decimal': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <InputField
                    type="number"
                    {...props}
                    showLabels={showLabels}
                    onChange={e => onChange(transform?.output(e) ?? e)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'email': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <InputField
                    type="email"
                    {...props}
                    showLabels={showLabels}
                    onChange={e => onChange(transform?.output(e) ?? e)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'password': {
            const { type, transform, validation, withPolicyRules, ...props } = fieldDefinition;
            return (
                <PasswordField
                    {...props}
                    showLabels={showLabels}
                    onChange={e => onChange(transform?.output(e) ?? e)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                >
                    {withPolicyRules && <PasswordPolicyRules />}
                </PasswordField>
            );
        }
        case 'date': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <DateField
                    {...props}
                    showLabels={showLabels}
                    onChange={(v: string) => onChange(transform?.output(v) ?? v)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'checkbox': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <CheckboxField
                    {...props}
                    showLabels={showLabels}
                    onCheckedChange={checked => onChange(transform?.output(checked) ?? checked)}
                    {...(transform?.input(value) ?? { checked: !!value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'radio-group': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <RadioGroupField
                    {...props}
                    showLabels={showLabels}
                    onValueChange={v => onChange(transform?.output(v) ?? v)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'select': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <SelectField
                    {...props}
                    showLabels={showLabels}
                    onValueChange={v => onChange(transform?.output(v) ?? v)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'phone': {
            const { type, transform, validation, phoneNumberOptions, ...props } = fieldDefinition;
            return (
                <PhoneNumberField
                    {...props}
                    showLabels={showLabels}
                    value={value as string | undefined}
                    onChange={(v: string | undefined) => onChange(transform?.output(v) ?? v)}
                    {...(transform?.input(value) ?? {})}
                    {...field}
                    allowInternational={
                        phoneNumberOptions?.allowInternational ??
                        phoneNumberOptions?.withCountrySelect ??
                        phoneNumberOptions?.withCountryCallingCode
                    }
                    defaultCountry={phoneNumberOptions?.defaultCountry}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        case 'hidden': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <input
                    type="hidden"
                    {...props}
                    onChange={e => onChange(transform?.output(e) ?? e)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                />
            );
        }
        case 'identifier': {
            const { type, transform, validation, ...props } = fieldDefinition;
            return (
                <IdentifierField
                    {...props}
                    showLabels={showLabels}
                    onChange={e => onChange(transform?.output(e) ?? e)}
                    {...(transform?.input(value) ?? { value })}
                    {...field}
                    errors={fieldState.invalid && fieldState.error ? [fieldState.error] : undefined}
                />
            );
        }
        default: {
            const exhaustiveCheck: never = fieldDefinition;
            throw new Error(`Unhandled case: ${JSON.stringify(exhaustiveCheck)}`);
        }
    }
}

export { FormFieldsRenderer };
