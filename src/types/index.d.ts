import type { Config as CoreConfig, ConsentVersions, CustomField, RemoteSettings } from '@reachfive/identity-core'

export type Prettify<T> = {
    [K in keyof T]: T[K]
} & {}

export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>
} & {}

/**
 * From T, make optional a set of properties whose keys are in the union K
 * @example Optional<{ firstname: string, lastname: string }, 'lastname'> // => { firstname: string, lastname?: string }
 */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type RequiredProperty<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
}

type ConsentsVersions = { consentsVersions: Record<string, ConsentVersions> }

type CustomFields = { customFields?: CustomField[] }

export type Config = CoreConfig & RemoteSettings & ConsentsVersions & CustomFields

const _allowedLocales = ["en", "fr", "es", "it", "nl", "de", "ru", "pt", "hu", "sk", "ar", "ja", "ko", "zh", "zh-CN", "zh-Hans", "zh-Hant", "zh-HK", "zh-MO", "zh-SG", "zh-TW"] as const
export type AllowedLocale = (typeof _allowedLocales)[number]