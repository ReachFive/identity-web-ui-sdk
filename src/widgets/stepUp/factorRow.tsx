import React, { forwardRef } from 'react';

import { Mail, Smartphone, type LucideIcon } from 'lucide-react';

import { NavigationRow } from '@/components/list/navigationRow';
import { useI18n } from '@/contexts/i18n';

import type { CodeFactor } from '@/widgets/stepUp/factors';

interface FactorDetails {
    Icon: LucideIcon;
    titleKey: string;
    descriptionKey: string;
}

const FACTOR_DETAILS: Record<CodeFactor, FactorDetails> = {
    email: { Icon: Mail, titleKey: 'mfaList.email', descriptionKey: 'mfa.email.description' },
    sms: {
        Icon: Smartphone,
        titleKey: 'mfaList.phoneNumber',
        descriptionKey: 'mfa.phoneNumber.description',
    },
};

interface StepUpFactorRowProps {
    factor: CodeFactor;
    onOpen: () => void;
    /** The code is being sent. */
    pending?: boolean;
}

export const StepUpFactorRow = forwardRef<HTMLButtonElement, StepUpFactorRowProps>(
    function StepUpFactorRow({ factor, onOpen, pending }, ref) {
        const i18n = useI18n();
        const { Icon, titleKey, descriptionKey } = FACTOR_DETAILS[factor];

        return (
            <NavigationRow
                ref={ref}
                data-slot="widget-step-up-factor"
                icon={<Icon />}
                iconTone="default"
                title={i18n(titleKey)}
                description={i18n(descriptionKey)}
                onOpen={onOpen}
                pending={pending}
            />
        );
    }
);
