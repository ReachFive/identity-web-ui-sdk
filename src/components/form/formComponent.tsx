import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { PrimaryButton } from './buttonComponent';
import { Field, FieldCreator, FieldValue } from './fieldCreator';
import { ErrorText } from '../miscComponent';
import { WithConfig, useConfig } from '../../contexts/config';
import { WithI18n, useI18n } from '../../contexts/i18n';
import { AppError, isAppError } from '../../helpers/errors';
import { logError } from '../../helpers/logger';
import { useDebounceCallback } from '../../helpers/useDebounceCallback';

const Form = styled.form`
    position: relative;
`;

export type StaticContent = {
    staticContent: React.ReactNode
}

export type FieldOptions<P> = WithConfig<WithI18n<P>>

export type FormFields<P = {}> = 
    (FieldCreator<unknown, P> | StaticContent)[]
    | ((options: FieldOptions<P>) => (FieldCreator<unknown, P> | StaticContent)[])

type FormOptions<P = {}> = {
    allowWebAuthnLogin?: boolean
    fields?: FormFields<P>
    fieldValidationDebounce?: number
    prefix?: string
    resetAfterError?: boolean
    resetAfterSuccess?: boolean
    submitLabel?: string
    showLabels?: boolean
    skipError?: boolean | ((error: Error) => boolean) | ((error: AppError) => boolean)
    supportMultipleSubmits?: boolean
    webAuthnButtons?: (isLoading: boolean, onClick: (event: React.MouseEvent<HTMLElement>) => void) => React.ReactNode
}

type FormProps<Model = {}, P = {}, R = {}> = FormOptions<P> & P & {
    beforeSubmit?: (data: Model) => Model
    handler: (data: Model) => Promise<R>
    initialModel?: Model
    onError?: (error: Error | AppError) => void
    onFieldChange?: (fields: Record<string, FieldValue<unknown>>) => void
    onSuccess?: (result: R) => void
    redirect?: (data: Model) => void
    sharedProps?: Record<string, unknown>
}

export function createForm<Model = {}, P = {}>(formOptions: FormOptions<P>) {
    const FormComponent = <R,>(props: FormProps<Model, P, R>) => {
        const config = useConfig();
        const i18n = useI18n();

        const {
            allowWebAuthnLogin = false,
            beforeSubmit,
            fields = [],
            fieldValidationDebounce = 1000,
            handler,
            initialModel = {},
            onError,
            onFieldChange,
            onSuccess,
            redirect,
            resetAfterError,
            resetAfterSuccess,
            submitLabel = 'send',
            sharedProps,
            showLabels = false,
            skipError,
            supportMultipleSubmits = false,
            webAuthnButtons,
        } = Object.assign({}, formOptions, props);

        const [isLoading, setIsLoading] = useState(false);
        const [_hasErrors, setHasErrors] = useState(false);
        const [errorMessage, setErrorMessage] = useState<string | undefined>();

        const allFields = 
            (typeof fields === 'function' ? fields({ config, i18n, ...props as P }) : fields)
                .filter((field): field is FieldCreator<unknown, P> | StaticContent => !!field) /** @todo: is this useless ? */
                .map(field => (
                    'staticContent' in field
                        ? field
                        : field.create({ i18n, showLabel: showLabels })
                ));

        type FieldType = typeof allFields extends (infer F)[] ? Exclude<F, StaticContent> : never

        const inputFields = allFields.filter(
            (field): field is FieldType =>
                !('staticContent' in field)
        );

        
        const fieldByKey = inputFields.reduce(
            (acc: Record<string, FieldType>, field: FieldType) => ({ ...acc, [field.key]: field }),
            {} as Record<string, FieldType>
        );

        const filledWithModel = (): Record<string, FieldValue<unknown>> =>
            inputFields.reduce(
                (acc, field) => ({
                    ...acc,
                    [field.key]: field.initialize(initialModel),
                }),
                {} as Record<string, FieldValue<unknown>>
            )
        
        const [fieldValues, setFieldValues] = useState(filledWithModel())
                
        const handleFieldChange = <T,>(fieldName: keyof typeof fieldValues, stateUpdate: FieldValue<T>) => {
            const currentState = fieldValues[fieldName];
            const newState = {
                ...currentState,
                // ...(typeof stateUpdate === 'function' ? stateUpdate(currentState) : stateUpdate)
                ...stateUpdate
            } satisfies FieldValue<T>;

            const newFieldValues = {
                ...fieldValues,
                [fieldName]: {
                    ...newState,
                }
            } satisfies Record<string, FieldValue<unknown>>;
                
            onFieldChange && onFieldChange(newFieldValues);
            
            setFieldValues(newFieldValues);
        }

        const validateField = <T, P, S extends { isSubmitted: boolean }>(field: Field<T, P>, fieldState: FieldValue<T>, ctx: S) =>
            field.validate(fieldState, ctx) || {};
        
        const validateAllFields = (callback: (isValid: boolean) => void) => {
            const { hasErrors, values: newFieldValues } = inputFields.reduce(
                (acc, field) => {
                    const fieldState = fieldValues[field.key];
                    const validation = validateField(field, fieldState, { isSubmitted: true });
                    return {
                        hasErrors: acc.hasErrors || (typeof validation === 'object' && 'error' in validation),
                        values: {
                            ...acc.values,
                            [field.key]: {
                                ...fieldState,
                                validation
                            }
                        }
                    }
                },
                { hasErrors: false, values: {} as Record<string, FieldValue<unknown>> }
            )

            setHasErrors(hasErrors);
            setFieldValues(newFieldValues);

            callback && callback(!hasErrors)
        }

        const handleFieldValidation = useCallback(
            (fieldName: keyof typeof fieldValues) => {
                const currentState = fieldValues[fieldName];
                const validation = validateField(fieldByKey[fieldName], currentState, { isSubmitted: false });

                const newFieldValues = {
                    ...fieldValues,
                    [fieldName]: {
                        ...currentState,
                        validation
                    } satisfies typeof currentState
                }

                // !!validation.error || find(newFields, ({ validation = {} }) => validation.error) !== undefined,
                setHasErrors(typeof validation === 'object' && 'error' in validation)

                setFieldValues(newFieldValues);
            },
            [fieldValues, fieldByKey]
        )

        const handleFieldValidationDebounced = useDebounceCallback(handleFieldValidation, fieldValidationDebounce);
        
        const formatErrorMessage = (err: unknown) => {
            if (typeof err === 'string') {
                return i18n(err)
            } else if (isAppError(err)) {
                const i18nErrorMessage = i18n(err.errorMessageKey);
                return i18nErrorMessage === err.errorMessageKey ? err.errorUserMsg : i18nErrorMessage
            }
        }

        const handleSuccess = (result: R) => {
            onSuccess && onSuccess(result);

            setIsLoading(!supportMultipleSubmits)
            setErrorMessage(undefined)

            if (resetAfterSuccess) {
                setFieldValues(filledWithModel())
            }
        };

        const handleError = (err: Error | AppError) => {
            onError && onError(err);

            if (isAppError(err) && !err.errorUserMsg) {
                if (err.errorDescription) {
                    logError(err.errorDescription)
                } else {
                    logError(err.error)
                }
            } else if (typeof err === 'string' || err instanceof Error) {
                logError(err)
            }

            setIsLoading(false);
            setErrorMessage(formatErrorMessage(err) || i18n('unexpectedErrorOccurred'))
            if (resetAfterError) {
                setFieldValues(filledWithModel())
            }
        };

        const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            validateAllFields(isValid => {
                if (isValid) {
                    setIsLoading(true)

                    const fieldData = inputFields.reduce((acc, field) => {
                        return field.unbind(acc, fieldValues[field.key]);
                    }, {} as Model);

                    const processedData = beforeSubmit ? beforeSubmit(fieldData) : fieldData;

                    handler(processedData)
                        .then(handleSuccess)
                        .catch((err: Error | AppError) => 
                            // @ts-expect-error TODO: skipError(err) param type
                            typeof skipError === 'function' && skipError(err) ? handleSuccess() : handleError(err));
                }
            });
        }

        const handleClick = (event: React.MouseEvent<HTMLElement>) => {
            event.preventDefault()

            validateAllFields(isValid => {
                if (isValid && typeof redirect === 'function') {
                    setIsLoading(true);

                    const fieldData = inputFields.reduce((acc, field) => {
                        return field.unbind(acc, fieldValues[field.key]);
                    }, {} as Model);

                    redirect(fieldData);
                }
            });
        }

        return (
            <Form noValidate onSubmit={handleSubmit}>
                {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
                {
                    allFields.map(field => !('staticContent' in field) ? field.render({
                        state: fieldValues[field.key],
                        onChange: newState => {
                            handleFieldChange(field.key, newState);
                            handleFieldValidationDebounced(field.key);
                        },
                        ...sharedProps as P
                    }) : field.staticContent)
                }
                {
                    !allowWebAuthnLogin && <PrimaryButton disabled={isLoading}>
                        {i18n(submitLabel)}
                    </PrimaryButton>
                }
                {allowWebAuthnLogin && webAuthnButtons && webAuthnButtons(isLoading, handleClick)}
            </Form>
        )
    }
    return FormComponent;
}
