import React from 'react';

import { useI18n } from '@/contexts/i18n';

/** The "Recommended" tag shown next to the passkey. */
export function RecommendedBadge() {
    const i18n = useI18n();
    return (
        <span className="rounded bg-success/10 px-1.5 py-0.5 text-xs font-medium text-success">
            {i18n('mfa.factors.recommended')}
        </span>
    );
}
