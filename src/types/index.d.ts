import type {
    ConsentVersions,
    Config as CoreConfig,
    CustomField,
    RemoteSettings as CoreRemoteSettings,
} from '@reachfive/identity-core';

import type { Provider } from '@/providers/providers';

import type { SuccessEvent, AuthType, IdentifierType, LoginEventWrappingObject } from './events';

export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

/**
 * Recursively make every property optional, without descending into primitives,
 * functions or arrays (mapping over a `string` would otherwise expose its own
 * members — `charAt`, `length`, … — as optional properties).
 */
export type RecursivePartial<T> = {
    [P in keyof T]?: T[P] extends (...args: never[]) => unknown
        ? T[P]
        : T[P] extends readonly (infer U)[]
          ? RecursivePartial<U>[]
          : T[P] extends object
            ? RecursivePartial<T[P]>
            : T[P];
} & {};

/**
 * From T, make optional a set of properties whose keys are in the union K
 * @example Optional<{ firstname: string, lastname: string }, 'lastname'> // => { firstname: string, lastname?: string }
 */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type RequiredProperty<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};

type ConsentsVersions = { consentsVersions: Record<string, ConsentVersions> };

type CustomFields = {
    addressFields?: CustomField[];
    customFields?: CustomField[];
};

/**
 * Extends the core remote settings with fields not yet released in `@reachfive/identity-core`.
 */
export type RemoteSettings = CoreRemoteSettings & {
    customProviders?: Record<string, Provider>;
};

export type Config = CoreConfig & RemoteSettings & ConsentsVersions & CustomFields;

export type OnSuccess = (event: SuccessEvent) => void;

export type OnError = (error?: unknown) => void;

export { AuthType, IdentifierType, LoginEventWrappingObject };
