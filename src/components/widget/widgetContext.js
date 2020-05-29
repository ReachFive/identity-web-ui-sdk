import PropTypes from 'prop-types';
import { getContext } from '@hypnosphi/recompose';

export const withTheme = getContext({ theme: PropTypes.object.isRequired });
export const withI18n = getContext({ i18n: PropTypes.func.isRequired });
export const withConfig = getContext({ config: PropTypes.object.isRequired });
export const withApiClient = getContext({ apiClient: PropTypes.object.isRequired });
export const withGoTo = getContext({ goTo: PropTypes.func.isRequired });
