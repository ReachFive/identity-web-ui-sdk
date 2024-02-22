import { camelCase, snakeCase as lodashSnakeCase } from './utils';

export const snakeCasePath = (path: string) =>
    path
        .split('.')
        .map(snakeCase)
        .join('.');

export const camelCasePath = (path: string) =>
    path
        .split('.')
        .map(camelCase)
        .join('.');

export const camelCaseProperties = function (object: Record<string, unknown>) {
    return transformObjectProperties(object, camelCase);
}

export const snakeCaseProperties = function (object: Record<string, unknown>) {
    return transformObjectProperties(object, lodashSnakeCase);
}

type TransformObjectProperties<T> = T extends (infer U)[]
  ? TransformObjectProperties<U>[]
  : T extends Record<string, unknown>
  ? { [K in keyof T]: TransformObjectProperties<T[K]> }
  : T;

export function transformObjectProperties<T>(
    input: T,
    transform: (string: string) => unknown
): TransformObjectProperties<T> {
    if (Array.isArray(input)) {
        return input.map((item) => transformObjectProperties(item, transform)) as TransformObjectProperties<T>;
    }

    if (typeof input === "object" && input !== null) {
        return Object.fromEntries(
            Object.entries(input).map(([key, value]) => (
                [transform(key) as keyof T, transformObjectProperties(value, transform)]
            ))
        ) as TransformObjectProperties<T>
    }

    return input as TransformObjectProperties<T>;
}

/* reuse lodash as it covers most cases, but we want the same behavior as the
     snakecasing strategy on the server where numbers are not separated from non numbers. */
function snakeCase(input: string) {
    return lodashSnakeCase(input).replace(/_\d/g, dashNumber => dashNumber.slice(1));
}
