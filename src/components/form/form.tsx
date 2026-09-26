import React from 'react';
import { DefaultValues, FieldPath, FieldValues, FormProvider, useForm } from 'react-hook-form';

import { useCaptcha } from '@/components/captcha';
import { Required } from '@/components/form/fields/required';
import { FormFieldsRenderer } from '@/components/form/FormFieldsRenderer';
import { FormSubmissionProvider, useFormSubmissionState } from '@/components/form/formSubmission';
import { Button } from '@/components/ui/button';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { isAppError } from '@/helpers/errors';
import { logError } from '@/helpers/logger';
import {
    type Field,
    getDefaultFieldValues,
    getFieldDefinitions,
    PhoneNumberOptions,
    resolveErrorFieldPath,
    resolveErrorMessageKeyField,
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

    const defaultValues = React.useMemo(
        () =>
            ({
                ...getDefaultFieldValues(fieldDefinitions),
                ...initialModel,
            }) as DefaultValues<TFieldValues>,
        // fieldDefinitions is derived from fields+config — re-running when those change is correct
        [fields, config, errorArchivedConsents, phoneNumberOptions, initialModel]
    );

    const form = useForm<TFieldValues>({
        defaultValues,
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
                // messages of the error details which match no displayed field, appended to the global
                // error message so that they are not silently dropped
                const unmappedMessages: string[] = [];

                error.errorDetails?.forEach(errorDetail => {
                    const resolved = errorDetail.field
                        ? resolveErrorFieldPath(errorDetail.field, fieldDefinitions)
                        : undefined;

                    // a field the error only reaches through an alias holds another shape than the
                    // one the API named, so its own message would describe the wrong thing: the
                    // message stays named after the payload key, as it is when it matches no field
                    const messageKey =
                        resolved && !resolved.aliased ? resolved.path : errorDetail.field;

                    const message =
                        errorDetail.code === 'missing'
                            ? i18n('validation.required')
                            : i18n(`validation.${messageKey}`, {
                                  defaultValue: errorDetail.message,
                              });

                    if (resolved) {
                        setError(resolved.path as FieldPath<TFieldValues>, { message });
                    } else {
                        unmappedMessages.push(message);
                    }
                });

                const errorMessage = i18n(error.errorMessageKey ?? error.error, {
                    defaultValue: error.errorUserMsg ?? error.errorDescription ?? error.error,
                });
                // an error a field declares it stands for is displayed on that field instead of
                // above the form, typed after its key so that the field can tell it apart
                const errorField = error.errorMessageKey
                    ? resolveErrorMessageKeyField(error.errorMessageKey, fieldDefinitions)
                    : undefined;
                setError((errorField as FieldPath<TFieldValues> | undefined) ?? 'root', {
                    type: errorField ? error.errorMessageKey : undefined,
                    message: [errorMessage, ...unmappedMessages].join(' '),
                });
                logError(error.errorDescription ?? error.error);
            }

            if (resetAfterError) {
                reset();
            }

            return error;
        },
        [fieldDefinitions, i18n, onError, resetAfterError]
    );

    // a field may lock the submission, e.g. a verification code which can no longer be used
    const { locked, setSucceeded, value: submission } = useFormSubmissionState();

    const onSubmit = React.useCallback(
        async (data: TFieldValues): Promise<void> => {
            setSucceeded(false);
            const processedData = beforeSubmit ? beforeSubmit(data) : data;
            try {
                const result = await captchaHandler(processedData, handler);
                // told before `onSuccess` runs, which may navigate away right away
                setSucceeded(true);
                await handleSuccess(result);
            } catch (error) {
                if (typeof skipError === 'function' ? skipError(error) : skipError === true) {
                    setSucceeded(true);
                    await handleSuccess({} as Awaited<ReturnType<typeof handler>>);
                } else {
                    setSucceeded(false);
                    await handleError(error);
                }
            }
        },
        [beforeSubmit, captchaHandler, handler, handleSuccess, handleError, setSucceeded, skipError]
    );

    // react-hook-form does not guard `handleSubmit` against a submission already in flight: only the
    // disabled submit button does, which `form.requestSubmit()` ignores — an auto-submitted field (see
    // `OtpField`) would send the request again. The guard sits before `handleSubmit`, since a nested
    // call returning early would still end by setting `isSubmitting` back to `false` mid-request.
    const inFlight = React.useRef(false);

    const submit = React.useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (locked || inFlight.current) return;
            inFlight.current = true;
            void handleSubmit(onSubmit)(event).finally(() => {
                inFlight.current = false;
            });
        },
        [handleSubmit, locked, onSubmit]
    );

    return (
        <FormProvider {...form}>
            <FormSubmissionProvider value={submission}>
                <form onSubmit={submit} noValidate aria-busy={formState.isSubmitting}>
                    <div className="space-y-4">
                        {formState.errors.root?.message && (
                            <p
                                className="text-destructive text-center"
                                role="alert"
                                aria-live="polite"
                            >
                                {formState.errors.root.message}
                            </p>
                        )}

                        <FormFieldsRenderer
                            control={control}
                            fields={fieldDefinitions}
                            showLabels={showLabels}
                        />

                        {children}

                        {Captcha && <Captcha />}

                        {SubmitComponent ? (
                            <SubmitComponent
                                disabled={locked || formState.isSubmitting}
                                label={i18n(submitLabel)}
                                onClick={() => void trigger()}
                            />
                        ) : (
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={locked || formState.isSubmitting}
                            >
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
                    </div>
                </form>
            </FormSubmissionProvider>
        </FormProvider>
    );
}
Form.displayName = 'Form';
export { Form };
