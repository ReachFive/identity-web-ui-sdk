import { isAuthResult, isErrorResponse } from './authResult';
import { parseQueryString } from '../helpers/queryString';

export function createUrlParser(eventManager) {
  return {
    checkUrlFragment(url) {
      const authResult = this.parseUrlFragment(url);

      if (isAuthResult(authResult)) {
        eventManager.fireEvent('authenticated', authResult);

        return true;
      }

      if (isErrorResponse(authResult)) {
        eventManager.fireEvent('authentication_failed', authResult);

        return true;
      }

      return false;
    },

    parseUrlFragment(url = '') {
      const separatorIndex = url.indexOf('#');

      if (separatorIndex >= 0) {
        const parsed = parseQueryString(url.substr(separatorIndex + 1));
        const expiresIn = parsed.expiresIn ? parseInt(parsed.expiresIn, 10) : undefined;

        if (isAuthResult(parsed)) {
          return {
            ...parsed,
            expiresIn
          };
        }

        return isErrorResponse(parsed) ? parsed : undefined;
      }
    }
  };
}
