/**
<<<<<<< HEAD
 * @reachfive/identity-ui - v1.42.0
 * Compiled Mon, 23 Mar 2026 10:47:50 UTC
||||||| dda98c5
 * @reachfive/identity-ui - v1.40.1
 * Compiled Thu, 12 Feb 2026 15:18:04 UTC
=======
 * @reachfive/identity-ui - v1.41.0
 * Compiled Fri, 27 Feb 2026 09:09:07 UTC
>>>>>>> master
 *
 * Copyright (c) ReachFive.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
import { AuthResult, SingleFactorPasswordlessParams, StepUpPasswordlessParams, MFA, TrustedDevice, Config as Config$1, RemoteSettings, ConsentVersions, CustomField, Client as Client$1, SessionInfo, AuthOptions, PasswordlessResponse, Profile, UserConsent, DeviceCredential } from '@reachfive/identity-core';
export { Config } from '@reachfive/identity-core';
import React, { CSSProperties, ComponentProps } from 'react';
import { ResourceKey, TFunction } from 'i18next';
import { StepUpPasswordlessParams as StepUpPasswordlessParams$1 } from '@reachfive/identity-core/es/main/oAuthClient';
import { WidgetDisplayMode } from '@captchafox/types';
import { FieldValues, UseFormWatch } from 'react-hook-form';
import { CountryCode } from 'libphonenumber-js';
import z from 'zod';

type I18nMessages = Record<string, ResourceKey>;

type IdentifierType = 'email' | 'phone_number' | 'custom_identifier'

type AuthType = SingleFactorPasswordlessParams['authType'] | 'password' | 'webauthn' | 'social'

interface AbstractEvent {
    readonly name: string
}

/** Emitted after a successful signup. */
interface SignupEvent extends AbstractEvent {
    readonly name: 'signup'
    readonly authResult: AuthResult
    readonly isIdentifierVerificationRequired: boolean
}

/** Emitted after a successful authentication. */
interface LoginEvent extends AbstractEvent {
    readonly name: 'login'
    readonly authResult: AuthResult
    readonly identifierType?: IdentifierType
    readonly authType: AuthType
}

interface SocialLoginEvent extends AbstractEvent {
    readonly name: 'social_login'
    readonly provider: string
}

/** Emitted after a successful email update. */
interface EmailUpdatedEvent extends AbstractEvent {
    readonly name: 'email_updated'
}

/** Emitted after a successful phone number update. */
interface PhoneNumberUpdatedEvent extends AbstractEvent {
    readonly name: 'phone_number_updated'
}

/** Emitted after a successful user update. */
interface UserUpdatedEvent extends AbstractEvent {
    readonly name: 'user_updated'
}

/** Emitted after a successful password change. */
interface PasswordChangedEvent extends AbstractEvent {
    readonly name: 'password_changed'
}

/** Emitted after a successful password reset request. */
interface PasswordResetRequestedEvent extends AbstractEvent {
    readonly name: 'password_reset_requested'
}

/** Emitted after a successful password reset process. */
interface PasswordResetEvent extends AbstractEvent {
    readonly name: 'password_reset'
}

interface AccountRecoveryEvent extends AbstractEvent {
    readonly name: 'account_recovery'
}

/** Emitted after a one-time password (otp) is successfully sent (via sms or email) for verification. */
interface OtpSentEvent extends AbstractEvent {
    readonly name: 'otp_sent'
    readonly authType: SingleFactorPasswordlessParams['authType']
}

/** Emitted after the user has successfully logged in using the Two-factor authentication (2FA) flow. */
interface Login2ndStepEvent extends AbstractEvent {
    readonly name: 'login_2nd_step'
    readonly authType: StepUpPasswordlessParams['authType']
    readonly authResult: AuthResult
}

/** Emitted after an email is used to start the MFA registration process. */
interface MfaEmailStartRegistration extends AbstractEvent {
    readonly name: 'mfa_email_start_registration'
}

/** Emitted after an email has been verified as an MFA credential. */
interface MfaEmailVerifyRegistration extends AbstractEvent {
    readonly name: 'mfa_email_verify_registration'
}

/** Emitted after a phone number is used to start the MFA registration process. */
interface MfaPhoneNumberStartRegistration extends AbstractEvent {
    readonly name: 'mfa_phone_number_start_registration'
}

/** Emitted after a phone number has been verified as an MFA credential. */
interface MfaPhoneNumberVerifyRegistration extends AbstractEvent {
    readonly name: 'mfa_phone_number_verify_registration'
}

/** Emitted after a list of MFA credentials was successfully listed. */
interface MfaCredentialsListedEvent extends AbstractEvent {
    readonly name: 'mfa_credentials_listed'
    readonly credentials: MFA.Credential[]
}

/** Emitted after an MFA credential (phone number) is deleted. */
interface MfaPhoneNumberDeletedEvent extends AbstractEvent {
    readonly name: 'mfa_phone_number_deleted'
}

/** Emitted after an MFA credential (email) is deleted. */
interface MfaEmailDeletedEvent extends AbstractEvent {
    readonly name: 'mfa_email_deleted'
}

/** Emitted after a successful mobile number verification. */
interface PhoneNumberVerifiedEvent extends AbstractEvent {
    readonly name: 'phone_number_verified'
    readonly phoneNumber: string
}

/** Emitted after a passkey was successfully reset. */
interface WebauthnResetEvent extends AbstractEvent {
    readonly name: 'webauthn_reset'
}

/** Emitted after a passkey was successfully created. */
interface WebauthnCredentialCreatedEvent extends AbstractEvent {
    readonly name: 'webauthn_credential_created'
    readonly friendlyName: string
}

/** Emitted after a passkey was successfully deleted */
interface WebauthnCredentialDeletedEvent extends AbstractEvent {
    readonly name: 'webauthn_credential_deleted'
    readonly deviceId: string
}

/** Emitted after a successful unlink identity. */
interface SocialIdentityUnlinkedEvent extends AbstractEvent {
    readonly name: 'unlink'
    readonly identityId: string
}

/** Emitted after trusted devices has been listed. */
interface WebAuthnDevicesListedEvent extends AbstractEvent {
    readonly name: 'mfa_trusted_device_listed'
    readonly devices: TrustedDevice[]
}

/** Emitted after a device has been added as a trusted device. */
interface MfaTrustedDeviceAddedEvent extends AbstractEvent {
    readonly name: 'mfa_trusted_device_added'
}

/** Emitted after a device has been removed as a trusted device. */
interface MfaTrustedDeviceDeletedEvent extends AbstractEvent {
    readonly name: 'mfa_trusted_device_deleted'
    readonly device: TrustedDevice
}

type SuccessEvent =
    | SignupEvent
    | LoginEvent
    | SocialLoginEvent
    | EmailUpdatedEvent
    | PhoneNumberUpdatedEvent
    | UserUpdatedEvent
    | AccountRecoveryEvent
    | OtpSentEvent
    | Login2ndStepEvent
    | PasswordChangedEvent
    | PasswordResetRequestedEvent
    | PasswordResetEvent
    | MfaCredentialsListedEvent
    | MfaEmailStartRegistration
    | MfaEmailVerifyRegistration
    | MfaPhoneNumberStartRegistration
    | MfaPhoneNumberVerifyRegistration
    | MfaPhoneNumberDeletedEvent
    | MfaEmailDeletedEvent
    | PhoneNumberVerifiedEvent
    | WebauthnResetEvent
    | WebauthnCredentialCreatedEvent
    | WebauthnCredentialDeletedEvent
    | SocialIdentityUnlinkedEvent
    | WebAuthnDevicesListedEvent
    | MfaTrustedDeviceAddedEvent
    | MfaTrustedDeviceDeletedEvent

type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
} & {};

/**
 * From T, make optional a set of properties whose keys are in the union K
 * @example Optional<{ firstname: string, lastname: string }, 'lastname'> // => { firstname: string, lastname?: string }
 */
type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

type RequiredProperty<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};

type ConsentsVersions = { consentsVersions: Record<string, ConsentVersions> };

type CustomFields = {
    addressFields?: CustomField[];
    customFields?: CustomField[];
};

type Config = Config$1 & RemoteSettings & ConsentsVersions & CustomFields;

type OnSuccess = (event: SuccessEvent) => void;

type OnError = (error?: unknown) => void;

declare module 'styled-components' {
    export interface DefaultTheme extends Theme {}
}

type ThemeOptions = RecursivePartial<Theme>;

interface BaseTheme {
    /**
     * @default true
     */
    animateWidgetEntrance: boolean;
    /** Specifies the font-size.
     * @default 14
     */
    fontSize: number;
    /** Specifies the font-size for small texts.
     * @default 12
     */
    smallTextFontSize: number;
    /** Specifies the line-height.
     * @default 1.428571429
     */
    lineHeight: number;
    /**
     * @default "#212529"
     */
    headingColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#495057"
     */
    textColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#adb5bd"
     */
    mutedTextColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "3"
     */
    borderRadius: number;
    /**
     * @default "#ced4da "
     */
    borderColor: NonNullable<CSSProperties['color']>;
    /**
     * @default 1
     */
    borderWidth: number;
    /**
     * @default "#ffffff"
     */
    backgroundColor: NonNullable<CSSProperties['color']>;
    /**
     * The button and link default color.
     * @default "#229955"
     */
    primaryColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#dc4e41"
     */
    dangerColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#ffc107"
     */
    warningColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#229955"
     */
    successColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#e9ecef"
     */
    lightBackgroundColor: NonNullable<CSSProperties['color']>;
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number;
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number;
    spacing: number;
    /**
     * @default 400
     */
    maxWidth: number;
    _absoluteLineHeight: number;
    _blockInnerHeight: number;
    _blockHeight: number;
}

interface LinkTheme {
    color: NonNullable<CSSProperties['color']>;
    decoration: NonNullable<CSSProperties['textDecoration']>;
    hoverColor: NonNullable<CSSProperties['color']>;
    hoverDecoration: NonNullable<CSSProperties['textDecoration']>;
}

interface InputTheme {
    color: NonNullable<CSSProperties['color']>;
    placeholderColor: NonNullable<CSSProperties['color']>;
    fontSize: number;
    lineHeight: number;
    paddingX: number;
    paddingY: number;
    borderRadius: number;
    borderColor: NonNullable<CSSProperties['color']>;
    borderWidth: number;
    background: NonNullable<CSSProperties['color']>;
    disabledBackground: NonNullable<CSSProperties['color']>;
    boxShadow: NonNullable<CSSProperties['boxShadow']>;
    focusBorderColor: NonNullable<CSSProperties['color']>;
    focusBoxShadow: (color?: CSSProperties['color']) => NonNullable<CSSProperties['boxShadow']>;
    height: number;
}

interface ButtonTheme {
    /** Specifies the font-weight (such as normal, bold, or 900).
     * @default 'bold'
     */
    fontWeight: NonNullable<CSSProperties['fontWeight']>;
    /** Specifies the font-size. */
    fontSize: number;
    /** Specifies the line-height. */
    lineHeight: number;
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number;
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number;
    /** Specifies the border-color. */
    borderColor: NonNullable<CSSProperties['color']>;
    /** Specifies the border-radius. */
    borderRadius: number;
    /** Specifies the border-width. */
    borderWidth: number;
    /** Function that specifies the box shadow based on the border color. */
    focusBoxShadow: (color?: CSSProperties['color']) => NonNullable<CSSProperties['boxShadow']>;
    /** Specifies the height. */
    height: number;
}

interface SocialButtonTheme {
    /** Boolean that specifies if the buttons are inline (horizonally-aligned). */
    inline: boolean;
    /** Boolean that specifies if the text is visible. */
    textVisible: boolean;
    /** Specifies the font-weight (such as normal, bold, or 900). */
    fontWeight: NonNullable<CSSProperties['fontWeight']>;
    /** Specifies the font-size. */
    fontSize: number;
    /** Specifies the line-height. */
    lineHeight: number;
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number;
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number;
    /** Specifies the border-color. */
    borderColor: NonNullable<CSSProperties['color']>;
    /** Specifies the border-radius. */
    borderRadius: number;
    /** Specifies the border-width. */
    borderWidth: number;
    /** Function that specifies the box shadow based on the border color. */
    focusBoxShadow: (color?: CSSProperties['color']) => NonNullable<CSSProperties['boxShadow']>;
    /** Specifies the height. */
    height: number;
}

interface PasswordStrengthTheme {
    color0: NonNullable<CSSProperties['color']>;
    color1: NonNullable<CSSProperties['color']>;
    color2: NonNullable<CSSProperties['color']>;
    color3: NonNullable<CSSProperties['color']>;
    color4: NonNullable<CSSProperties['color']>;
}

interface Theme extends BaseTheme {
    link: LinkTheme;
    input: InputTheme;
    /** Button theming options. */
    button: ButtonTheme;
    /** Social button theming options. */
    socialButton: SocialButtonTheme;
    passwordStrengthValidator: PasswordStrengthTheme;
}

type I18nProps = {
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

interface MainViewProps$5 {
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
interface SuccessViewProps$1 {
    loginLink?: string;
}
interface AccountRecoveryWidgetProps extends MainViewProps$5, SuccessViewProps$1 {
}

type FieldType = 'checkbox' | 'date' | 'decimal' | 'email' | 'hidden' | 'identifier' | 'integer' | 'number' | 'object' | 'password' | 'phone' | 'radio-group' | 'select' | 'string' | 'tags';
type Transformer = {
    input: (value?: any) => Record<string, any>;
    output: (...event: any[]) => unknown;
};
type Validation<TFieldType extends FieldType, TFieldValues extends FieldValues = FieldValues> = {
    bivarianceHack(args: {
        client: Client$1;
        config: Config;
        definition: FieldDefinition<TFieldType>;
        i18n: TFunction;
        watch: UseFormWatch<TFieldValues>;
    }): z.ZodType;
}['bivarianceHack'];
type BaseFieldDefinition<TFieldType extends FieldType, TFieldValues extends FieldValues = FieldValues> = {
    type: TFieldType;
    key: string;
    parent?: string | (string | number)[];
    autoComplete?: AutoFill;
    defaultValue?: string;
    description?: React.ReactNode;
    label?: string;
    placeholder?: string;
    required?: boolean;
    transform?: Transformer;
    validation?: Validation<TFieldType, TFieldValues>;
};
type FieldDefinition<TFieldType extends FieldType = FieldType, TFieldValues extends FieldValues = FieldValues> = BaseFieldDefinition<TFieldType, TFieldValues> & ({
    type: 'radio-group' | 'select';
    values: {
        value: string;
        label: string;
    }[];
} | {
    type: 'checkbox';
    defaultChecked?: boolean;
} | {
    type: 'password';
    canShowPassword?: boolean; /** TODO: implement this option in PasswordField */
    withPolicyRules?: boolean;
} | {
    type: 'phone';
    allowInternational?: boolean;
    defaultCountry?: CountryCode;
    /** @deprecated Use `allowInternational` instead. */
    phoneNumberOptions?: PhoneNumberOptions;
} | {
    type: 'date';
    max?: number;
    min?: number;
    yearRange?: number;
} | {
    type: 'identifier';
    isWebAuthnLogin?: boolean;
    withPhoneNumber?: boolean;
} | {
    type: 'hidden';
} | {
    type: Exclude<FieldType, 'checkbox' | 'date' | 'hidden' | 'identifier' | 'password' | 'phone' | 'radio-group' | 'select'>;
});
declare const predefinedFields: Record<string, (args: {
    config: Config;
    definition: Omit<FieldDefinition<FieldType, FieldValues>, 'key' | 'type'>;
}) => FieldDefinition<FieldType, FieldValues>>;
type PredefinedFields = keyof typeof predefinedFields;
type StaticContent = {
    staticContent: React.ReactNode;
};
type Field = PredefinedFields | Optional<FieldDefinition, 'type'> | FieldDefinition | StaticContent;
type PhoneNumberOptions = {
    allowInternational?: boolean;
    defaultCountry?: CountryCode;
    /**
     * If `withCountryCallingCode` property is explicitly set to true then the "country calling code" part (e.g. "+1" when country is "US") is included in the input field (but still isn't editable).
     * @deprecated Use `allowInternational` instead.
     */
    withCountryCallingCode?: boolean;
    /**
     * If `withCountrySelect` property is `true` then the user can select the country for the phone number. Must be a supported {@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements country code}.
     * @deprecated Use `allowInternational` instead.
     */
    withCountrySelect?: boolean;
};

/**
 * The widget’s initial screen.
 * @enum {('login' | 'login-with-web-authn' | 'signup' | 'forgot-password')}
 */
type InitialScreen = 'login' | 'login-with-web-authn' | 'signup' | 'signup-with-password' | 'signup-with-web-authn' | 'forgot-password';

type StepUpFormData = {
    authType: StepUpPasswordlessParams$1['authType'];
};
interface MainViewProps$4 {
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
    /**
     * Action used in template
     */
    action?: string;
}
type FaSelectionViewState = MFA.StepUpResponse & {
    allowTrustDevice?: boolean;
    auth?: AuthOptions;
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
type StepUpHandlerResponse = StepUpResponse & StepUpFormData;
declare const FaSelectionView: ({ onError, onSuccess, ...props }: FaSelectionViewProps) => React.JSX.Element | null;
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
declare const VerificationCodeView$1: ({ onError, onSuccess, ...props }: VerificationCodeViewProps$3) => React.JSX.Element;
type MfaStepUpProps = MainViewProps$4 & FaSelectionViewProps & VerificationCodeViewProps$3;
type MfaStepUpWidgetProps = MfaStepUpProps;

interface CaptchaFoxConf {
    /**
     * Boolean that specifies whether CaptchaFox is enabled or not.
     */
    captchaFoxEnabled: boolean;
    /**
     * The SITE key that comes from your [CaptchaFox](https://docs.captchafox.com/getting-started#get-your-captchafox-keys) setup.
     * This must be paired with the appropriate secret key that you received when setting up CaptchaFox.
     */
    captchaFoxSiteKey: string;
    /**
     * Define how CaptchaFox is displayed (hidden|inline|popup)/ Default to hidden.
     */
    captchaFoxMode?: WidgetDisplayMode;
}

declare global {
    interface Window {
        grecaptcha: {
            execute(siteKey: string, action: {
                action: string;
            }): PromiseLike<string>;
        };
    }
}
interface ReCaptchaConf {
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key: string;
}

type WithCaptchaProps<T> = T & Partial<ReCaptchaConf & CaptchaFoxConf>;

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
     * The origin of the request.
     */
    origin?: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
declare const ForgotPasswordView: ({ allowLogin, allowPhoneNumberResetPassword, displaySafeErrorMessage, showLabels, allowWebAuthnLogin, initialScreen, recaptcha_enabled, recaptcha_site_key, captchaFoxEnabled, captchaFoxMode, captchaFoxSiteKey, origin, redirectUrl, returnToAfterPasswordReset, onError, onSuccess, }: WithCaptchaProps<ForgotPasswordViewProps>) => React.JSX.Element;

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
    /**
     * Action used in template
     */
    action?: string;
};
declare const LoginView: ({ acceptTos, allowForgotPassword, allowSignup, allowWebAuthnLogin, allowAccountRecovery, auth, canShowPassword, socialProviders, allowCustomIdentifier, showLabels, showRememberMe, recaptcha_enabled, recaptcha_site_key, captchaFoxEnabled, captchaFoxSiteKey, captchaFoxMode, allowAuthentMailPhone, allowTrustDevice, action, onError, onSuccess, }: WithCaptchaProps<LoginViewProps>) => React.JSX.Element;

interface LoginWithPasswordViewProps {
    allowForgotPassword?: boolean;
    allowAccountRecovery?: boolean;
    auth?: AuthOptions;
    canShowPassword?: boolean;
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
    /**
     * Action used in template
     */
    action?: string;
}
declare const LoginWithPasswordView: ({ allowForgotPassword, allowAccountRecovery, auth, canShowPassword, recaptcha_enabled, recaptcha_site_key, captchaFoxEnabled, captchaFoxSiteKey, captchaFoxMode, showLabels, showRememberMe, allowTrustDevice, action, onError, onSuccess, }: WithCaptchaProps<LoginWithPasswordViewProps>) => React.JSX.Element;

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
declare const LoginWithWebAuthnView: ({ acceptTos, allowSignup, auth, enablePasswordAuthentication, showLabels, socialProviders, allowAccountRecovery, onError, onSuccess, }: LoginWithWebAuthnViewProps) => React.JSX.Element;

type PropsWithSession<P> = P & {
    session?: SessionInfo;
};

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
declare const QuickLoginView: ({ initialScreen, allowWebAuthnLogin, auth, session, onError, onSuccess, }: PropsWithSession<QuickLoginViewProps>) => React.JSX.Element | null;

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
    /**
     * Action used in template
     */
    action?: string;
}
declare const ReauthView: ({ allowForgotPassword, auth, session, showLabels, socialProviders, action, onError, onSuccess, }: PropsWithSession<ReauthViewProps>) => React.JSX.Element | null;

interface PasswordSignupFormProps {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * A function that is called before the signup request is made.
     */
    beforeSignup?: <T>(param: T) => T;
    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean;
    /**
     * Object that lets you set display options for the phone number field.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * The URL sent in the email to which the user is redirected. This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used as the post-email confirmation URL.
     */
    returnToAfterEmailConfirmation?: string;
    /**
     * Boolean for whether the signup form fields' labels are displayed on the login view.
     * @default false
     * If set to `true`, the labels are shown which includes an asterisk (*) next to required fields.
     */
    showLabels?: boolean;
    /**
     * List of the signup fields to display in the form.
     *
     * A field is either a string representing the field’s key (predefined, custom field, or consent) or an object with attributes overriding the default field configuration.
     *
     * @default ['given_name', 'family_name', 'email', 'password', 'password_confirmation']
     */
    signupFields?: (string | Field)[];
    /**
     * The user agreement text to display in the form.
     */
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
declare const SignupWithPasswordView: ({ onSuccess, ...props }: SignupWithPasswordViewProps) => React.JSX.Element;

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
     * A field is either a string representing the field’s key (predefined, custom field, or consent) or an object with attributes overriding the default field configuration.
     *
     * @default ['given_name', 'family_name', 'email']
     *
     * @example
     * [
     *   "email",
     *   {
     *     "key": "family_name",
     *     "defaultValue": "Moreau",
     *     "required": true
     *   }
     * ]
     */
    signupFields?: Field[];
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
declare const SignupWithWebAuthnView: ({ auth, beforeSignup, redirectUrl, returnToAfterEmailConfirmation, signupFields, showLabels, userAgreement, onError, onSuccess, }: SignupWithWebAuthnViewProps) => React.JSX.Element;

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
declare const SignupView: ({ allowLogin, initialScreen, allowWebAuthnLogin, allowWebAuthnSignup, enablePasswordAuthentication, socialProviders, ...props }: SignupViewProps) => React.JSX.Element;

interface AuthWidgetProps extends ComponentProps<typeof LoginView>, ComponentProps<typeof LoginWithWebAuthnView>, ComponentProps<typeof LoginWithPasswordView>, ComponentProps<typeof SignupView>, ComponentProps<typeof SignupWithPasswordView>, ComponentProps<typeof SignupWithWebAuthnView>, ComponentProps<typeof ForgotPasswordView>, ComponentProps<typeof QuickLoginView>, ComponentProps<typeof ReauthView>, Omit<ComponentProps<typeof FaSelectionView>, keyof FaSelectionViewState>, Omit<ComponentProps<typeof VerificationCodeView$1>, keyof VerificationCodeViewState> {
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

interface MainViewProps$3 {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
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
declare const MainView: ({ accessToken, recaptcha_enabled, recaptcha_site_key, captchaFoxEnabled, captchaFoxMode, captchaFoxSiteKey, redirectUrl, showLabels, onError, onSuccess, }: WithCaptchaProps<MainViewProps$3>) => React.JSX.Element;
interface EmailEditorWidgetProps extends ComponentProps<typeof MainView> {
}

type CredentialsProviderProps = {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * The user's MFA credentials
     */
    credentials: MFA.Credential[];
};

interface MainViewProps$2 {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
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
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    profileIdentifiers?: Pick<Profile, 'emailVerified' | 'phoneNumber' | 'phoneNumberVerified'>;
    /**
     * Allow to trust device during enrollment
     */
    allowTrustDevice?: boolean;
    /**
     * Action used in template
     */
    action?: string;
}
interface VerificationCodeViewProps$2 {
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
    /**
     * Display the checkbox to trust device
     */
    allowTrustDevice?: boolean;
}
type MfaCredentialsProps = Prettify<MainViewProps$2 & VerificationCodeViewProps$2 & CredentialsProviderProps>;
type MfaCredentialsWidgetProps = Prettify<Omit<MfaCredentialsProps, 'credentials' | 'profileIdentifiers'>>;

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

type TrustedDeviceWidgetProps = {
    accessToken: string;
    showRemoveTrustedDevice?: boolean;
    onError?: OnError;
    onSuccess?: OnSuccess;
};

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

interface PasswordlessViewProps {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * The passwordless auth type (`magic_link` or `sms`).
     * @default "magic_link"
     */
    authType?: SingleFactorPasswordlessParams['authType'] | SingleFactorPasswordlessParams['authType'][];
    /**
     * Enable the verification code view.
     * If not defined, the verification code view will only be enabled if the authType is `sms`.
     */
    enableVerificationCode?: boolean;
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
declare const PasswordlessView: ({ auth, authType, enableVerificationCode, recaptcha_enabled, recaptcha_site_key, captchaFoxEnabled, captchaFoxMode, captchaFoxSiteKey, showIntro, showSocialLogins, socialProviders, phoneNumberOptions, onError, onSuccess, }: WithCaptchaProps<PasswordlessViewProps>) => React.JSX.Element;

interface VerificationCodeViewProps$1 {
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}
declare const VerificationCodeView: ({ recaptcha_enabled, recaptcha_site_key, captchaFoxEnabled, captchaFoxMode, captchaFoxSiteKey, onSuccess, onError, }: WithCaptchaProps<VerificationCodeViewProps$1>) => React.JSX.Element;

type PasswordlessWidgetProps = Prettify<ComponentProps<typeof PasswordlessView> & ComponentProps<typeof VerificationCodeView>>;

interface MainViewProps$1 {
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
interface SuccessViewProps {
    loginLink?: string;
}
interface PasswordResetWidgetProps extends MainViewProps$1, SuccessViewProps {
}

interface MainViewProps {
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
    /**
     * Callback function called when the request has succeeded
     */
    onSuccess?: OnSuccess;
}
type VerificationCodeViewProps = {
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
type PhoneNumberEditorWidgetProps = Prettify<MainViewProps & VerificationCodeViewProps>;

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
    resolvedFields: (FieldDefinition | StaticContent)[];
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
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

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
type WidgetOptions<P> = Prettify<P & WidgetProps & I18nProps & ThemeProps>;
type Widget<P> = (props: P, ctx: Context) => Promise<React.JSX.Element>;
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
    showTrustedDevices(options: WidgetOptions<TrustedDeviceWidgetProps>): void;
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
    showTrustedDevices: InstanceType<typeof UiClient>['showTrustedDevices'];
};
declare function createClient(creationConfig: Config$1): Client;

export { type Client, type ThemeOptions, createClient };
