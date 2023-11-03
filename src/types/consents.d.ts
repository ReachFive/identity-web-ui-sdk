export type ConsentType = 'opt-in' | 'opt-out' | 'double-opt-in'
export type ConsentStatus = 'active' | 'archived'
export type DoubleOptinConsentChannel = 'email' | 'sms' | 'default'

export interface ConsentVersion {
    description?: string
    language: string
    versionId: number
    title: string
}

export interface Consent {
    key: string
    consentType: ConsentType
    status: ConsentStatus
    versions: ConsentVersion[]
    tags: string[]
    associatedConsents?: string[]
    preferredChannel?: DoubleOptinConsentChannel
}

export interface UserConsentVersion {
    language: string
    versionId: number
}

export interface UserConsent {
    granted: boolean
    waitingDoubleAccept?: boolean
    date: string
    consentVersion?: UserConsentVersion
    consentType?: ConsentType
    reporter?: string
}

export type ConsentsVersions = { consentsVersions: Record<string, Consent> }
