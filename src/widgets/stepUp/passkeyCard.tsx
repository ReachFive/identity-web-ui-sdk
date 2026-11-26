import React from 'react';

import { Fingerprint } from 'lucide-react';

import { NavigationRow } from '@/components/list/navigationRow';
import { RecommendedBadge } from '@/components/list/recommendedBadge';
import { useI18n } from '@/contexts/i18n';

interface PasskeyCardProps {
    onOpen: () => void;
}

/** The passkey, offered first in a step-up. */
export function PasskeyCard({ onOpen }: PasskeyCardProps) {
    const i18n = useI18n();
    return (
        <NavigationRow
            data-slot="widget-step-up-passkey"
            emphasized
            icon={<Fingerprint />}
            title={i18n('mfa.stepUp.usePasskey')}
            badge={<RecommendedBadge />}
            description={i18n('mfa.passkey.description')}
            onOpen={onOpen}
        />
    );
}
