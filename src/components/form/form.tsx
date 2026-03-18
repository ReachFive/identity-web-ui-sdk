import React from 'react';
import { DefaultValues, FieldPath, FieldValues, FormProvider, useForm } from 'react-hook-form';

import { useCaptcha } from '@/components/captcha';
import { Required } from '@/components/form/field2/required';
import { FormFieldsRenderer } from '@/components/form/FormFieldsRenderer';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { isAppError } from '@/helpers/errors';
import { logError } from '@/helpers/logger';
import {
    type Field,
    getFieldDefinitions,
    PhoneNumberOptions,
    withoutStaticContent,
} from '@/lib/form';

type SubmitComponent = React.ComponentType<{
    disabled: boolean;
    label: string;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}>;

export type FormProps<Model, ResultType = void> = {
    beforeSubmit?: (data: Model) => Model;
    errorArchivedConsents?: boolean;
    fields?: Field[];
    handler: (data: Model) => Promise<ResultType>;
    initialModel?: DefaultValues<Model>;
    onError?: (error: unknown) => void | PromiseLike<void>;
    onFieldChange?: (fields: Model) => void;
    onSuccess?: (result: ResultType) => void | PromiseLike<void>;
    phoneNumberOptions?: PhoneNumberOptions;
    resetAfterError?: boolean;
    resetAfterSuccess?: boolean;
    showLabels?: boolean;
    skipError?: boolean | ((error: unknown) => boolean);
    SubmitComponent?: SubmitComponent;
    submitLabel?: string;
    supportMultipleSubmits?: boolean; /** @unused check if it must me re-implemented or not */
};

function Form<TFieldValues extends FieldValues = FieldValues, R = void>({
    beforeSubmit,
    children,
    errorArchivedConsents,
    fields = [],
    handler,
    initialModel,
    onError,
    onFieldChange,
    onSuccess,
    phoneNumberOptions,
    resetAfterError,
    resetAfterSuccess,
    skipError,
    showLabels = false,
    SubmitComponent,
    submitLabel = 'send',
}: React.PropsWithChildren<FormProps<TFieldValues, R>>) {
    // const client = useReachfive();
    const config = useConfig();
    const i18n = useI18n();
    const { Captcha, handler: captchaHandler } = useCaptcha();

    // Build field definitions from fields property and config
    const fieldDefinitions = React.useMemo(() => {
        return getFieldDefinitions(fields, config, {
            errorArchivedConsents,
            phoneNumberOptions,
        });
    }, [fields, config, errorArchivedConsents, phoneNumberOptions]);

    // Utility function to check if a field is valid (defined in fieldDefinitions)
    const isValidField = React.useCallback(
        (field: string): field is FieldPath<TFieldValues> => {
            return withoutStaticContent(fieldDefinitions).some(f => f.key === field);
        },
        [fieldDefinitions]
    );

    const form = useForm<TFieldValues>({
        defaultValues: initialModel,
        // resolver: zodResolver(schema),
    });
    const { control, formState, handleSubmit, reset, setError, subscribe, trigger } = form;

    // Listen to form state changes
    React.useEffect(() => {
        const unsubscribe = subscribe({
            formState: {
                values: true,
            },
            callback: ({ values }) => {
                onFieldChange?.(values);
            },
        });

        return () => unsubscribe();
    }, [subscribe]);

    const handleSuccess = React.useCallback(
        async (result: Awaited<ReturnType<typeof handler>>) => {
            await onSuccess?.(result);
            if (resetAfterSuccess) {
                reset();
            }
            return result;
        },
        [onSuccess, resetAfterSuccess]
    );

    const handleError = React.useCallback(
        async (error: unknown) => {
            await onError?.(error);

            if (isAppError(error)) {
                if (error.errorDetails && error.errorDetails.length > 0) {
                    error.errorDetails.map(errorDetail => {
                        setError(
                            errorDetail.field
                                ? isValidField(errorDetail.field)
                                    ? errorDetail.field
                                    : `root.${errorDetail.field}`
                                : 'root',
                            {
                                message:
                                    errorDetail.code === 'missing'
                                        ? i18n('validation.required')
                                        : i18n(`validation.${errorDetail.field}`, {
                                              defaultValue: errorDetail.message,
                                          }),
                            }
                        );
                    });
                }
                setError('root', {
                    message: i18n(error.errorMessageKey ?? error.error, {
                        defaultValue: error.errorUserMsg ?? error.errorDescription ?? error.error,
                    }),
                });
                logError(error.errorDescription ?? error.error);
            }

            if (resetAfterError) {
                reset();
            }

            return error;
        },
        [i18n, isValidField, onError, resetAfterError]
    );

    const onSubmit = React.useCallback(
        async (data: TFieldValues): Promise<void> => {
            const processedData = beforeSubmit ? beforeSubmit(data) : data;
            try {
                const result = await captchaHandler(processedData, handler);
                await handleSuccess(result);
            } catch (error) {
                if (typeof skipError === 'function' ? skipError(error) : skipError === true) {
                    await handleSuccess({} as Awaited<ReturnType<typeof handler>>);
                } else {
                    await handleError(error);
                }
            }
        },
        [beforeSubmit, captchaHandler, handler, handleSuccess, handleError, skipError]
    );

    return (
        <FormProvider {...form}>
            <form
                onSubmit={e => void handleSubmit(onSubmit)(e)}
                noValidate
                aria-busy={formState.isSubmitting}
            >
                <div className="space-y-4">
                    {formState.errors.root?.message && (
                        <p className="text-destructive text-center" role="alert" aria-live="polite">
                            {formState.errors.root.message}
                        </p>
                    )}

                    <FormFieldsRenderer
                        control={control}
                        fields={fieldDefinitions}
                        showLabels={showLabels}
                    />

                    {children}

                    {SubmitComponent ? (
                        <SubmitComponent
                            disabled={formState.isSubmitting}
                            label={i18n(submitLabel)}
                            onClick={() => void trigger()}
                        />
                    ) : (
                        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
                            {i18n(submitLabel)}
                        </Button>
                    )}

                    {showLabels && (
                        <p
                            className="flex w-full leading-snug justify-center gap-2 text-sm text-muted-foreground"
                            aria-hidden="true"
                        >
                            <Required /> {i18n('form.required.fields')}
                        </p>
                    )}

                    {Captcha && <Captcha />}
                </div>
            </form>
        </FormProvider>
    );
}
Form.displayName = 'Form';
export { Form };
