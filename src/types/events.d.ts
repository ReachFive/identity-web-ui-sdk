import {
    AuthResult,
    MFA,
    SingleFactorPasswordlessParams,
    StepUpPasswordlessParams,
    TrustedDevice
} from "@reachfive/identity-core"

export type LoginEventWrappingObject = {
    authResult: AuthResult,
    identifierType?: IdentifierType,
    authType: AuthType
}

export type IdentifierType = 'email' | 'phone_number' | 'custom_identifier'

export type AuthType = SingleFactorPasswordlessParams['authType'] | 'password' | 'webauthn' | 'social'

interface AbstractEvent {
    readonly name: string
}

/** Emitted after a successful signup. */
interface SignupEvent extends AbstractEvent {
    readonly name: 'signup'
    readonly authResult: AuthResult
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
    readonly device: TrustedDevice
}

/** Emitted after a device has been removed as a trusted device. */
interface MfaTrustedDeviceDeletedEvent extends AbstractEvent {
    readonly name: 'mfa_trusted_device_deleted'
    readonly device: TrustedDevice
}

export type SuccessEvent =
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
