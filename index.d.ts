export * as Core from '@reachfive/identity-core'
import { Client as CoreClient, AuthOptions as CoreAuthOptions, ErrorResponse } from '@reachfive/identity-core'

import { InitialScreen, ProviderId } from './constants'

export function createClient(creationConfig: Config): Client

export interface Client {
    core: CoreClient,
    showAuth(options: AuthOptions): Promise<void>,
    showEmailEditor(options: EmailEditorOptions): Promise<void>,
    showPasswordEditor(options: PasswordEditorOptions): Promise<void>,
    showPhoneNumberEditor(options: PhoneNumberEditorOptions): Promise<void>,
    showPasswordReset(options: PasswordResetOptions): Promise<void>,
    showPasswordless(options: PassswordlessOptions): Promise<void>,
    showProfileEditor(options: ProfileEditorOptions): Promise<void>,
    showSocialAccounts(options: SocialAccountsOptions): Promise<void>,
    showSocialLogin(options: SocialLoginOptions): Promise<void>,
    showWebAuthnDevices(options: WebAuthnDevicesOptions): Promise<void>,
    showMfa(options: MfaOptions): Promise<void>,
    showMfaCredentials(options: MfaCredentialsOptions): Promise<void>,
    showStepUp(options: StepUpOptions): Promise<void>
}

export interface Config {
    clientId: string,
    domain: string,
    language?: string,
    locale?: string
}

export interface WidgetInstance {
    destroy(): void
}

interface Container {
    /** The DOM element or the `id` of a DOM element in which the widget should be embedded. */
    container: HTMLElement | string
}

interface AccessToken {
    /** The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old. */
    accessToken: string
}

interface I18n {
    /** Widget labels and error messages to override. Falls back to the default wordings in `en`, `fr`, `es`, `it` and `nl`. */
    i18n?: Record<string, string>
}

interface OnReady {
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onReady?: (arg: WidgetInstance) => void
}

interface OnSuccess {
    /** Callback function called when the request has failed. */
    onSuccess?: () => void
}

interface OnError {
    /** Callback function called after the widget has been successfully loaded and rendered inside the container. The callback is called with the widget instance. */
    onError?: (error: ErrorResponse) => void
}

interface Theme {
    /**
     * The options to set up to customize the appearance of the widget.
     *
     * @type Theme
     */
    theme?: ThemeOptions
}

export interface ThemeOptions {
    /**
     * The button and link default color.
     * @default "#229955"
     */
    primaryColor?: string

    /**
     * The radius of the social login button and other input (in px).
     * @default "3"
     */
    borderRadius?: string

    /** Social button theming options. */
    socialButton?: SocialButtonTheme
}

export interface SocialButtonTheme {
    /** Boolean that specifies if the buttons are inline (horizonally-aligned). */
    inline?: boolean
    /** Boolean that specifies if the text is visible. */
    textVisible?: boolean
    /** Specifies the font-weight (such as normal, bold, or 900). */
    fontWeight?: string
    /** Specifies the font-size. */
    fontSize?: string
    /** Specifies the line-height. */
    lineHeight?: string
    /** Specifies the padding for the x axis. (left and right) */
    paddingX?: string
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY?: string
    /** Specifies the border-radius. */
    borderRadius?: string
    /** Specifies the border-width. */
    borderWidth?: string
    /** Boolean that specifies if there is a box shadow on the button or not. */
    focusBoxShadow?: boolean
}

/**
 * The field's type.
 * @enum {('hidden' | 'text' | 'number' | 'email' | 'tel')}
 */
export type FieldType = 'hidden' | 'text' | 'number' | 'email' | 'tel'

/** The field's representation. */
export interface Field {
    key: string
    label?: string
    required?: boolean
    type?: FieldType
}

/**
* The auth type.
* @enum {('magic_link' | 'sms')}
*/
export type AuthType = 'magic_link' | 'sms'

export interface AuthOptions extends Container, I18n, OnReady, Theme {
    /**
     * Boolean that specifies if the forgot password option is enabled.
     *
     * If the `allowLogin` and `allowSignup` properties are set to `false`, the forgot password feature is enabled even if `allowForgotPassword` is set to `false`.
     *
     * @default true
     */
    allowForgotPassword?: boolean

    /**
     * Boolean that specifies whether biometric login is enabled.
     *
     * @default false
     */
    allowWebAuthnLogin?: boolean

    /**
     * Boolean that specifies whether biometric signup is enabled.
     *
     * @default false
     */
    allowWebAuthnSignup?: boolean

    /**
     * Boolean that specifies whether login is enabled.
     *
     * @default true
     */
    allowLogin?: boolean

    /**
     * Boolean that specifies whether signup is enabled.
     *
     * @default true
     */

    allowSignup?: boolean
    /**
     * Boolean that specifies whether an additional field for the custom identifier is shown.
     *
     * @default false
     */

    allowCustomIdentifier?: boolean

    /** List of authentication options */
    auth?: CoreAuthOptions

    /**
     * Whether or not to provide the display password in clear text option.
     *
     * @default false
     */
    canShowPassword?: boolean

    /**
     * The [ISO country](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code useful to format phone numbers.
     * Defaults to the predefined country code in your account settings or `FR`.
     */
    countryCode?: string

    /**
     * Whether or not to display a safe error message on password reset, given an invalid email address.
     * This mode ensures not to leak email addresses registered to the platform.
     *
     * @default false
     */
    displaySafeErrorMessage?: boolean

    /**
     * The widget’s initial screen.
     *
     * - if `allowLogin` is set to `true`, it defaults to `login`.
     * - if `allowLogin` is set to `false` and `allowSignup` is set to `true`, it defaults to `signup`.
     * - if `allowLogin` is set to `false` and `allowWebAuthnLogin` is set to `true`, it defaults to `login-with-web-authn`.
     * - otherwise, defaults to `forgot-password`.
     */
    initialScreen?: InitialScreen

    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     * */
    redirectUrl?: string

    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used as the post-email confirmation URL.
     * Important: This parameter should only be used with Hosted Pages.
     */
    returnToAfterEmailConfirmation?: string

    /**
     * Returned in the `redirectUrl` as a query parameter, this parameter is used to redirect users to a specific URL after a password reset.
     * Important: This parameter should only be used with Hosted Pages.
     */
    returnToAfterPasswordReset?: string

    /**
     * Whether the signup form fields' labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean

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
    showRememberMe?: boolean

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
    signupFields?: (Field | string)[]

    /**
     * Lists the available social providers. This is an array of strings.
     * Tip: If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: ProviderId[]

    /** Boolean that specifies whether reCAPTCHA is enabled or not. */
    recaptcha_enabled?: boolean

    /** The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup. This must be paired with the appropriate secret key that you received when setting up reCAPTCHA. */
    recaptcha_site_key?: string
}

export interface EmailEditorOptions extends AccessToken, Container, I18n, OnReady, Theme {
    /** The URL sent in the email to which the user is redirected. This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings. */
    redirectUrl?: string

    /**
     * Whether the signup form fields' labels are displayed on the login view.
     * @default false
     */
    showLabels?: boolean
}

export interface PasswordEditorOptions extends AccessToken, Container, I18n, OnReady, OnSuccess, OnError, Theme {
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     * @default false
     */
    showLabels?: boolean

    /**
     * Ask for the old password before entering a new one.
     * @default false
     */
    promptOldPassword?: boolean

    /** The URL sent in the email to which the user is redirected. This URL must be whitelisted in the Allowed Callback URLs field of your ReachFive client settings. */
    redirectUrl?: string
}

export interface PasswordResetOptions extends Container, OnReady, I18n, Theme {
    /** The URL to which the user is redirected after a password reset. */
    loginLink?: string

    /**
     * Whether or not to provide the display password in clear text option.
     * @default false
     */
    canShowPassword?: boolean

    /** The URL sent in the email to which the user is redirected. This URL must be whitelisted in the Allowed Callback URLs field of your ReachFive client settings. */
    redirectUrl?: string
}

export interface PhoneNumberEditorOptions extends AccessToken, Container, OnReady, I18n, Theme {
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     * @default false
     */
    showLabels?: boolean

    /**
     * The [ISO country](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code useful to format phone numbers.
     *
     * Defaults to the predefined country code in your account settings or `FR`.
     */
    countryCode?: string
}

export interface ProfileEditorOptions extends AccessToken, Container, OnReady, OnSuccess, OnError, I18n, Theme {
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
    fields?: (Field | string)[]

    /**
     * Whether the signup form fields' labels are displayed on the login view.
     * @default false
     */
    showLabels?: boolean

    /**
     * The [ISO country](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code useful to format phone numbers.
     *
     * Defaults to the predefined country code in your account settings or `FR`.
     */
    countryCode?: string

    /** The URL sent in the email to which the user is redirected. This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings. */
    redirectUrl?: string
}

export interface SocialAccountsOptions extends AccessToken, Container, I18n, OnReady, Theme {
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip: If you pass an empty array, social providers will not be displayed.
     * */
    providers?: ProviderId[]

    /** List of authentication options */
    auth?: CoreAuthOptions
}

export interface SocialLoginOptions extends Container, I18n, OnReady, Theme {
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip: If you pass an empty array, social providers will not be displayed.
     * */
    socialProviders?: ProviderId[]

    /** List of authentication options */
    auth?: CoreAuthOptions

    /** The URL sent in the email to which the user is redirected. This URL must be whitelisted in the Allowed Callback URLs field of your ReachFive client settings. */
    redirectUrl?: string
}

export interface PassswordlessOptions extends Container, I18n, OnReady, OnSuccess, OnError, Theme {
    /**
     * The passwordless auth type (`magic_link` or `sms`).
     * @default "magic_link"
     */
    authType?: AuthType

    /**
     * Show the social login buttons.
     * @default false
     */
    showSocialLogins?: boolean

    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip:  If you pass an empty array, social providers will not be displayed.
     */
    socialProviders?: ProviderId[]

    /**
     * Show the introduction text.
     * @default true
     */
    showIntro?: boolean

    /**
     * The [ISO country](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code useful to format phone numbers.
     *
     * Defaults to the predefined country code in your account settings or `FR`.
     */
    countryCode?: string

    /** List of authentication options */
    auth?: CoreAuthOptions

    /** The URL sent in the email to which the user is redirected. This URL must be whitelisted in the Allowed Callback URLs field of your ReachFive client settings. */
    redirectUrl?: string

    /** Boolean that specifies whether reCAPTCHA is enabled or not. */
    recaptcha_enabled?: boolean

    /** The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup. This must be paired with the appropriate secret key that you received when setting up reCAPTCHA. */
    recaptcha_site_key?: string
}

export interface WebAuthnDevicesOptions extends AccessToken, Container, I18n, OnReady, Theme {}

export interface MfaOptions extends AccessToken, Container, I18n, OnReady, Theme {
    /**
     * Show the introduction text.
     * @default true
     */
    showIntro?: boolean

    /**
     * Boolean to enable (`true`) or disable (`false`) whether the option to remove MFA credentials are displayed.
     * @default true
     */
    showRemoveMfaCredentials?: boolean

    /**
     * Boolean to enable (`true`) or disable (`false`) whether the option to remove MFA credentials are displayed.
     * @default false
     */
    requireMfaRegistration?: boolean
}

export interface MfaCredentialsOptions extends AccessToken, Container, I18n, OnReady, Theme {}

export interface StepUpOptions extends AccessToken, Container, I18n, OnReady, Theme {
    /** List of authentication options */
    auth?: CoreAuthOptions

    /**
     * Show the introduction text.
     * @default true
     */
    showIntro?: boolean

    /**
     * Show the stepup button. Unnecessary for console use
     * @default true
     */
    showStepUpStart?: boolean
}
