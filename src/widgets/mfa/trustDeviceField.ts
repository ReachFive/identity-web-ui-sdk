import { useMemo } from 'react';

import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { formatDays } from '@/helpers/duration';
import { type Field } from '@/lib/form';

/** The "trust this device" text, with how long the device stays trusted when the tenant sets it. */
export function useTrustDeviceLabel(): string {
    const { trustedDeviceLifetime, language } = useConfig();
    const i18n = useI18n();
    return trustedDeviceLifetime
        ? i18n('mfa.trustDevice.forDuration', {
              duration: formatDays(trustedDeviceLifetime, language),
          })
        : i18n('mfa.stepUp.trustDevice');
}

/** The trust checkbox of a code form, ticked at first when `defaultChecked`. */
export function useTrustDeviceField(defaultChecked = false): Field {
    const label = useTrustDeviceLabel();
    return useMemo(
        () => ({
            key: 'trust_device',
            type: 'checkbox',
            label,
            defaultChecked,
            required: false,
        }),
        [label, defaultChecked]
    );
}
