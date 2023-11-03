import { RemoteSettings as CoreRemoteSettings } from '@reachfive/identity-core/es/main/models'

declare module '@reachfive/identity-core' {

    type PasswordPolicy = {
        minLength: number
        minStrength: 0 | 1 | 2 | 3 | 4
        uppercaseCharacters?: number
        specialCharacters?: number
        lowercaseCharacters?: number
        digitCharacters?: number
        allowUpdateWithAccessTokenOnly: boolean
    }

    export type RemoteSettings = CoreRemoteSettings & {
        countryCode: string
        mfaEmailEnabled: boolean
        mfaSmsEnabled: boolean
        passwordPolicy: PasswordPolicy
        resourceBaseUrl: string
        sms: boolean
        socialProviders: string[]
        webAuthn: boolean
    }

}