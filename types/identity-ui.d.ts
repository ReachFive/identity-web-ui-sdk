/**
 * @reachfive/identity-ui - v1.33.1
 * Compiled Thu, 20 Mar 2025 14:41:30 UTC
 *
 * Copyright (c) ReachFive.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
import * as React from 'react';
import React__default, { CSSProperties, ReactNode, PropsWithChildren, ComponentType } from 'react';
import * as _reachfive_identity_core from '@reachfive/identity-core';
import { Config as Config$1, RemoteSettings, ConsentVersions, CustomField, Client as Client$1, ConsentType, PasswordStrengthScore, PasswordPolicy, CustomFieldType, AuthOptions, MFA, PasswordlessResponse, SingleFactorPasswordlessParams, Profile, UserConsent, DeviceCredential } from '@reachfive/identity-core';
export { Config } from '@reachfive/identity-core';
import * as csstype from 'csstype';
import { Country, Value as Value$2 } from 'react-phone-number-input';
import * as libphonenumber_js from 'libphonenumber-js';
import { PasswordlessParams } from '@reachfive/identity-core/es/main/oAuthClient';

type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>
} & {}

/**
 * From T, make optional a set of properties whose keys are in the union K
 * @example Optional<{ firstname: string, lastname: string }, 'lastname'> // => { firstname: string, lastname?: string }
 */
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

type RequiredProperty<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
}

type ConsentsVersions = { consentsVersions: Record<string, ConsentVersions> }

type CustomFields = { customFields?: CustomField[] }

type Config = Config$1 & RemoteSettings & ConsentsVersions & CustomFields

type OnSuccess = (...args: any[]) => void

type OnError = (error?: unknown) => void

declare module 'styled-components' {
    export interface DefaultTheme extends Theme {}
}

type ThemeOptions = RecursivePartial<Theme>

interface BaseTheme {
    /**
     * @default true
     */
    animateWidgetEntrance: boolean
    /** Specifies the font-size.
     * @default 14
     */
    fontSize: number
    /** Specifies the font-size for small texts.
     * @default 12
     */
    smallTextFontSize: number
    /** Specifies the line-height.
     * @default 1.428571429
     */
    lineHeight: number
    /**
     * @default "#212529"
     */
    headingColor: NonNullable<CSSProperties['color']>
    /**
     * @default "#495057"
     */
    textColor: NonNullable<CSSProperties['color']>
    /**
     * @default "#adb5bd"
     */
    mutedTextColor: NonNullable<CSSProperties['color']>
     /**
     * @default "3"
     */
    borderRadius: number
    /**
     * @default "#ced4da "
     */
    borderColor: NonNullable<CSSProperties['color']>
    /**
     * @default 1
     */
    borderWidth: number
    /**
     * @default "#ffffff"
     */
    backgroundColor: NonNullable<CSSProperties['color']>
    /**
     * The button and link default color.
     * @default "#229955"
     */
    primaryColor: NonNullable<CSSProperties['color']>
    /**
     * @default "#dc4e41"
     */
    dangerColor: NonNullable<CSSProperties['color']>
    /**
     * @default "#ffc107"
     */
    warningColor: NonNullable<CSSProperties['color']>
    /**
     * @default "#229955"
     */
    successColor: NonNullable<CSSProperties['color']>
    /**
     * @default "#e9ecef"
     */
    lightBackgroundColor: NonNullable<CSSProperties['color']>
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number
    spacing: number
    /**
     * @default 400
     */
    maxWidth: number
    _absoluteLineHeight: number
    _blockInnerHeight: number
    _blockHeight: number
}

interface LinkTheme {
    color: NonNullable<CSSProperties['color']>
    decoration: NonNullable<CSSProperties['textDecoration']>
    hoverColor: NonNullable<CSSProperties['color']>
    hoverDecoration: NonNullable<CSSProperties['textDecoration']>
}

interface InputTheme {
    color: NonNullable<CSSProperties['color']>
    placeholderColor: NonNullable<CSSProperties['color']>
    fontSize: number
    lineHeight: number
    paddingX: number
    paddingY: number
    borderRadius: number
    borderColor: NonNullable<CSSProperties['color']>
    borderWidth: number
    background: NonNullable<CSSProperties['color']>
    disabledBackground: NonNullable<CSSProperties['color']>
    boxShadow: NonNullable<CSSProperties['boxShadow']>
    focusBorderColor: NonNullable<CSSProperties['color']>
    focusBoxShadow: (color?: CSSProperties['color']) => NonNullable<CSSProperties['boxShadow']>
    height: number
}

interface ButtonTheme {
    /** Specifies the font-weight (such as normal, bold, or 900).
     * @default 'bold'
     */
    fontWeight: NonNullable<CSSProperties['fontWeight']>
    /** Specifies the font-size. */
    fontSize: number
     /** Specifies the line-height. */
    lineHeight: number
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number
    /** Specifies the border-color. */
    borderColor: NonNullable<CSSProperties['color']>,
    /** Specifies the border-radius. */
    borderRadius: number
    /** Specifies the border-width. */
    borderWidth: number
    /** Function that specifies the box shadow based on the border color. */
    focusBoxShadow: (color?: CSSProperties['color']) => NonNullable<CSSProperties['boxShadow']>
    /** Specifies the height. */
    height: number
}

interface SocialButtonTheme {
    /** Boolean that specifies if the buttons are inline (horizonally-aligned). */
    inline: boolean
     /** Boolean that specifies if the text is visible. */
    textVisible: boolean
    /** Specifies the font-weight (such as normal, bold, or 900). */
    fontWeight: NonNullable<CSSProperties['fontWeight']>
    /** Specifies the font-size. */
    fontSize: number
     /** Specifies the line-height. */
    lineHeight: number
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number
    /** Specifies the border-color. */
    borderColor: NonNullable<CSSProperties['color']>,
    /** Specifies the border-radius. */
    borderRadius: number
    /** Specifies the border-width. */
    borderWidth: number
    /** Function that specifies the box shadow based on the border color. */
    focusBoxShadow: (color?: CSSProperties['color']) => NonNullable<CSSProperties['boxShadow']>
    /** Specifies the height. */
    height: number
}

interface PasswordStrengthTheme {
    color0: NonNullable<CSSProperties['color']>
    color1: NonNullable<CSSProperties['color']>
    color2: NonNullable<CSSProperties['color']>
    color3: NonNullable<CSSProperties['color']>
    color4: NonNullable<CSSProperties['color']>
}

interface Theme extends BaseTheme {
    link: LinkTheme
    input: InputTheme
    /** Button theming options. */
    button: ButtonTheme
    /** Social button theming options. */
    socialButton: SocialButtonTheme
    passwordStrengthValidator: PasswordStrengthTheme
}

type I18nMessages = Record<string, string>;
type I18nNestedMessages = Record<string, string | I18nMessages>;
type I18nMessageParams = Record<string, unknown>;
type I18nResolver = (key: string, params?: I18nMessageParams, fallback?: (params?: I18nMessageParams) => string) => string;

interface ReachfiveContext {
    client: Client$1;
    config: Config;
    i18n: I18nMessages;
}
declare const ReachfiveContext: React__default.Context<ReachfiveContext | undefined>;
declare function useReachfive(): ReachfiveContext;
interface ReachfiveProviderProps {
    /** ReachFive core client instance */
    client: Client$1;
    /** Core configuration for ReachFive */
    config: Config$1;
    /** An alternate UI to render in place of the actual UI if it has not finished loading */
    fallback?: ReactNode;
}
/**
 * Provider component for ReachFive authentication context
 *
 * @example
 * ```tsx
 * import { createClient, type Config } from '@reachfive/identity-core';
 * import { ReachfiveProvider, Auth } from '@reachfive/identity-ui';
 *
 * const coreConfig: Config = { clientId: '####', domain: 'local.reach5.co' }
 *
 * const coreClient = createClient(coreConfig)
 *
 * <ReachfiveProvider client={coreClient} config={coreConfig} fallback={<Loading />}>
 *   <Auth />
 * </ReachfiveProvider>
 * ```
 */
declare function ReachfiveProvider({ children, client, config: coreConfig, fallback }: PropsWithChildren<ReachfiveProviderProps>): React__default.JSX.Element;

type I18nProps$1 = {
    i18n?: I18nNestedMessages;
};
type ThemeProps = {
    theme?: ThemeOptions;
};

interface I18nProps {
    i18n: I18nResolver;
}
type WithI18n<P> = P & I18nProps;

declare class PathMapping {
    protected readonly modelPath: string;
    constructor(modelPath: string);
    bind<T extends Record<string, unknown>>(model: T): unknown;
    unbind<T extends Record<string, unknown>, V>(model: T, value: V): T | V;
}

declare class CompoundValidator<T, C = {}> {
    current: Validator<T, C> | CompoundValidator<T, C>;
    next: Validator<T, C> | CompoundValidator<T, C>;
    constructor(current: Validator<T, C> | CompoundValidator<T, C>, next: Validator<T, C> | CompoundValidator<T, C>);
    create(i18n: I18nResolver): ValidatorInstance<T, C>;
    and(validator: Validator<T, C> | CompoundValidator<T, C>): CompoundValidator<T, C>;
}
type VaildatorError<Extra = {}> = {
    valid: false;
    error?: string;
} & Extra;
type ValidatorSuccess<Extra = {}> = {
    valid: true;
} & Extra;
type ValidatorResult<Extra = {}> = VaildatorError<Extra> | ValidatorSuccess<Extra>;
type ValidatorInstance<T, C, Extra = {}> = (value: T, ctx: C) => Promise<ValidatorResult<Extra>>;
type RuleResult<E = {}> = boolean | ValidatorSuccess<E> | VaildatorError<E>;
type Rule<T, C, E = {}> = (value: T, ctx: C) => RuleResult<E> | Promise<RuleResult<E>>;
type Hint<T> = (value: T) => (string | undefined);
interface ValidatorOptions<T, C, E = {}> {
    rule: Rule<T, C, E>;
    hint?: Hint<T> | string;
    parameters?: Record<string, unknown>;
}
declare class Validator<T, C = {}, E = {}> {
    rule: Rule<T, C, E>;
    hint: Hint<T>;
    parameters: Record<string, unknown>;
    constructor({ rule, hint, parameters }: ValidatorOptions<T, C, E>);
    create(i18n: I18nResolver): ValidatorInstance<T, C, E>;
    and(validator: Validator<T, C> | CompoundValidator<T, C>): CompoundValidator<T, C>;
}

type FormValue<T, K extends string = 'raw'> = T | RichFormValue<T, K>;
type RichFormValue<T, K extends string = 'raw'> = Record<K, T>;

/** @todo to refine */
type FormContext<T> = {
    client: Client$1;
    config: Config;
    errorMessage?: string;
    fields: FieldValues<T>;
    hasErrors?: boolean;
    isLoading?: boolean;
    isSubmitted: boolean;
};
type FieldValues<T> = {
    [K in keyof T]: FieldValue<T[K]>;
};

interface FieldCreateProps {
    showLabel: boolean;
}
interface FieldCreator<T, P = {}, E extends Record<string, unknown> = {}, K extends string = 'raw'> {
    path: string;
    create: (options: WithI18n<FieldCreateProps>) => Field$1<T, P, E, K>;
}
interface Field$1<T, P = {}, E extends Record<string, unknown> = {}, K extends string = 'raw'> {
    key: string;
    render: (props: Partial<P> & Partial<FieldComponentProps<T, {}, E, K>> & {
        state: FieldValue<T, K, E>;
    }) => React__default.ReactNode;
    initialize: <M extends Record<PropertyKey, unknown>>(model: M) => FieldValue<T, K>;
    unbind: <M extends Record<PropertyKey, unknown>>(model: M, state: FieldValue<T, K, E>) => M;
    validate: (data: FieldValue<T, K, E>, ctx: FormContext<any>) => Promise<ValidatorResult>;
}
type FieldValue<T, K extends string = 'raw', E extends Record<string, unknown> = {}> = E & {
    value?: FormValue<T, K>;
    isDirty?: boolean;
    validation?: ValidatorResult;
};
type FieldComponentProps<T, P = {}, E extends Record<string, unknown> = {}, K extends string = 'raw'> = P & {
    inputId: string;
    key: string;
    path: string;
    label: string;
    onChange: (value: FieldValue<T, K, E>) => void;
    placeholder?: string;
    autoComplete?: AutoFill;
    rawProperty?: K;
    required?: boolean;
    readOnly?: boolean;
    i18n: I18nResolver;
    showLabel?: boolean;
    value?: FormValue<T, K>;
    validation?: ValidatorResult<E>;
};
interface Formatter<T, F, K extends string> {
    bind: (value?: T) => FormValue<F, K> | undefined;
    unbind: (value?: FormValue<F, K>) => T | null | undefined;
}
type FieldDefinition<T, F = T, K extends string = 'raw'> = {
    key: string;
    path?: string;
    label: string;
    required?: boolean;
    readOnly?: boolean;
    autoComplete?: AutoFill;
    defaultValue?: T;
    format?: Formatter<T, F, K>;
    validator?: Validator<F, any> | CompoundValidator<F, any>;
};
interface FieldProps<T, F, P extends FieldComponentProps<F, ExtraParams, E, K>, ExtraParams extends Record<string, unknown> = {}, K extends string = 'raw', E extends Record<string, unknown> = {}> extends FieldDefinition<T, F, K> {
    label: string;
    mapping?: PathMapping;
    format?: Formatter<T, F, K>;
    rawProperty?: K;
    component: ComponentType<P>;
    extendedParams?: ExtraParams | ((i18n: I18nResolver) => ExtraParams);
}

type ConsentFieldOptions$1 = {
    type: ConsentType;
    consentCannotBeGranted?: boolean;
    description: string;
    version: {
        language: string;
        versionId: number;
    };
};
interface ConsentFieldProps extends FieldComponentProps<boolean, ConsentFieldOptions$1, {}, 'granted'> {
}
type Value$1 = {
    consentType?: ConsentType;
    consentVersion?: {
        language: string;
        versionId: number;
    };
    granted: boolean;
};
declare function consentField({ type, required, consentCannotBeGranted, description, version, ...props }: Omit<FieldDefinition<Value$1, boolean>, 'defaultValue'> & {
    defaultValue?: boolean;
} & ConsentFieldOptions$1): FieldCreator<boolean, ConsentFieldProps, {}, "granted">;

type ExtraParams$2 = {
    locale: string;
    yearDebounce?: number;
};
interface DateFieldProps extends FieldComponentProps<Date, ExtraParams$2> {
}
declare function dateField({ format, key, label, locale, validator, yearDebounce, ...props }: Optional<FieldDefinition<string, Date>, 'key' | 'label'> & Optional<ExtraParams$2, 'locale'>, config: Config): FieldCreator<Date, DateFieldProps, ExtraParams$2>;

interface Option {
    label: string;
    value: string;
}
interface SelectProps extends React__default.SelectHTMLAttributes<HTMLSelectElement> {
    hasError?: boolean;
    options: Option[];
    placeholder?: string;
}

type Value = SelectProps['value'];
type SelectOptions = {
    values: SelectProps['options'];
};
interface SelectFieldProps extends FieldComponentProps<Value, SelectOptions> {
}
declare function selectField({ values, ...config }: FieldDefinition<string, Value> & SelectOptions): FieldCreator<string | number | readonly string[] | undefined, SelectFieldProps, {}, "raw">;

interface CheckboxFieldProps extends FieldComponentProps<boolean> {
}
declare function checkboxField(props: Omit<FieldProps<boolean | string, boolean, CheckboxFieldProps>, 'format' | 'component'>): FieldCreator<boolean, CheckboxFieldProps, {}, "raw">;

type SimplePasswordFieldOptions = {
    canShowPassword?: boolean;
    placeholder?: React__default.InputHTMLAttributes<HTMLInputElement>['placeholder'];
};
interface SimplePasswordFieldProps extends FieldComponentProps<string, SimplePasswordFieldOptions> {
}
declare const simplePasswordField: ({ canShowPassword, placeholder, ...props }: FieldDefinition<string> & SimplePasswordFieldOptions) => FieldCreator<string, SimplePasswordFieldProps, {}, "raw">;

interface PasswordRule {
    label: string;
    verify: (value: string) => boolean;
}

type ExtraValues = {
    strength?: PasswordStrengthScore;
};
type ExtraParams$1 = {
    blacklist?: string[];
    canShowPassword?: boolean;
    enabledRules: Record<RuleKeys, PasswordRule>;
    minStrength: PasswordStrengthScore;
};
interface PasswordFieldProps extends FieldComponentProps<string, ExtraParams$1, ExtraValues> {
}
type RuleKeys = Exclude<keyof PasswordPolicy, 'minStrength' | 'allowUpdateWithAccessTokenOnly'>;
declare const passwordField: ({ key, label, blacklist, canShowPassword, enabledRules, minStrength, required, validator, ...props }: Optional<FieldDefinition<string, string>, 'key' | 'label'> & Partial<ExtraParams$1>, { passwordPolicy }: Config) => FieldCreator<string, PasswordFieldProps, ExtraParams$1>;

type PhoneNumberOptions = {
    /**
     * If defaultCountry is specified then the phone number can be input both in "international" format and "national" format.
     * A phone number that's being input in "national" format will be parsed as a phone number belonging to the defaultCountry.
     */
    defaultCountry?: Country;
    /**
     * If country is specified then the phone number can only be input in "national" (not "international") format,
     * and will be parsed as a phonenumber belonging to the country.
     */
    country?: Country;
    /**
     * If locale is specified then translate component using the given language.
     * @see https://gitlab.com/catamphetamine/react-phone-number-input/tree/master/locale
     */
    locale?: string;
    /**
     * If `withCountryCallingCode` property is explicitly set to true then the "country calling code" part (e.g. "+1" when country is "US") is included in the input field (but still isn't editable).
     * @default true
     */
    withCountryCallingCode?: boolean;
    /**
     * If `withCountrySelect` property is `true` then the user can select the country for the phone number. Must be a supported {@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements country code}.
     * @default false
     */
    withCountrySelect?: boolean;
};
/**
 * If neither country nor defaultCountry are specified then the phone number can only be input in "international" format.
 */
interface PhoneNumberFieldProps extends FieldComponentProps<Value$2>, PhoneNumberOptions {
}
declare const phoneNumberField: ({ key, label, defaultCountry, country, locale, withCountryCallingCode, withCountrySelect, ...props }: Optional<FieldDefinition<string, Value$2>, 'key' | 'label'> & PhoneNumberOptions, config: Config) => FieldCreator<Value$2, PhoneNumberFieldProps>;

type SimpleFieldOptions = {
    placeholder?: React__default.InputHTMLAttributes<HTMLInputElement>['placeholder'];
    type?: React__default.HTMLInputTypeAttribute;
};
interface SimpleFieldProps extends FieldComponentProps<string, SimpleFieldOptions> {
}
declare const simpleField: ({ placeholder, type, ...props }: FieldDefinition<string | number, string> & SimpleFieldOptions) => FieldCreator<string, SimpleFieldProps, {}, "raw">;

declare function birthdateField({ min, max, label, ...props }: Parameters<typeof dateField>[0] & {
    min?: number;
    max?: number;
}, config: Config): FieldCreator<Date, DateFieldProps, {
    locale: string;
    yearDebounce?: number | undefined;
}, "raw">;

type FieldBuilder = typeof simpleField | typeof checkboxField | typeof selectField | typeof dateField | typeof birthdateField | typeof phoneNumberField | typeof passwordField | typeof simplePasswordField | typeof consentField;
type FieldConfig<T extends FieldBuilder> = Parameters<T>[0];
type PredefinedFieldConfig<T extends FieldBuilder> = Prettify<Omit<FieldConfig<T>, 'label'>>;
type PredefinedFieldOptions = {
    [K in keyof typeof predefinedFields]: Prettify<{
        key: K;
    } & Parameters<(typeof predefinedFields)[K]>[0]>;
}[keyof typeof predefinedFields];
type CustomFieldOptions = Prettify<{
    key: string;
} & FieldOptions>;
type ConsentFieldOptions = {
    key: string;
    errorArchivedConsents?: boolean;
};
type DataType<T extends CustomFieldType> = {
    dataType: T;
};
type FieldOptions = Prettify<DataType<'number'> & FieldConfig<typeof simpleField>> | Prettify<DataType<'integer'> & FieldConfig<typeof simpleField>> | Prettify<DataType<'decimal'> & FieldConfig<typeof simpleField>> | Prettify<DataType<'string'> & FieldConfig<typeof simpleField>> | Prettify<DataType<'date'> & FieldConfig<typeof dateField>> | Prettify<DataType<'checkbox'> & FieldConfig<typeof checkboxField>> | Prettify<DataType<'select'> & FieldConfig<typeof selectField>> | Prettify<DataType<'phone'> & FieldConfig<typeof phoneNumberField>> | Prettify<DataType<'email'> & FieldConfig<typeof simpleField>>;
type PredefinedFieldBuilder<T extends FieldBuilder> = (props: PredefinedFieldConfig<T>, config: Config) => ReturnType<T>;
declare const predefinedFields: {
    customIdentifier: PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
    givenName: PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
    familyName: PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
    email: PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
    phoneNumber: PredefinedFieldBuilder<({ key, label, defaultCountry, country, locale, withCountryCallingCode, withCountrySelect, ...props }: Pick<Partial<FieldDefinition<string, libphonenumber_js.E164Number>>, "label" | "key"> & Omit<FieldDefinition<string, libphonenumber_js.E164Number>, "label" | "key"> & PhoneNumberOptions, config: Config) => FieldCreator<libphonenumber_js.E164Number, PhoneNumberFieldProps, {}, "raw">>;
    password: PredefinedFieldBuilder<({ key, label, blacklist, canShowPassword, enabledRules, minStrength, required, validator, ...props }: Pick<Partial<FieldDefinition<string, string>>, "label" | "key"> & Omit<FieldDefinition<string, string>, "label" | "key"> & Partial<{
        blacklist?: string[] | undefined;
        canShowPassword?: boolean | undefined;
        enabledRules: Record<"minLength" | "uppercaseCharacters" | "specialCharacters" | "lowercaseCharacters" | "digitCharacters", PasswordRule>;
        minStrength: _reachfive_identity_core.PasswordStrengthScore;
    }>, { passwordPolicy }: Config) => FieldCreator<string, PasswordFieldProps, {
        blacklist?: string[] | undefined;
        canShowPassword?: boolean | undefined;
        enabledRules: Record<"minLength" | "uppercaseCharacters" | "specialCharacters" | "lowercaseCharacters" | "digitCharacters", PasswordRule>;
        minStrength: _reachfive_identity_core.PasswordStrengthScore;
    }, "raw">>;
    passwordConfirmation: PredefinedFieldBuilder<({ canShowPassword, placeholder, ...props }: FieldDefinition<string> & {
        canShowPassword?: boolean | undefined;
        placeholder?: string | undefined;
    }) => FieldCreator<string, SimplePasswordFieldProps, {}, "raw">>;
    gender: PredefinedFieldBuilder<typeof selectField>;
    birthdate: PredefinedFieldBuilder<typeof birthdateField>;
    'address.streetAddress': PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
    'address.locality': PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
    'address.region': PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
    'address.postalCode': PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
    'address.country': PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
    friendlyName: PredefinedFieldBuilder<({ placeholder, type, ...props }: FieldDefinition<string | number, string> & {
        placeholder?: string | undefined;
        type?: React.HTMLInputTypeAttribute | undefined;
    }) => FieldCreator<string, SimpleFieldProps, {}, "raw">>;
};
/**
 * @example { key: "email" }
 * @example { key: "family_name", defaultValue: "Moreau", required": true }
 * @example { key: "given_name", defaultValue: "Kylian", type: "hidden" }
 * @example { key: "customFields.date", path: "date", dataType: "date" }
 * @example { key: "consents.foo" }
 */
type Field = PredefinedFieldOptions | CustomFieldOptions | ConsentFieldOptions;

type LoginViewProps = {
    /**
     * @deprecated
     */
    acceptTos?: boolean;
    /**
     * Boolean that specifies whether an additional field for the custom identifier is shown.
     *
     * @default false
     */
    allowCustomIdentifier?: boolean;
    /**
     * Boolean that specifies if the forgot password option is enabled.
     *
     * If the `allowLogin` and `allowSignup` properties are set to `false`, the forgot password feature is enabled even if `allowForgotPassword` is set to `false`.
     *
     * @default true
     */
    allowForgotPassword?: boolean;
    /**
     * Boolean that specifies if the account recovery is enabled.
     *
     * @default false
     */
    allowAccountRecovery?: boolean;
    /**
     * Boolean that specifies whether signup is enabled.
     *
     * @default true
     */
    allowSignup?: boolean;
    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Whether or not to provide the display password in clear text option.
     *
     * @default false
     */
    canShowPassword?: boolean;
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * Whether the Remember me checkbox is displayed on the login view. Affects user session duration.
     *
     * The account session duration configured in the ReachFive Console (Settings  Security  SSO) applies when:
     * - The checkbox is hidden from the user
     * - The checkbox is visible and selected by the user
     *
     * If the checkbox is visible and not selected by the user, the default session duration of 1 day applies.
     *
     * @default false
     */
    showRememberMe?: boolean;
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[];
    /**
     * If `allowCustomIdentifier` property is `true` then the email and phoneNumber fields can be hidden by specifying the `allowAuthentMailPhone` property to `false`.
     * @default true
     */
    allowAuthentMailPhone?: boolean;
    /**
     * Boolean that specifies whether a device can be trusted during step up.
     *
     * @default false
     */
    allowTrustDevice?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
};

interface LoginWithWebAuthnViewProps {
    /**
     * @deprecated
     */
    acceptTos?: boolean;
    /**
     * Boolean that specifies whether signup is enabled.
     *
     * @default true
     */
    allowSignup?: boolean;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Boolean that specifies whether password authentication is enabled.
     */
    enablePasswordAuthentication?: boolean;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[];
    allowAccountRecovery?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

interface LoginWithPasswordViewProps {
    allowForgotPassword?: boolean;
    allowAccountRecovery?: boolean;
    auth?: AuthOptions;
    canShowPassword?: boolean;
    recaptcha_enabled?: boolean;
    recaptcha_site_key?: string;
    showLabels?: boolean;
    showRememberMe?: boolean;
    allowTrustDevice?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

interface PasswordSignupFormProps {
    auth?: AuthOptions;
    beforeSignup?: <T>(param: T) => T;
    canShowPassword?: boolean;
    phoneNumberOptions?: PhoneNumberOptions;
    recaptcha_enabled?: boolean;
    recaptcha_site_key?: string;
    redirectUrl?: string;
    returnToAfterEmailConfirmation?: string;
    showLabels?: boolean;
    signupFields?: (string | Field)[];
    userAgreement?: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

interface SignupWithPasswordViewProps extends PasswordSignupFormProps {
}

interface SignupWithWebAuthnViewProps {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**  */
    beforeSignup?: <T>(param: T) => T;
    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used as the post-email confirmation URL.
     * Important: This parameter should only be used with Hosted Pages.
     */
    returnToAfterEmailConfirmation?: string;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * List of the signup fields to display in the form.
     *
     * You can pass a field as an object to override default values :
     *
     * @example
     * {
     *   "key": "family_name",
     *   "defaultValue": "Moreau",
     *   "required": true
     * }
     */
    signupFields?: (string | Field)[];
    /**  */
    userAgreement?: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

/**
 * The widget’s initial screen.
 * @enum {('login' | 'login-with-web-authn' | 'signup' | 'forgot-password')}
 */
type InitialScreen = 'login' | 'login-with-web-authn' | 'signup' | 'signup-with-password' | 'signup-with-web-authn' | 'forgot-password';

interface SignupViewProps extends SignupWithPasswordViewProps, SignupWithWebAuthnViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean;
    initialScreen?: InitialScreen;
    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean;
    /**
     * Boolean that specifies whether biometric signup is enabled.
     *
     * @default false
     */
    allowWebAuthnSignup?: boolean;
    /**
     * Boolean that specifies whether password authentication is enabled.
     */
    enablePasswordAuthentication?: boolean;
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[];
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

interface ForgotPasswordViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean;
    /**
     * Boolean that specifies whether password reset with phone number is enabled.
     *
     * @default false
     */
    allowPhoneNumberResetPassword?: boolean;
    /**
     * Whether or not to display a safe error message on password reset, given an invalid email address.
     * This mode ensures not to leak email addresses registered to the platform.
     *
     * @default false
     */
    displaySafeErrorMessage?: boolean;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    initialScreen?: InitialScreen;
    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean;
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used to redirect users to a specific URL after a password reset.
     * Important: This parameter should only be used with Hosted Pages.
     */
    returnToAfterPasswordReset?: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

interface QuickLoginViewProps {
    initialScreen?: InitialScreen;
    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

interface ReauthViewProps {
    /**
     * Boolean that specifies if the forgot password option is enabled.
     *
     * If the `allowLogin` and `allowSignup` properties are set to `false`, the forgot password feature is enabled even if `allowForgotPassword` is set to `false`.
     *
     * @default true
     */
    allowForgotPassword?: boolean;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[];
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

type StartPasswordlessFormData = {
    authType: PasswordlessParams['authType'];
};
interface MainViewProps$6 {
    /**
     * **Not recommended**
     *
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     *
     * If empty, using an existing SSO session cookie.
     */
    accessToken?: string;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Show the introduction text.
     *
     * @default true
     */
    showIntro?: boolean;
    /**
     * Show the stepup button. Unnecessary for console use
     *
     * @default true
     */
    showStepUpStart?: boolean;
    /**
     * Boolean that specifies whether a device can be trusted during step up.
     *
     * @default false
     */
    allowTrustDevice?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
type FaSelectionViewState = MFA.StepUpResponse & {
    allowTrustDevice?: boolean;
};
type FaSelectionViewProps = Prettify<Partial<MFA.StepUpResponse> & {
    showIntro?: boolean;
    auth?: AuthOptions;
    allowTrustDevice?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}>;
type StepUpResponse = RequiredProperty<PasswordlessResponse, 'challengeId'>;
type StepUpHandlerResponse = StepUpResponse & StartPasswordlessFormData;
type VerificationCodeViewState = Prettify<StepUpHandlerResponse>;
type VerificationCodeViewProps$3 = Prettify<Partial<StepUpHandlerResponse> & {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Boolean that specifies whether a device can be trusted during step up.
     *
     * @default false
     */
    allowTrustDevice?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}>;
type MfaStepUpProps = MainViewProps$6 & FaSelectionViewProps & VerificationCodeViewProps$3;
type MfaStepUpWidgetProps = MfaStepUpProps;
declare const _default$e: (options: {
    accessToken?: string | undefined;
    auth?: AuthOptions | undefined;
    showIntro?: boolean | undefined;
    showStepUpStart?: boolean | undefined;
    allowTrustDevice?: boolean | undefined;
    onSuccess?: OnSuccess | undefined;
    onError?: OnError | undefined;
    amr?: string[] | undefined;
    token?: string | undefined;
    challengeId?: string | undefined;
    authType?: "email" | "sms" | "magic_link" | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface AuthWidgetProps extends LoginViewProps, LoginWithWebAuthnViewProps, LoginWithPasswordViewProps, SignupViewProps, SignupWithPasswordViewProps, SignupWithWebAuthnViewProps, ForgotPasswordViewProps, QuickLoginViewProps, ReauthViewProps, Omit<FaSelectionViewProps, keyof FaSelectionViewState>, Omit<VerificationCodeViewProps$3, keyof VerificationCodeViewState> {
    /**
     * Boolean that specifies whether quick login is enabled.
     *
     * @default true
     */
    allowQuickLogin?: boolean;
    /**
     * The widget’s initial screen if a value is provided, otherwise:
     * - if `quickLogin` is set to `true`, it defaults to `quick-login`.
     * - otherwise if the user is authenticated, it defaults to `reauth`.
     * - otherwise if `allowLogin` is set to `true` and `allowWebAuthnLogin` is not set to `true`, it defaults to `login`.
     * - otherwise if `allowLogin` is set to `true`, it defaults to `login-with-web-authn`.
     * - otherwise if `allowSignup` is set to `true`, it defaults to `signup`.
     * - otherwise, defaults to `forgot-password`.
     */
    initialScreen?: InitialScreen;
}
declare const _default$d: {
    ({ auth, ...props }: {
        allowQuickLogin?: boolean | undefined;
        initialScreen?: InitialScreen | undefined;
        acceptTos?: boolean | undefined;
        allowCustomIdentifier?: boolean | undefined;
        allowForgotPassword?: boolean | undefined;
        allowAccountRecovery?: boolean | undefined;
        allowSignup?: boolean | undefined;
        allowWebAuthnLogin?: boolean | undefined;
        auth?: _reachfive_identity_core.AuthOptions | undefined;
        canShowPassword?: boolean | undefined;
        recaptcha_enabled?: boolean | undefined;
        recaptcha_site_key?: string | undefined;
        showLabels?: boolean | undefined;
        showRememberMe?: boolean | undefined;
        socialProviders?: string[] | undefined;
        allowAuthentMailPhone?: boolean | undefined;
        allowTrustDevice?: boolean | undefined;
        onSuccess?: OnSuccess | undefined;
        onError?: OnError | undefined;
        enablePasswordAuthentication?: boolean | undefined;
        allowLogin?: boolean | undefined;
        allowWebAuthnSignup?: boolean | undefined;
        phoneNumberOptions?: PhoneNumberOptions | undefined;
        beforeSignup?: (<T>(param: T) => T) | undefined;
        redirectUrl?: string | undefined;
        returnToAfterEmailConfirmation?: string | undefined;
        signupFields?: (string | Field)[] | undefined;
        userAgreement?: string | undefined;
        allowPhoneNumberResetPassword?: boolean | undefined;
        displaySafeErrorMessage?: boolean | undefined;
        returnToAfterPasswordReset?: string | undefined;
        showIntro?: boolean | undefined;
        i18n?: I18nNestedMessages | undefined;
        theme?: {
            link?: {
                color?: string | undefined;
                decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
                hoverColor?: string | undefined;
                hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            } | undefined;
            input?: {
                color?: string | undefined;
                placeholderColor?: string | undefined;
                fontSize?: number | undefined;
                lineHeight?: number | undefined;
                paddingX?: number | undefined;
                paddingY?: number | undefined;
                borderRadius?: number | undefined;
                borderColor?: string | undefined;
                borderWidth?: number | undefined;
                background?: string | undefined;
                disabledBackground?: string | undefined;
                boxShadow?: string | undefined;
                focusBorderColor?: string | undefined;
                focusBoxShadow?: {} | undefined;
                height?: number | undefined;
            } | undefined;
            button?: {
                fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
                fontSize?: number | undefined;
                lineHeight?: number | undefined;
                paddingX?: number | undefined;
                paddingY?: number | undefined;
                borderColor?: string | undefined;
                borderRadius?: number | undefined;
                borderWidth?: number | undefined;
                focusBoxShadow?: {} | undefined;
                height?: number | undefined;
            } | undefined;
            socialButton?: {
                inline?: boolean | undefined;
                textVisible?: boolean | undefined;
                fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
                fontSize?: number | undefined;
                lineHeight?: number | undefined;
                paddingX?: number | undefined;
                paddingY?: number | undefined;
                borderColor?: string | undefined;
                borderRadius?: number | undefined;
                borderWidth?: number | undefined;
                focusBoxShadow?: {} | undefined;
                height?: number | undefined;
            } | undefined;
            passwordStrengthValidator?: {
                color0?: string | undefined;
                color1?: string | undefined;
                color2?: string | undefined;
                color3?: string | undefined;
                color4?: string | undefined;
            } | undefined;
            animateWidgetEntrance?: boolean | undefined;
            fontSize?: number | undefined;
            smallTextFontSize?: number | undefined;
            lineHeight?: number | undefined;
            headingColor?: string | undefined;
            textColor?: string | undefined;
            mutedTextColor?: string | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            backgroundColor?: string | undefined;
            primaryColor?: string | undefined;
            dangerColor?: string | undefined;
            warningColor?: string | undefined;
            successColor?: string | undefined;
            lightBackgroundColor?: string | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            spacing?: number | undefined;
            maxWidth?: number | undefined;
            _absoluteLineHeight?: number | undefined;
            _blockInnerHeight?: number | undefined;
            _blockHeight?: number | undefined;
        } | undefined;
    }): React.JSX.Element;
    displayName: string;
};

interface MainViewProps$5 {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     * @default false
     */
    showLabels?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
interface EmailEditorWidgetProps extends MainViewProps$5 {
}
declare const _default$c: (options: {
    accessToken: string;
    recaptcha_enabled?: boolean | undefined;
    recaptcha_site_key?: string | undefined;
    redirectUrl?: string | undefined;
    showLabels?: boolean | undefined;
    onSuccess?: OnSuccess | undefined;
    onError?: OnError | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface PasswordEditorFormProps {
    /**
     * Ask for the old password before entering a new one.
     * @default false
     */
    promptOldPassword?: boolean;
    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean;
}
interface PasswordEditorProps extends PasswordEditorFormProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken?: string;
    /**
     * @toto missing description
     */
    authentication?: Authentication;
    /**
     * @toto missing description
     */
    userId?: string;
    /**
     * Whether the form fields' labels are displayed on the form view.
     * @default false
     */
    showLabels?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
type Authentication = {
    accessToken: string;
} | {
    userId: string;
};
type PasswordEditorWidgetProps = Omit<PasswordEditorProps, 'authentication'>;
declare const _default$b: (options: {
    onError?: OnError | undefined;
    onSuccess?: OnSuccess | undefined;
    showLabels?: boolean | undefined;
    canShowPassword?: boolean | undefined;
    accessToken?: string | undefined;
    userId?: string | undefined;
    promptOldPassword?: boolean | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface MainViewProps$4 {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
    * Whether the form fields's labels are displayed on the login view.
    *
    * @default false
    */
    showLabels?: boolean;
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
type VerificationCodeViewProps$2 = {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
};
type PhoneNumberEditorWidgetProps = Prettify<MainViewProps$4 & VerificationCodeViewProps$2>;
declare const _default$a: (options: {
    accessToken: string;
    showLabels?: boolean | undefined;
    phoneNumberOptions?: PhoneNumberOptions | undefined;
    onError?: OnError | undefined;
    onSuccess?: OnSuccess | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface MainViewProps$3 {
    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Whether the form fields' labels are displayed on the form view.
     * @default false
     */
    showLabels?: boolean;
}
interface SuccessViewProps$1 {
    loginLink?: string;
}
interface PasswordResetWidgetProps extends MainViewProps$3, SuccessViewProps$1 {
}
declare const _default$9: (options: {
    canShowPassword?: boolean | undefined;
    onSuccess?: OnSuccess | undefined;
    onError?: OnError | undefined;
    showLabels?: boolean | undefined;
    loginLink?: string | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface MainViewProps$2 {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * The passwordless auth type (`magic_link` or `sms`).
     * @default "magic_link"
     */
    authType?: SingleFactorPasswordlessParams['authType'];
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * Show the introduction text.
     * @default true
     */
    showIntro?: boolean;
    /**
     * Show the social login buttons.
     * @default false
     */
    showSocialLogins?: boolean;
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip:  If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[];
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
interface VerificationCodeViewProps$1 {
    /**
     * The passwordless auth type (`magic_link` or `sms`).
     * @default "magic_link"
     */
    authType?: SingleFactorPasswordlessParams['authType'];
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
type PasswordlessWidgetProps = Prettify<MainViewProps$2 & VerificationCodeViewProps$1>;
declare const _default$8: (options: {
    auth?: AuthOptions | undefined;
    authType?: "sms" | "magic_link" | undefined;
    recaptcha_enabled?: boolean | undefined;
    recaptcha_site_key?: string | undefined;
    showIntro?: boolean | undefined;
    showSocialLogins?: boolean | undefined;
    socialProviders?: string[] | undefined;
    phoneNumberOptions?: PhoneNumberOptions | undefined;
    onSuccess?: OnSuccess | undefined;
    onError?: OnError | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

type ProfileWithConsents = Profile & {
    consents?: Record<string, UserConsent>;
};
interface ProfileEditorProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     *
     */
    profile: ProfileWithConsents;
    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     *
     */
    resolvedFields: FieldCreator<any, any, any, any>[];
    /**
     * Whether the form fields' labels are displayed on the form view.
     * @default false
     */
    showLabels?: boolean;
}
interface ProfileEditorWidgetProps extends Omit<ProfileEditorProps, 'profile' | 'resolvedFields'> {
    /**
     * List of the fields to display in the form.
     *
     * **Important:**
     *
     * The following fields can not be changed with this widget:
     * - `password`
     * - `password_confirmation`
     *
     * It is not possible to update the primary identifier submitted at registration (email or phone number). When the primary identifier is the email address (SMS feature disabled), users can only enter a phone number and update without limit.
     */
    fields?: (string | Field)[];
}
declare const _default$7: (options: {
    fields?: (string | Field)[] | undefined;
    onError?: OnError | undefined;
    onSuccess?: OnSuccess | undefined;
    showLabels?: boolean | undefined;
    accessToken: string;
    phoneNumberOptions?: PhoneNumberOptions | undefined;
    redirectUrl?: string | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface SocialAccountsWidgetProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip: If you pass an empty array, social providers will not be displayed.
     * */
    providers?: string[];
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
declare const _default$6: (options: {
    accessToken: string;
    auth?: AuthOptions | undefined;
    providers?: string[] | undefined;
    onSuccess?: OnSuccess | undefined;
    onError?: OnError | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface SocialButtonsProps {
    /**
     * @deprecated
     */
    acceptTos?: boolean;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip: If you pass an empty array, social providers will not be displayed.
     * */
    providers: string[];
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

interface SocialLoginWidgetProps extends Omit<SocialButtonsProps, 'providers'> {
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip: If you pass an empty array, social providers will not be displayed.
     * */
    socialProviders?: SocialButtonsProps['providers'];
}
declare const _default$5: (options: {
    socialProviders?: string[] | undefined;
    onError?: OnError | undefined;
    auth?: _reachfive_identity_core.AuthOptions | undefined;
    onSuccess?: OnSuccess | undefined;
    acceptTos?: boolean | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React.JSX.Element;

interface WebAuthnDevicesProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Registred FIDO2 devices
     */
    devices: DeviceCredential[];
    /**
     * Whether the form fields's labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
type WebAuthnWidgetProps = Omit<WebAuthnDevicesProps, 'devices'>;
declare const _default$4: (options: {
    onError?: OnError | undefined;
    onSuccess?: OnSuccess | undefined;
    showLabels?: boolean | undefined;
    accessToken: string;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface MainViewProps$1 {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * The user’s MFA credentials
     */
    credentials: MFA.CredentialsResponse['credentials'];
    /**
     * Boolean to enable (`true`) or disable (`false`) whether the option to remove MFA credentials are displayed.
     *
     * @default false
     */
    requireMfaRegistration?: boolean;
    /**
     * Show the introduction text.
     *
     * @default true
     */
    showIntro?: boolean;
    /**
     * Boolean to enable (true) or disable (false) whether the option to remove MFA credentials are displayed.
     *
     * @default true
     */
    showRemoveMfaCredentials?: boolean;
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
interface VerificationCodeViewProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Show the introduction text.
     */
    showIntro?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
interface CredentialRegisteredViewProps {
}
type CredentialRemovedViewProps = {};
type MfaCredentialsProps = Prettify<MainViewProps$1 & CredentialRegisteredViewProps & VerificationCodeViewProps & CredentialRemovedViewProps>;
type MfaCredentialsWidgetProps = Prettify<Omit<MfaCredentialsProps, 'credentials'>>;
declare const _default$3: (options: {
    onError?: OnError | undefined;
    onSuccess?: OnSuccess | undefined;
    accessToken: string;
    showIntro?: boolean | undefined;
    phoneNumberOptions?: PhoneNumberOptions | undefined;
    requireMfaRegistration?: boolean | undefined;
    showRemoveMfaCredentials?: boolean | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

type MfaListWidgetProps = {
    /**
    * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
    */
    accessToken: string;
    /**
     * Callback function called when the request has succeeded.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Indicates whether delete mfa credential button is displayed
     */
    showRemoveMfaCredential?: boolean;
};
declare const _default$2: (options: {
    accessToken: string;
    onSuccess?: OnSuccess | undefined;
    onError?: OnError | undefined;
    showRemoveMfaCredential?: boolean | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface MainViewProps {
    /**
     * Allow an end-user to create a password instead of a Passkey
     * @default true
     */
    allowCreatePassword?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Whether the form fields' labels are displayed on the form view.
     * @default false
     */
    showLabels?: boolean;
}
interface SuccessViewProps {
    loginLink?: string;
}
interface AccountRecoveryWidgetProps extends MainViewProps, SuccessViewProps {
}
declare const _default$1: (options: {
    allowCreatePassword?: boolean | undefined;
    onSuccess?: OnSuccess | undefined;
    onError?: OnError | undefined;
    showLabels?: boolean | undefined;
    loginLink?: string | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

type TrustedDeviceWidgetProps = {
    accessToken: string;
    showRemoveTrustedDevice?: boolean;
    onError?: OnError;
    onSuccess?: OnSuccess;
};
declare const _default: (options: {
    accessToken: string;
    showRemoveTrustedDevice?: boolean | undefined;
    onError?: OnError | undefined;
    onSuccess?: OnSuccess | undefined;
    i18n?: I18nNestedMessages | undefined;
    theme?: {
        link?: {
            color?: string | undefined;
            decoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
            hoverColor?: string | undefined;
            hoverDecoration?: NonNullable<csstype.Property.TextDecoration<string | number> | undefined> | undefined;
        } | undefined;
        input?: {
            color?: string | undefined;
            placeholderColor?: string | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderRadius?: number | undefined;
            borderColor?: string | undefined;
            borderWidth?: number | undefined;
            background?: string | undefined;
            disabledBackground?: string | undefined;
            boxShadow?: string | undefined;
            focusBorderColor?: string | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        button?: {
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        socialButton?: {
            inline?: boolean | undefined;
            textVisible?: boolean | undefined;
            fontWeight?: NonNullable<csstype.Property.FontWeight | undefined> | undefined;
            fontSize?: number | undefined;
            lineHeight?: number | undefined;
            paddingX?: number | undefined;
            paddingY?: number | undefined;
            borderColor?: string | undefined;
            borderRadius?: number | undefined;
            borderWidth?: number | undefined;
            focusBoxShadow?: {} | undefined;
            height?: number | undefined;
        } | undefined;
        passwordStrengthValidator?: {
            color0?: string | undefined;
            color1?: string | undefined;
            color2?: string | undefined;
            color3?: string | undefined;
            color4?: string | undefined;
        } | undefined;
        animateWidgetEntrance?: boolean | undefined;
        fontSize?: number | undefined;
        smallTextFontSize?: number | undefined;
        lineHeight?: number | undefined;
        headingColor?: string | undefined;
        textColor?: string | undefined;
        mutedTextColor?: string | undefined;
        borderRadius?: number | undefined;
        borderColor?: string | undefined;
        borderWidth?: number | undefined;
        backgroundColor?: string | undefined;
        primaryColor?: string | undefined;
        dangerColor?: string | undefined;
        warningColor?: string | undefined;
        successColor?: string | undefined;
        lightBackgroundColor?: string | undefined;
        paddingX?: number | undefined;
        paddingY?: number | undefined;
        spacing?: number | undefined;
        maxWidth?: number | undefined;
        _absoluteLineHeight?: number | undefined;
        _blockInnerHeight?: number | undefined;
        _blockHeight?: number | undefined;
    } | undefined;
}) => React__default.JSX.Element;

interface WidgetInstance {
    destroy(): void;
}
interface WidgetProps {
    /** The DOM element or the `id` of a DOM element in which the widget should be embedded. */
    container: string | HTMLElement;
    /**
    * The [ISO country](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code useful to format phone numbers.
    * Defaults to the predefined country code in your account settings or `FR`.
    */
    countryCode?: string;
    /** A fallback react tree to show when a Suspense child (like React.lazy) suspends */
    fallback?: ReactNode;
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onReady?: (instance: WidgetInstance) => void;
}
type WidgetOptions<P> = Prettify<P & WidgetProps & I18nProps$1 & ThemeProps>;
declare class UiClient {
    config: Config$1;
    core: Client$1;
    constructor(config: Config$1, coreClient: Client$1);
    showAuth(options: WidgetOptions<AuthWidgetProps>): void;
    showAccountRecovery(options: WidgetOptions<AccountRecoveryWidgetProps>): void;
    showSocialLogin(options: WidgetOptions<SocialLoginWidgetProps>): void;
    showPasswordless(options: WidgetOptions<PasswordlessWidgetProps>): void;
    showEmailEditor(options: WidgetOptions<EmailEditorWidgetProps>): void;
    showPasswordEditor(options: WidgetOptions<PasswordEditorWidgetProps>): void;
    showPhoneNumberEditor(options: WidgetOptions<PhoneNumberEditorWidgetProps>): void;
    showProfileEditor(options: WidgetOptions<ProfileEditorWidgetProps>): void;
    showPasswordReset(options: WidgetOptions<PasswordResetWidgetProps>): void;
    showSocialAccounts(options: WidgetOptions<SocialAccountsWidgetProps>): void;
    showWebAuthnDevices(options: WidgetOptions<WebAuthnWidgetProps>): void;
    showMfa(options: WidgetOptions<MfaCredentialsWidgetProps>): void;
    showStepUp(options: WidgetOptions<MfaStepUpWidgetProps>): void;
    showMfaCredentials(options: WidgetOptions<MfaListWidgetProps>): void;
    showTrustedDevices(options: WidgetOptions<TrustedDeviceWidgetProps>): void;
    _showWidget<P extends WidgetProps>(Widget: ComponentType<Omit<P, keyof WidgetProps>>, options?: P, props?: {}): Promise<void>;
    adaptError(error: unknown): string;
    handleError(error: unknown): void;
}

type Client = {
    core: Client$1;
    showAuth: InstanceType<typeof UiClient>['showAuth'];
    showAccountRecovery: InstanceType<typeof UiClient>['showAccountRecovery'];
    showEmailEditor: InstanceType<typeof UiClient>['showEmailEditor'];
    showPasswordEditor: InstanceType<typeof UiClient>['showPasswordEditor'];
    showPhoneNumberEditor: InstanceType<typeof UiClient>['showPhoneNumberEditor'];
    showPasswordReset: InstanceType<typeof UiClient>['showPasswordReset'];
    showPasswordless: InstanceType<typeof UiClient>['showPasswordless'];
    showProfileEditor: InstanceType<typeof UiClient>['showProfileEditor'];
    showSocialAccounts: InstanceType<typeof UiClient>['showSocialAccounts'];
    showSocialLogin: InstanceType<typeof UiClient>['showSocialLogin'];
    showWebAuthnDevices: InstanceType<typeof UiClient>['showWebAuthnDevices'];
    showMfa: InstanceType<typeof UiClient>['showMfa'];
    showMfaCredentials: InstanceType<typeof UiClient>['showMfaCredentials'];
    showStepUp: InstanceType<typeof UiClient>['showStepUp'];
    showTrustedDevices: InstanceType<typeof UiClient>['showTrustedDevices'];
};
declare function createClient(config: Config$1): Client;

export { _default$1 as AccountRecovery, _default$d as Auth, type Client, _default$c as EmailEditor, _default$3 as MfaCredentials, _default$2 as MfaList, _default$e as MfaStepUp, _default$b as PasswordEditor, _default$9 as PasswordReset, _default$8 as Passwordless, _default$a as PhoneNumberEditor, _default$7 as ProfileEditor, ReachfiveProvider, type ReachfiveProviderProps, _default$6 as SocialAccounts, _default$5 as SocialLogin, type ThemeOptions, _default as TrustedDevices, _default$4 as WebAuthn, createClient, useReachfive };
