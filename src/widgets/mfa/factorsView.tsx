import React, { useId, type ReactNode, type RefObject } from 'react';

import { Shield } from 'lucide-react';

import { ListEmpty } from '@/components/list/listItem';
import { Heading } from '@/components/miscComponent';
import { ItemGroup } from '@/components/ui/item';
import { useI18n } from '@/contexts/i18n';
import { AddFactorRow } from '@/widgets/mfa/addFactorRow';
import { credentialKey } from '@/widgets/mfa/credentials';
import { MfaCredentialRows, useMfaCredentialRemoval } from '@/widgets/mfa/mfaCredentialRows';
import { PASSKEYS_ROW_KEY, PasskeysRow } from '@/widgets/mfa/passkeysRow';

import type { OnError, OnSuccess } from '@/types';
import type { AddableFactor, FactorChoices } from '@/widgets/mfa/factors';

const addRowKey = (factor: AddableFactor) => `add-${factor}`;

/** Refs of the navigation rows, used to give the focus back on return. */
export interface FactorRowRefs {
    passkeys: RefObject<HTMLButtonElement>;
    add: Readonly<Record<AddableFactor, RefObject<HTMLButtonElement>>>;
}

interface FactorGroupProps {
    title: string;
    children: ReactNode;
}

const FactorGroup = ({ title, children }: FactorGroupProps) => {
    const headingId = useId();

    return (
        <div className="space-y-2">
            <div
                id={headingId}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
                {title}
            </div>
            <ItemGroup aria-labelledby={headingId} className="gap-2">
                {children}
            </ItemGroup>
        </div>
    );
};

interface FactorsViewProps {
    accessToken: string;
    choices: FactorChoices;
    removable: boolean;
    /** Focused on return when no row can take the focus. */
    titleRef: RefObject<HTMLDivElement>;
    rowRefs: FactorRowRefs;
    onOpenPasskeys: () => void;
    /** The Passkeys view is loading its devices. */
    openingPasskeys: boolean;
    onAdd: (factor: AddableFactor) => void;
    onSuccess: OnSuccess;
    onError: OnError;
}

/**
 * Choice screen: the enabled factors, then the ones the user can add. An empty group is hidden.
 */
export function FactorsView({
    accessToken,
    choices: { enabled, passkeyCount, addable },
    removable,
    titleRef,
    rowRefs,
    onOpenPasskeys,
    openingPasskeys,
    onAdd,
    onSuccess,
    onError,
}: FactorsViewProps) {
    const i18n = useI18n();
    const hasEnabled = enabled.length > 0 || passkeyCount > 0;
    const rowKeys = [
        ...enabled.map(credentialKey),
        ...(passkeyCount > 0 ? [PASSKEYS_ROW_KEY] : []),
        ...addable.map(addRowKey),
    ];
    const { focus, removal } = useMfaCredentialRemoval({
        accessToken,
        rowKeys,
        fixedControls: {
            [PASSKEYS_ROW_KEY]: rowRefs.passkeys,
            ...Object.fromEntries(addable.map(factor => [addRowKey(factor), rowRefs.add[factor]])),
        },
        onSuccess,
        onError,
    });
    const confirming = removal.confirmingKey !== null;

    return (
        <div className="space-y-4">
            <Heading
                ref={titleRef}
                role="heading"
                aria-level={2}
                tabIndex={-1}
                className="mb-0 outline-none"
            >
                {i18n('mfa.manageFactors.title')}
            </Heading>
            {hasEnabled && (
                <FactorGroup title={i18n('mfa.factors.enabled')}>
                    <MfaCredentialRows
                        credentials={enabled}
                        removable={removable}
                        focus={focus}
                        removal={removal}
                    />
                    {passkeyCount > 0 && (
                        <PasskeysRow
                            ref={rowRefs.passkeys}
                            count={passkeyCount}
                            dimmed={confirming}
                            onOpen={onOpenPasskeys}
                            pending={openingPasskeys}
                        />
                    )}
                </FactorGroup>
            )}
            {addable.length > 0 && (
                <FactorGroup title={i18n('mfa.factors.add')}>
                    {addable.map(factor => (
                        <AddFactorRow
                            key={factor}
                            ref={rowRefs.add[factor]}
                            factor={factor}
                            dimmed={confirming}
                            onOpen={() => onAdd(factor)}
                        />
                    ))}
                </FactorGroup>
            )}
            {!hasEnabled && addable.length === 0 && (
                <ListEmpty
                    ref={focus.emptyStateRef}
                    icon={<Shield />}
                    title={i18n('mfaList.empty')}
                />
            )}
        </div>
    );
}
