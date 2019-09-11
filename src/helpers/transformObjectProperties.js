import isObject from 'lodash-es/isObject';
import isArray from 'lodash-es/isArray';
import reduce from 'lodash-es/reduce';
import camelCase from 'lodash-es/camelCase';
import lodashSnakeCase from 'lodash-es/snakeCase';

export const snakeCasePath = (path) =>
    path
        .split('.')
        .map(snakeCase)
        .join('.');

export const camelCasePath = (path) =>
    path
        .split('.')
        .map(camelCase)
        .join('.');

export const camelCaseProperties = (object) => transformObjectProperties(object, camelCase);

export const snakeCaseProperties = (object) => transformObjectProperties(object, snakeCase);

function transformObjectProperties(object, transform) {
    if (isArray(object)) {
        return object.map(o => transformObjectProperties(o, transform));
    }

    if (isObject(object)) {
        return reduce(
            object,
            (acc, value, key) => {
                acc[transform(key)] = transformObjectProperties(value, transform);
                return acc;
            },
            {}
        );
    }

    return object;
}

/* reuse lodash as it covers most cases, but we want the same behavior as the
     snakecasing strategy on the server where numbers are not separated from non numbers. */
function snakeCase(input) {
    return lodashSnakeCase(input).replace(/\_\d/g, dashNumber => dashNumber.slice(1));
}
