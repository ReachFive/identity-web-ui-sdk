import { toQueryString } from './queryString'
import { camelCaseProperties, snakeCaseProperties } from './transformObjectProperties';
import isEmpty from 'lodash-es/isEmpty';

export function createHttpClient(config) {
    function get(path, params) {
        return request(path, { ...params, method: 'GET' });
    }

    function post(path, params) {
        return request(path, { ...params, method: 'POST' });
    }

    function request(path, params) {
        const { method = 'GET', query = {}, body, accessToken = null, withCookies = false } = params;

        const fullPath = query && !isEmpty(query) ? `${path}?${toQueryString(query)}` : path;

        const url = fullPath.startsWith('http') ? fullPath : config.baseUrl + fullPath;

        const fetchOptions = {
            method,
            headers: {
                ...(accessToken && { Authorization: 'Bearer ' + accessToken }),
                ...(config.language && { 'Accept-Language': config.language }),
                ...(body && { 'Content-Type': 'application/json;charset=UTF-8' })
            },
            ...(withCookies && config.acceptCookies && { credentials: 'include' }),
            ...(body && { body: JSON.stringify(snakeCaseProperties(body)) })
        };

        return rawRequest(url, fetchOptions);
    }

    return { get, post, request };
}

export async function rawRequest(url, fetchOptions) {
    return fetch(url, fetchOptions).then(response => {
        if (response.status !== 204) {
            const dataP = response.json().then(camelCaseProperties);

            return response.ok ? dataP : dataP.then(data => Promise.reject(data));
        }
    });
}
