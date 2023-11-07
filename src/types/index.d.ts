import type { Config as CoreConfig, ConsentVersions, CustomField, RemoteSettings } from '@reachfive/identity-core'

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

type ConsentsVersions = { consentsVersions: Record<string, ConsentVersions> }

type CustomFields = { customFields?: CustomField[] }

export type Config = CoreConfig & RemoteSettings & ConsentsVersions & CustomFields
