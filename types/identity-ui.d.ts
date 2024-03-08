/**
 * @reachfive/identity-ui - v1.25.2
 * Compiled Fri, 08 Mar 2024 01:43:42 UTC
 *
 * Copyright (c) ReachFive.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
import { Config as Config$1, RemoteSettings, ConsentVersions, CustomField, Client as Client$1, SessionInfo, AuthOptions, MFA, PasswordlessResponse, SingleFactorPasswordlessParams, Profile, UserConsent, DeviceCredential } from '@reachfive/identity-core';
export { Config } from '@reachfive/identity-core';
import CSS from 'csstype';
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

declare const inputBtnFocusBoxShadow: (borderColor?: string) => string | undefined;

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
    headingColor: CSS.Color
    /**
     * @default "#495057"
     */
    textColor: CSS.Color
    /**
     * @default "#adb5bd"
     */
    mutedTextColor: CSS.Color
     /**
     * @default "3"
     */
    borderRadius: number
    /**
     * @default "#ced4da "
     */
    borderColor: CSS.Color
    /**
     * @default 1
     */
    borderWidth: number
    /**
     * @default "#ffffff"
     */
    backgroundColor: CSS.Color
    /**
     * The button and link default color.
     * @default "#229955"
     */
    primaryColor: CSS.Color
    /**
     * @default "#dc4e41"
     */
    dangerColor: CSS.Color
    /**
     * @default "#ffc107"
     */
    warningColor: CSS.Color
    /**
     * @default "#229955"
     */
    successColor: CSS.Color
    /**
     * @default "#e9ecef"
     */
    lightBackgroundColor: CSS.Color
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
    color: CSS.Color
    decoration: CSS.TextDecorationLineProperty
    hoverColor: CSS.Color
    hoverDecoration: CSS.TextDecorationLineProperty
}

interface InputTheme {
    color: CSS.Color
    placeholderColor: CSS.Color
    fontSize: number
    lineHeight: number
    paddingX: number
    paddingY: number
    borderRadius: number
    borderColor: CSS.Color
    borderWidth: number
    background: CSS.Color
    disabledBackground: CSS.Color
    boxShadow: string
    focusBorderColor: CSS.Color
    focusBoxShadow: typeof inputBtnFocusBoxShadow
    height: number
}

interface ButtonTheme {
    /** Specifies the font-weight (such as normal, bold, or 900).
     * @default 'bold'
     */
    fontWeight: CSS.FontWeightProperty
    /** Specifies the font-size. */
    fontSize: number
     /** Specifies the line-height. */
    lineHeight: number
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number
    /** Specifies the border-radius. */
    borderRadius: number
    /** Specifies the border-width. */
    borderWidth: number
    /** Function that specifies the box shadow based on the border color. */
    focusBoxShadow: typeof inputBtnFocusBoxShadow
    /** Specifies the height. */
    height: number
}

interface SocialButtonTheme {
    /** Boolean that specifies if the buttons are inline (horizonally-aligned). */
    inline: boolean
     /** Boolean that specifies if the text is visible. */
    textVisible: boolean
    /** Specifies the font-weight (such as normal, bold, or 900). */
    fontWeight: CSS.FontWeightProperty
    /** Specifies the font-size. */
    fontSize: number
     /** Specifies the line-height. */
    lineHeight: number
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number
    /** Specifies the border-radius. */
    borderRadius: number
    /** Specifies the border-width. */
    borderWidth: number
    /** Function that specifies the box shadow based on the border color. */
    focusBoxShadow: typeof inputBtnFocusBoxShadow
    /** Specifies the height. */
    height: number
}

interface PasswordStrengthTheme {
    color0: CSS.Color
    color1: CSS.Color
    color2: CSS.Color
    color3: CSS.Color
    color4: CSS.Color
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

interface FieldCreator<T, P extends FieldComponentProps<T> = FieldComponentProps<T>, S = {}> {
    path: string,
    create: (options: WithI18n<FieldCreateProps>) => Field$1<T, P, S>
}

interface Field$1<T, P extends FieldComponentProps<T>, S = {}> {
    key: string
    render: (props: P & { state: S }) => React.ReactNode
    initialize: (model: Record<string, unknown>) => FieldValue<T>
    unbind: <M extends Record<string, unknown>>(model: M, state: P) => M
    validate: (data: P, ctx: { isSubmitted: boolean }) => VaildatorResult
}

type FieldValue<T> = {
    value: T | null,
    isDirty: boolean
}

type FieldComponentProps<T, P = {}> = P & {
    inputId: string
    key: string
    path: string
    label: string
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
}

interface LoginWithPasswordViewProps {
    allowForgotPassword?: boolean;
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

interface SignupViewProps extends SignupWithPasswordViewProps, SignupWithWebAuthnViewProps {
    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean;
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
    allowWebAuthnLogin?: boolean;
}

interface QuickLoginViewProps {
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
interface MainViewProps$5 {
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
type MfaStepUpProps = MainViewProps$5 & FaSelectionViewProps & VerificationCodeViewProps$3;
type MfaStepUpWidgetProps = MfaStepUpProps;

interface AuthWidgetProps extends LoginViewProps, LoginWithWebAuthnViewProps, LoginWithPasswordViewProps, SignupViewProps, SignupWithPasswordViewProps, SignupWithWebAuthnViewProps, ForgotPasswordViewProps, ForgotPasswordSuccessViewProps, QuickLoginViewProps, ReauthViewProps, Omit<FaSelectionViewProps, keyof FaSelectionViewState>, Omit<VerificationCodeViewProps$3, keyof VerificationCodeViewState> {
    /**
     * Boolean that specifies whether quick login is enabled.
     *
     * @default true
     */
    allowQuickLogin?: boolean;
    /**
     * The widget’s initial screen.
     *
     * - if `allowLogin` is set to `true`, it defaults to `login`.
     * - if `allowLogin` is set to `false` and `allowSignup` is set to `true`, it defaults to `signup`.
     * - if `allowLogin` is set to `false` and `allowWebAuthnLogin` is set to `true`, it defaults to `login-with-web-authn`.
     * - otherwise, defaults to `forgot-password`.
     */
    initialScreen?: 'login' | 'login-with-web-authn' | 'signup' | 'forgot-password';
}

interface MainViewProps$4 {
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
interface EmailEditorWidgetProps extends MainViewProps$4 {
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

interface MainViewProps$3 {
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
type PhoneNumberEditorWidgetProps = Prettify<MainViewProps$3 & VerificationCodeViewProps$2>;

interface MainViewProps$2 {
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
interface SuccessViewProps {
    loginLink?: string;
}
interface PasswordResetWidgetProps extends MainViewProps$2, SuccessViewProps {
}

interface MainViewProps$1 {
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
type PasswordlessWidgetProps = Prettify<MainViewProps$1 & VerificationCodeViewProps$1>;

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

interface MainViewProps {
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
type MfaCredentialsProps = Prettify<MainViewProps & CredentialRegisteredViewProps & VerificationCodeViewProps & CredentialRemovedViewProps>;
type MfaCredentialsWidgetProps = Prettify<Omit<MfaCredentialsProps, 'credentials'>>;

type MfaListWidgetProps = {
    /**
    * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
    */
    accessToken: string;
};

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
    adaptError(error: unknown): string | boolean;
    handleError(error: unknown): void;
}

type Client = {
    core: Client$1;
    showAuth: InstanceType<typeof UiClient>['showAuth'];
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
