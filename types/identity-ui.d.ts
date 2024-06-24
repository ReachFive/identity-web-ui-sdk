/**
 * @reachfive/identity-ui - v1.27.0
 * Compiled Mon, 24 Jun 2024 15:09:57 UTC
 *
 * Copyright (c) ReachFive.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
import { CSSProperties } from 'styled-components';
import { Config as Config$1, RemoteSettings, ConsentVersions, CustomField, Client as Client$1, SessionInfo, AuthOptions, MFA, PasswordlessResponse, SingleFactorPasswordlessParams, Profile, UserConsent, DeviceCredential } from '@reachfive/identity-core';
export { Config } from '@reachfive/identity-core';
import React$1 from 'react';
import { PasswordlessParams } from '@reachfive/identity-core/es/main/oAuthClient';

type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>
} & {}

type RequiredProperty<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
}

type ConsentsVersions = { consentsVersions: Record<string, ConsentVersions> }

type CustomFields = { customFields?: CustomField[] }

type Config = Config$1 & RemoteSettings & ConsentsVersions & CustomFields

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

type I18nMessages = {
    [k: string]: string;
};
type I18nMessageParams = Record<string, unknown>;
type I18nResolver$1 = (key: string, params?: I18nMessageParams) => string;

type I18nProps$1 = {
    i18n?: I18nMessages;
};
type ThemeProps = {
    theme?: ThemeOptions;
};
type Context = {
    config: Config;
    apiClient: Client$1;
    defaultI18n: I18nMessages;
    session?: SessionInfo;
};

interface I18nProps {
    i18n: I18nResolver$1;
}
type WithI18n<P> = P & I18nProps;

type VaildatorError = {
    error: string;
};
type ValidatorSuccess = {
    success?: true;
};
type VaildatorResult = boolean | VaildatorError | ValidatorSuccess;

type FormValue<T> = T | RichFormValue<T>;
type RichFormValue<T, K extends string = 'raw'> = {
    [P in K]: T;
};

interface FieldCreateProps {
    showLabel: boolean
}

interface FieldCreator<T, P = {}, E = {}> {
    path: string,
    create: (options: WithI18n<FieldCreateProps>) => Field$1<T, P, E>
}

interface Field$1<T, P = {}, E = {}> {
    key: string
    render: (props: P & Partial<FieldComponentProps<T>> & { state: FieldValue<T, E> }) => React.ReactNode
    initialize: <M>(model: M) => FieldValue<T, E>
    unbind: <M>(model: M, state: FieldValue<T, E>) => M
    validate: <S extends { isSubmitted: boolean }>(data: FieldValue<T, E>, ctx: S) => VaildatorResult
}

type FieldValue<T, E = {}> = E & {
    value?: T
    isDirty?: boolean
    validation?: VaildatorResult
}

type FieldComponentProps<T, P = {}, E = {}> = P & {
    inputId: string
    key: string
    path: string
    label: string
    onChange: (value: FieldValue<T, E>) => void
    placeholder?: string
    autoComplete?: AutoFill
    required?: boolean
    readOnly?: boolean
    i18n: I18nResolver
    showLabel?: boolean
    value?: FormValue<T>
    validation?: VaildatorResult
}

/** The field's representation. */
type Field = {
   key: string
   label?: string
   required?: boolean
   type?: 'hidden' | 'text' | 'number' | 'email' | 'tel'
}

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
}

interface PasswordSignupFormProps {
    auth?: AuthOptions;
    beforeSignup?: <T>(param: T) => T;
    canShowPassword?: boolean;
    recaptcha_enabled?: boolean;
    recaptcha_site_key?: string;
    redirectUrl?: string;
    returnToAfterEmailConfirmation?: string;
    showLabels?: boolean;
    signupFields?: (string | Field)[];
    userAgreement?: string;
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
}

/**
 * The widget’s initial screen.
 * @enum {('login' | 'login-with-web-authn' | 'signup' | 'forgot-password')}
 */
type InitialScreen = 'login' | 'login-with-web-authn' | 'signup' | 'forgot-password';

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
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: string[];
}

interface ForgotPasswordViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean;
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
}
interface ForgotPasswordSuccessViewProps {
    allowLogin?: boolean;
    initialScreen?: InitialScreen;
    allowWebAuthnLogin?: boolean;
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
}

interface StartPasswordlessFormData {
    authType: PasswordlessParams['authType'];
}
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
}
type FaSelectionViewState = MFA.StepUpResponse;
type FaSelectionViewProps = Prettify<Partial<MFA.StepUpResponse> & {
    showIntro?: boolean;
    auth?: AuthOptions;
}>;
type StepUpResponse = RequiredProperty<PasswordlessResponse, 'challengeId'>;
type StepUpHandlerResponse = StepUpResponse & StartPasswordlessFormData;
type VerificationCodeViewState = Prettify<StepUpHandlerResponse>;
type VerificationCodeViewProps$3 = Prettify<Partial<StepUpHandlerResponse> & {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
}>;
type MfaStepUpProps = MainViewProps$6 & FaSelectionViewProps & VerificationCodeViewProps$3;
type MfaStepUpWidgetProps = MfaStepUpProps;

interface AuthWidgetProps extends LoginViewProps, LoginWithWebAuthnViewProps, LoginWithPasswordViewProps, SignupViewProps, SignupWithPasswordViewProps, SignupWithWebAuthnViewProps, ForgotPasswordViewProps, ForgotPasswordSuccessViewProps, QuickLoginViewProps, ReauthViewProps, Omit<FaSelectionViewProps, keyof FaSelectionViewState>, Omit<VerificationCodeViewProps$3, keyof VerificationCodeViewState> {
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
}
interface EmailEditorWidgetProps extends MainViewProps$5 {
}

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
     * Callback function called when the request has failed.
     */
    onSuccess?: () => void;
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onError?: () => void;
}
type Authentication = {
    accessToken: string;
} | {
    userId: string;
};
type PasswordEditorWidgetProps = Omit<PasswordEditorProps, 'authentication'>;

type PhoneNumberOptions = {
    /**
     * If `withCountrySelect` property is `true` then the user can select the country for the phone number. Must be a supported {@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements country code}.
     * @default false
     */
    withCountrySelect?: boolean;
};

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
}
type VerificationCodeViewProps$2 = {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Callback function called when the request has failed.
     */
    onSuccess?: () => void;
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onError?: () => void;
};
type PhoneNumberEditorWidgetProps = Prettify<MainViewProps$4 & VerificationCodeViewProps$2>;

interface MainViewProps$3 {
    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean;
    /**
     * Callback function called when the request has failed.
     */
    onSuccess?: () => void;
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onError?: () => void;
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
}
type PasswordlessWidgetProps = Prettify<MainViewProps$2 & VerificationCodeViewProps$1>;

type ProfileWithConsents = Profile & {
    consents?: Record<string, UserConsent>;
};
interface ProfileEditorProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Callback function called when the request has failed.
     */
    onSuccess?: () => void;
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onError?: () => void;
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
    resolvedFields: FieldCreator<unknown>[];
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
}

interface SocialLoginWidgetProps {
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
    socialProviders?: string[];
}

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
}
type WebAuthnWidgetProps = Omit<WebAuthnDevicesProps, 'devices'>;

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
}
interface CredentialRegisteredViewProps {
}
type CredentialRemovedViewProps = {};
type MfaCredentialsProps = Prettify<MainViewProps$1 & CredentialRegisteredViewProps & VerificationCodeViewProps & CredentialRemovedViewProps>;
type MfaCredentialsWidgetProps = Prettify<Omit<MfaCredentialsProps, 'credentials'>>;

type MfaListWidgetProps = {
    /**
    * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
    */
    accessToken: string;
};

interface MainViewProps {
    /**
     * Allow an end-user to create a password instead of a Passkey
     * @default true
     */
    allowCreatePassword?: boolean;
    /**
     * Callback function called when the request has failed.
     */
    onSuccess?: () => void;
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onError?: () => void;
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
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onReady?: (instance: WidgetInstance) => void;
}
type WidgetOptions<P> = Prettify<P & WidgetProps & I18nProps$1 & ThemeProps>;
type Widget<P> = (props: P, ctx: Context) => Promise<React$1.JSX.Element>;
declare class UiClient {
    config: Config;
    core: Client$1;
    defaultI18n: I18nMessages;
    constructor(config: Config, coreClient: Client$1, defaultI18n: I18nMessages);
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
    _showWidget<P extends WidgetProps>(widget: Widget<Omit<P, keyof WidgetProps>>, options?: P, props?: {}): Promise<void>;
    _ssoCheck<P extends WidgetProps>(widget: Widget<Omit<P, keyof WidgetProps>>, options: P & {
        auth?: AuthOptions;
    }): void;
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
};
declare function createClient(creationConfig: Config$1): Client;

export { type Client, type ThemeOptions, createClient };
