import React, { forwardRef } from 'react';

import { Fingerprint, Mail, Smartphone, type LucideIcon } from 'lucide-react';

import { NavigationRow } from '@/components/list/navigationRow';
import { useI18n } from '@/contexts/i18n';

import type { AddableFactor } from '@/widgets/mfa/factors';

interface FactorDetails {
    Icon: LucideIcon;
    titleKey: string;
    descriptionKey: string;
}

const FACTOR_DETAILS: Record<AddableFactor, FactorDetails> = {
    passkey: {
        Icon: Fingerprint,
        titleKey: 'mfa.passkey',
        descriptionKey: 'mfa.passkey.description',
    },
    email: { Icon: Mail, titleKey: 'mfaList.email', descriptionKey: 'mfa.email.description' },
    sms: {
        Icon: Smartphone,
        titleKey: 'mfaList.phoneNumber',
        descriptionKey: 'mfa.phoneNumber.description',
    },
};

interface AddFactorRowProps {
    factor: AddableFactor;
    onOpen: () => void;
    /** A removal confirmation is open: the row is dimmed and inert. */
    dimmed?: boolean;
}

export const AddFactorRow = forwardRef<HTMLButtonElement, AddFactorRowProps>(function AddFactorRow(
    { factor, onOpen, dimmed },
    ref
) {
    const i18n = useI18n();
    const { Icon, titleKey, descriptionKey } = FACTOR_DETAILS[factor];

    return (
        <NavigationRow
            ref={ref}
            data-slot="widget-mfa-add-factor"
            icon={<Icon />}
            iconTone="muted"
            title={i18n(titleKey)}
            badge={
                factor === 'passkey' ? (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                        {i18n('mfa.factors.recommended')}
                    </span>
                ) : undefined
            }
            description={i18n(descriptionKey)}
            onOpen={onOpen}
            dimmed={dimmed}
        />
    );
});
