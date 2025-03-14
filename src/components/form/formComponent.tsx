import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Client } from '@reachfive/identity-core';

import { PrimaryButton } from './buttonComponent';
import type { Field, FieldCreator, FieldValue } from './fieldCreator';
import { ErrorText, MutedText } from '../miscComponent';
import { type WithConfig, useConfig } from '../../contexts/config';
import { type WithI18n, useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { isAppError } from '../../helpers/errors';
import { logError } from '../../helpers/logger';
import { useDebounceCallback } from '../../helpers/useDebounceCallback';
import { type ValidatorResult } from '../../core/validation';
import { type Config } from '../../types';

const Form = styled.form`
    position: relative;
`;

const RequiredFields = styled(MutedText)`
    display: block;
    padding: ${props => `${props.theme.paddingY}px ${props.theme.paddingX}px`};
    text-align: center;
`

export type StaticContent = {
    staticContent: React.ReactNode
}

/** @todo to refine */
export type FormContext<T> = {
    client: Client
    config: Config
    errorMessage?: string
    fields: FieldValues<T>
    hasErrors?: boolean
    isLoading?: boolean
    isSubmitted: boolean,
}

export type FieldValues<T> = {
    [K in keyof T]: FieldValue<T[K]>
}

export type FieldOptions<P> = WithConfig<WithI18n<P>>

export type FormFields<P = {}> = 
    | (FieldCreator<any, any, any, any> | StaticContent)[]
    | ((options: FieldOptions<P>) => (FieldCreator<any, P, any, any> | StaticContent)[])

type FormOptions<P = {}, Model extends Record<PropertyKey, unknown> = {}> = {
    fields?: FormFields<P>
    fieldValidationDebounce?: number
    prefix?: string
    resetAfterError?: boolean
    resetAfterSuccess?: boolean
    SubmitComponent?: React.ComponentType<{ disabled: boolean, label: string, onClick: (callback: (data: Model) => void) => void }>
    submitLabel?: string
    showLabels?: boolean
    skipError?: boolean | ((error: unknown) => boolean)
    supportMultipleSubmits?: boolean
}

type FormProps<Model extends Record<PropertyKey, unknown> = {}, P = {}, R = void> = FormOptions<P, Model> & P & {
    beforeSubmit?: (data: Model) => Model
    handler: (data: Model) => Promise<R>
    initialModel?: Partial<Model>
    onError?: ((error: unknown) => void)
    onFieldChange?: (fields: FieldValues<Model>) => void
    onSuccess?: (result: R) => void
    sharedProps?: Record<string, unknown>
}

export function createForm<Model extends Record<PropertyKey, unknown> = {}, P = {}>(formOptions: FormOptions<P>) {
    function FormComponent<R = void>(props: FormProps<Model, P, R>) {
        const config = useConfig();
        const i18n = useI18n();
        const client = useReachfive()

        const {
            beforeSubmit,
            fields = [],
            fieldValidationDebounce = 1000,
            handler,
            initialModel = {},
            onError,
            onFieldChange,
            onSuccess,
            resetAfterError,
            resetAfterSuccess,
            SubmitComponent,
            submitLabel = 'send',
            sharedProps,
            showLabels = false,
            skipError,
            supportMultipleSubmits = false,
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
            (acc: Record<keyof Model, FieldType>, field: FieldType) => ({ ...acc, [field.key]: field }),
            {} as Record<keyof Model, FieldType>
        );

        const filledWithModel = (): FieldValues<Model> =>
            inputFields.reduce(
                (acc, field) => ({
                    ...acc,
                    [field.key]: field.initialize(initialModel),
                }),
                {} as FieldValues<Model>
            )

        const [fieldValues, setFieldValues] = useState<FieldValues<Model>>(filledWithModel())

        useEffect(() => {
            onFieldChange && onFieldChange(fieldValues);
        }, [fieldValues])

        const handleFieldChange = <T,>(fieldName: keyof typeof fieldValues, stateUpdate: FieldValue<T>) => {
            const { validation: _, ...currentState } = fieldValues[fieldName];
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

            setFieldValues(newFieldValues);
        }

        const validateField = async <T, P>(field: Field<T, P>, fieldState: FieldValue<T>, ctx: FormContext<Model>) =>
            await field.validate(fieldState, ctx) || {} as ValidatorResult;

        const validateAllFields = async (callback: (isValid: boolean) => void) => {
            const { hasErrors, values: newFieldValues } = await inputFields.reduce(
                async (acc, field) => {
                    const fieldState = fieldValues[field.key as keyof Model];
                    const validation = await validateField(field, fieldState, { client, config, isSubmitted: true, fields: fieldValues });
                    return {
                        hasErrors: (await acc).hasErrors || (typeof validation === 'object' && 'error' in validation),
                        values: {
                            ...(await acc).values,
                            [field.key]: {
                                ...fieldState,
                                validation
                            }
                        }
                    }
                },
                Promise.resolve({ hasErrors: false, values: {} as FieldValues<Model> })
            )

            setHasErrors(hasErrors);
            setFieldValues(newFieldValues);

            callback && callback(!hasErrors)
        }

        const handleFieldValidation = useCallback(
            async <T,>(fieldName: keyof typeof fieldValues, stateUpdate: FieldValue<T>) => {
                const { validation: _, ...currentState } = fieldValues[fieldName];
                
                const newState = {
                    ...currentState,
                    ...stateUpdate
                } satisfies FieldValue<T>
                
                const validation = await validateField(
                    fieldByKey[fieldName],
                    newState,
                    { client, config, isSubmitted: false, fields: fieldValues }
                );
                
                const newFieldValues = {
                    ...fieldValues,
                    [fieldName]: {
                        ...newState,
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
                return err.errorMessageKey
                    ? i18n(err.errorMessageKey, {}, () => err.errorUserMsg ?? err.error) 
                    : err.errorUserMsg;
            }
        }

        const handleSuccess = (result: R) => {
            onSuccess?.(result);

            setIsLoading(!supportMultipleSubmits)
            setErrorMessage(undefined)

            if (resetAfterSuccess) {
                setFieldValues(filledWithModel())
            }
        };

        const handleError = (err: unknown) => {
            onError?.(err);

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
            setErrorMessage(formatErrorMessage(err) ?? i18n('unexpectedErrorOccurred'))
            if (resetAfterError) {
                setFieldValues(filledWithModel())
            }
        };

        const processData = async (callback: (data: Model) => void) => {
            await validateAllFields(isValid => {
                if (isValid) {
                    setIsLoading(true)

                    const fieldData = inputFields.reduce((acc, field) => {
                        return field.unbind<Model>(acc, fieldValues[field.key as keyof Model]);
                    }, {} as Model);

                    const processedData = beforeSubmit ? beforeSubmit(fieldData) : fieldData;

                    callback(processedData)
                }
            })
        }

        const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            await processData(processedData => {
                handler(processedData)
                    .then(handleSuccess)
                    .catch((err: unknown) => {
                        (typeof skipError === 'function' ? skipError(err) : skipError === true)
                            ? handleSuccess({} as R)
                            : handleError(err)
                    });
            })
        }

        return (
            <Form noValidate onSubmit={handleSubmit}>
                {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
                {
                    allFields.map(field => !('staticContent' in field) ? field.render({
                        state: fieldValues[field.key as keyof Model],
                        onChange: newState => {
                            handleFieldChange(field.key as keyof Model, newState);
                            handleFieldValidationDebounced(field.key as keyof Model, newState);
                        },
                        ...sharedProps as P
                    }) : field.staticContent)
                }
                {SubmitComponent ? (
                    <SubmitComponent
                        disabled={isLoading}
                        label={i18n(submitLabel)}
                        onClick={processData}
                    />
                ) : (
                    <PrimaryButton disabled={isLoading} data-testid="submit">
                        {i18n(submitLabel)}
                    </PrimaryButton>
                )}
                {showLabels && <RequiredFields>*{i18n('form.required.fields')}</RequiredFields>}
            </Form>
        )
    }
    return FormComponent;
}
