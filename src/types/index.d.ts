import type { Config as CoreConfig, RemoteSettings } from '@reachfive/identity-core'
import type { ConsentsVersions } from './consents'
import type { CustomField } from '../components/form/formFieldFactory'

export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>
} & {}

export type PartialExcept<T, K extends keyof T> = Prettify<RecursivePartial<T> & Pick<T, K>>

export type RequiredProperty<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
}

type CustomFields = { customFields?: CustomField[] }

export type Config = CoreConfig & RemoteSettings & ConsentsVersions & CustomFields
