import { Client } from '@reachfive/identity-core';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { useI18n, type WithI18n } from '../../contexts/i18n';
import { useReachfive, type WithConfig } from '../../contexts/reachfive';
import { type ValidatorResult } from '../../core/validation';
import { isAppError } from '../../helpers/errors';
import { logError } from '../../helpers/logger';
import { useDebounceCallback } from '../../helpers/useDebounceCallback';
import { type Config } from '../../types';
import { useCaptcha } from '../captcha';
import { ErrorText, MutedText } from '../miscComponent';
import { PrimaryButton } from './buttonComponent';
import type { Field, FieldCreator, FieldValue } from './fieldCreator';

const Form = styled.form`
    position: relative;
`;

const RequiredFields = styled(MutedText)`
    display: block;
    padding: ${props => `${props.theme.paddingY}px ${props.theme.paddingX}px`};
    text-align: center;
`;

export type StaticContent = {
    staticContent: React.ReactNode;
};

/** @todo to refine */
export type FormContext<Model> = {
    client: Client;
    config: Config;
    errorMessage?: string;
    fields: Model;
    hasErrors?: boolean;
    isLoading?: boolean;
    isSubmitted: boolean;
};

export type FieldValues<T> = {
    [K in keyof T]: FieldValue<T[K]>;
};

export type FieldOptions<P> = WithConfig<WithI18n<P>>;

type FormField = FieldCreator<any, any, any, any> | StaticContent;

export type FormFieldsBuilder<P = {}> = FormField[] | ((options: FieldOptions<P>) => FormField[]);

export type FieldCreators<FF extends FormFieldsBuilder<P>, P = {}> = FF extends (
    ...args: any
) => any
    ? ReturnType<FF>
    : FF;

/**
 * transform fields builder into a record of field values
 * @example
 * const builder: FormFieldsBuilder = [
 *   {
 *     key: 'test',
 *     path: 'test',
 *     create: () => ({
 *       key: 'test',
 *       render: () => null,
 *       initialize: () => ({ value: '' }),
 *       unbind: () => ({ test: '' }),
 *       validate: () => Promise.resolve({ valid: true })
 *     })
 *   }
 * ]
 * type Test = FormFields<typeof builder>
 * // { test: { value: '', isDirty: false, validation: { valid: true } } }
 */
export type FormFields<Fields extends FormFieldsBuilder<P>, P = {}> = {
    [F in FieldCreators<Fields, P>[number] as F extends FieldCreator<any, any, any, any>
        ? F['key']
        : never]: F extends FieldCreator<infer T, P, any, infer K> ? FieldValue<T, K> : never;
};

type FormOptions<P = {}, Model extends Record<PropertyKey, unknown> = {}> = {
    fields?: FormFieldsBuilder<P>;
    fieldValidationDebounce?: number;
    prefix?: string;
    resetAfterError?: boolean;
    resetAfterSuccess?: boolean;
    SubmitComponent?: React.ComponentType<{
        disabled: boolean;
        label: string;
        onClick: (callback: (data: Model) => void) => void;
    }>;
    submitLabel?: string;
    showLabels?: boolean;
    skipError?: boolean | ((error: unknown) => boolean);
    supportMultipleSubmits?: boolean;
};

type FormProps<Model extends Record<PropertyKey, unknown> = {}, P = {}, R = void> = FormOptions<
    P,
    Model
> &
    P & {
        beforeSubmit?: (data: Model) => Model;
        handler: (data: Model) => Promise<R>;
        initialModel?: Partial<Model>;
        onError?: (error: unknown) => void | PromiseLike<void>;
        onFieldChange?: (fields: Model) => void;
        onSuccess?: (result: R) => void | PromiseLike<void>;
        sharedProps?: Record<string, unknown>;
    };

export function createForm<Model extends Record<PropertyKey, unknown> = {}, P = {}>(
    formOptions: FormOptions<P>
) {
    function FormComponent<R = void>(props: FormProps<Model, P, R>) {
        const i18n = useI18n();
        const { client, config } = useReachfive();
        const { Captcha, handler: captchaHandler } = useCaptcha();

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

        const allFields = (
            typeof fields === 'function' ? fields({ config, i18n, ...(props as P) }) : fields
        )
            .filter(
                (field): field is FieldCreator<Model, P> | StaticContent => !!field
            ) /** @todo: is this useless ? */
            .map(field =>
                'staticContent' in field ? field : field.create({ i18n, showLabel: showLabels })
            );

        type FieldType = typeof allFields extends (infer F)[] ? Exclude<F, StaticContent> : never;

        const inputFields = allFields.filter(
            (field): field is FieldType => !('staticContent' in field)
        );

        const fieldByKey = Object.fromEntries(inputFields.map(field => [field.key, field]));

        const filledWithModel = () =>
            Object.fromEntries(
                Object.entries(fieldByKey).map(([key, field]) => [
                    key,
                    field.initialize<Model>(initialModel),
                ])
            );

        const [fieldValues, setFieldValues] = useState(filledWithModel());

        type FieldKey = keyof typeof fieldValues;
        type FieldValue<K extends FieldKey> = (typeof fieldValues)[K];

        const valuesToModel = () => {
            return inputFields.reduce((acc, field) => {
                return field.unbind<Model>(acc, getFieldValue(field.key));
            }, {} as Model);
        };

        const getFieldValue = <K extends FieldKey>(fieldName: K): FieldValue<K> => {
            return fieldValues[fieldName] ?? ({} as never);
        };

        useEffect(() => {
            onFieldChange && onFieldChange(valuesToModel());
        }, [fieldValues]);

        const handleFieldChange = <K extends FieldKey>(
            fieldName: K,
            stateUpdate: FieldValue<K>
        ) => {
            const { validation: _, ...currentState } = getFieldValue(fieldName);

            const newState = {
                ...currentState,
                // ...(typeof stateUpdate === 'function' ? stateUpdate(currentState) : stateUpdate)
                ...stateUpdate,
            };

            const newFieldValues = {
                ...fieldValues,
                [fieldName]: {
                    ...newState,
                },
            };

            setFieldValues(newFieldValues);
        };

        const validateField = async <K extends string>(
            field: Field<Model, P, any, K>,
            fieldState: FieldValue<K>,
            ctx: FormContext<Model>
        ) => (await field.validate(fieldState, ctx)) || ({} as ValidatorResult);

        const validateAllFields = async (callback: (isValid: boolean) => void) => {
            const data = valuesToModel();
            const { hasErrors, values: newFieldValues } = await inputFields.reduce(
                async (acc, field) => {
                    const fieldState = getFieldValue(field.key);
                    const validation = await validateField(field, fieldState, {
                        client,
                        config,
                        isSubmitted: true,
                        fields: data,
                    });
                    return {
                        hasErrors:
                            (await acc).hasErrors ||
                            (typeof validation === 'object' && 'error' in validation),
                        values: {
                            ...(await acc).values,
                            [field.key]: {
                                ...fieldState,
                                validation,
                            },
                        } satisfies FormFields<typeof fields, P>,
                    };
                },
                Promise.resolve({ hasErrors: false, values: {} as FormFields<typeof fields, P> })
            );

            setHasErrors(hasErrors);
            setFieldValues(newFieldValues);

            callback && callback(!hasErrors);
        };

        const handleFieldValidation = useCallback(
            async <K extends FieldKey>(fieldName: K, stateUpdate: FieldValue<K>) => {
                const { validation: _, ...currentState } = getFieldValue(fieldName);

                const newState = {
                    ...currentState,
                    ...stateUpdate,
                } satisfies FieldValue<K>;

                const data = valuesToModel();

                const validation = await validateField(fieldByKey[fieldName], newState, {
                    client,
                    config,
                    isSubmitted: false,
                    fields: data,
                });

                const newFieldValues = {
                    ...fieldValues,
                    [fieldName]: {
                        ...newState,
                        validation,
                    } satisfies typeof currentState,
                };

                // !!validation.error || find(newFields, ({ validation = {} }) => validation.error) !== undefined,
                setHasErrors(typeof validation === 'object' && 'error' in validation);

                setFieldValues(newFieldValues);
            },
            [fieldValues, fieldByKey]
        );

        const handleFieldValidationDebounced = useDebounceCallback(
            handleFieldValidation,
            fieldValidationDebounce
        );

        const formatErrorMessage = (err: unknown) => {
            if (typeof err === 'string') {
                return i18n(err);
            } else if (isAppError(err)) {
                return err.errorMessageKey
                    ? i18n(err.errorMessageKey, {}, () => err.errorUserMsg ?? err.error)
                    : err.errorUserMsg;
            }
        };

        const handleSuccess = async (result: R) => {
            await onSuccess?.(result);

            setIsLoading(!supportMultipleSubmits);
            setErrorMessage(undefined);

            if (resetAfterSuccess) {
                setFieldValues(filledWithModel());
            }
        };

        const handleError = async (err: unknown) => {
            await onError?.(err);

            if (isAppError(err) && !err.errorUserMsg) {
                if (err.errorDescription) {
                    logError(err.errorDescription);
                } else {
                    logError(err.error);
                }
            } else if (typeof err === 'string' || err instanceof Error) {
                logError(err);
            }

            setIsLoading(false);
            setErrorMessage(formatErrorMessage(err) ?? i18n('unexpectedErrorOccurred'));
            if (resetAfterError) {
                setFieldValues(filledWithModel());
            }
        };

        const processData = async (callback: (data: Model) => void) => {
            await validateAllFields(isValid => {
                if (isValid) {
                    setIsLoading(true);

                    const fieldData = valuesToModel();

                    const processedData = beforeSubmit ? beforeSubmit(fieldData) : fieldData;

                    callback(processedData);
                }
            });
        };

        const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            await processData(processedData => {
                captchaHandler(processedData, handler)
                    .then(handleSuccess)
                    .catch((err: unknown) => {
                        (typeof skipError === 'function' ? skipError(err) : skipError === true)
                            ? handleSuccess({} as R)
                            : handleError(err);
                    });
            });
        };

        return (
            <Form noValidate onSubmit={handleSubmit}>
                {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
                {allFields.map(field =>
                    !('staticContent' in field)
                        ? field.render({
                              state: getFieldValue(field.key),
                              onChange: newState => {
                                  handleFieldChange(field.key, newState);
                                  handleFieldValidationDebounced(field.key, newState);
                              },
                              ...(sharedProps as P),
                          })
                        : field.staticContent
                )}
                {Captcha && <Captcha />}
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
        );
    }
    return FormComponent;
}
