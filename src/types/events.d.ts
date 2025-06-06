import type { AuthResult, MFA, SingleFactorPasswordlessParams, StepUpPasswordlessParams, TrustedDevice } from "@reachfive/identity-core"

interface AbstractEvent {
    readonly name: string
}

interface SignupEvent extends AbstractEvent {
    readonly name: 'signup'
    readonly authResult: AuthResult
}

interface LoginEvent extends AbstractEvent {
    readonly name: 'login'
    readonly authResult: AuthResult
}

interface SocialLoginEvent extends AbstractEvent {
    readonly name: 'social_login'
    readonly provider: string
}

interface EmailUpdatedEvent extends AbstractEvent {
    readonly name: 'email_updated'
}

interface ProfileUpdatedEvent extends AbstractEvent {
    readonly name: 'profile_updated'
}

interface PasswordUpdatedEvent extends AbstractEvent {
    readonly name: 'password_updated'
}

interface ForgotPasswordEvent extends AbstractEvent {
    readonly name: 'forgot_password'
}

interface PasswordResetEvent extends AbstractEvent {
    readonly name: 'password_reset'
}

interface AccountRecoveryEvent extends AbstractEvent {
    readonly name: 'account_recovery'
}

interface PasswordlessStartEvent extends AbstractEvent {
    readonly name: 'passwordless_start'
    readonly authType: SingleFactorPasswordlessParams['authType']
}

interface PasswordlessVerifiedEvent extends AbstractEvent {
    readonly name: 'passwordless_verified'
    readonly authType: SingleFactorPasswordlessParams['authType']
    readonly authResult: AuthResult
}

interface MfaStepUpVerifiedEvent extends AbstractEvent {
    readonly name: 'mfa_step_up_verified'
    readonly authType: StepUpPasswordlessParams['authType']
    readonly authResult: AuthResult
}

interface MfaCredentialsListedEvent extends AbstractEvent {
    readonly name: 'mfa_credentials_listed'
    readonly credentials: MFA.Credential[]
}

interface MfaPhoneNumberRemovedEvent extends AbstractEvent { 
    readonly name: 'mfa_phone_number_removed'
}

interface MfaEmailRemovedEvent extends AbstractEvent {
    readonly name: 'mfa_email_removed'
}

interface PhoneNumberVerifiedEvent extends AbstractEvent {
    readonly name: 'phone_number_verified'
    readonly phoneNumber: string
}

interface PasskeyResetEvent extends AbstractEvent {
    readonly name: 'passkey_reset'
}

interface CredentialRegisteredEvent extends AbstractEvent {
    readonly name: 'credential_registered'
    readonly type: MFA.Credential['type']
}

interface WebAuthnDeviceAddedEvent extends AbstractEvent {
    readonly name: 'web_authn_device_added'
    readonly friendlyName: string
}

interface WebAuthnDeviceRemovedEvent extends AbstractEvent {
    readonly name: 'web_authn_device_removed'
    readonly deviceId: string
}

interface SocialIdentityUnlinkedEvent extends AbstractEvent {
    readonly name: 'social_identity_unlinked'
    readonly identityId: string
}

interface TrustedDevicesListedEvent extends AbstractEvent {
    readonly name: 'trusted_devices_listed'
    readonly devices: TrustedDevice[]
}

interface TrustedDeviceDeletedEvent extends AbstractEvent {
    readonly name: 'trusted_device_deleted'
    readonly device: TrustedDevice
}

export type SuccessEvent =
    | SignupEvent
    | LoginEvent
    | SocialLoginEvent
    | EmailUpdatedEvent
    | ProfileUpdatedEvent
    | PasswordUpdatedEvent
    | ForgotPasswordEvent
    | AccountRecoveryEvent
    | PasskeyResetEvent
    | PasswordResetEvent
    | PasswordlessStartEvent
    | PasswordlessVerifiedEvent
    | MfaStepUpVerifiedEvent
    | MfaCredentialsListedEvent
    | MfaEmailRemovedEvent
    | MfaPhoneNumberRemovedEvent
    | PhoneNumberVerifiedEvent
    | CredentialRegisteredEvent
    | WebAuthnDeviceAddedEvent
    | WebAuthnDeviceRemovedEvent
    | SocialIdentityUnlinkedEvent
    | TrustedDevicesListedEvent
    | TrustedDeviceDeletedEvent
