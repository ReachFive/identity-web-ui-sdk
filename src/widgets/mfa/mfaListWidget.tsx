import React, { useEffect, useRef, useState } from 'react';

import { LucideIcon, Mail, Smartphone, Trash2 } from 'lucide-react';

import { MFA } from '@reachfive/identity-core';

import { Button } from '@/components/ui/button';
import { ItemActions, ItemGroup } from '@/components/ui/item.tsx';
import { createQueryWidget } from '@/components/widget/queryWidget';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { dateFormat } from '@/helpers/utils.ts';
import { OnError, OnSuccess } from '@/types';
import { MfaCredentialConfirmation } from '@/widgets/mfa/mfaCredentialConfirmation';
import {
    MfaCredentialContent,
    MfaCredentialIcon,
    MfaCredentialItem,
    MfaCredentialsEmpty,
    inertProps,
} from '@/widgets/mfa/mfaCredentialItem';
import {
    EmailOrPhoneCredential,
    isEmailOrPhoneCredential,
    isPasskeyCredential,
} from '@/widgets/mfa/passkeyCredential';
import { PasskeysRow } from '@/widgets/mfa/passkeysRow';
import { useMfaCredentials, useRemoveMfaCredential } from '@/widgets/mfa/queries';

interface CredentialDetails {
    identifier: string;
    labelKey: string;
    Icon: LucideIcon;
}

const credentialDetails = (credential: EmailOrPhoneCredential): CredentialDetails => {
    switch (credential.type) {
        case 'email':
            return { identifier: credential.email, labelKey: 'mfaList.email', Icon: Mail };
        case 'sms':
            return {
                identifier: credential.phoneNumber,
                labelKey: 'mfaList.phoneNumber',
                Icon: Smartphone,
            };
    }
};

export interface MfaListProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Callback function called when the request has succeeded.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Indicates whether delete mfa credential button is displayed
     */
    showRemoveMfaCredential?: boolean;
}

const noop = () => {};

/**
 * Fires `mfa_credentials_listed` once, on the first successful load, and not on later refetches.
 */
const useCredentialsListedEvent = (credentials: MFA.Credential[], onSuccess: OnSuccess) => {
    const listed = useRef(false);

    useEffect(() => {
        if (listed.current) return;
        listed.current = true;
        onSuccess({ name: 'mfa_credentials_listed', credentials });
    }, [credentials, onSuccess]);
};

const credentialKey = (credential: EmailOrPhoneCredential) =>
    `${credential.type}-${credential.friendlyName}`;

const removeLabelKey = (credential: EmailOrPhoneCredential) =>
    credential.type === 'email' ? 'mfa.remove.email' : 'mfa.remove.phoneNumber';

interface MfaCredentialRowProps {
    credential: EmailOrPhoneCredential;
    removable: boolean;
    /** This row shows its removal confirmation. */
    confirming: boolean;
    /** Another row shows its removal confirmation: this one is dimmed and inert. */
    dimmed: boolean;
    pending: boolean;
    onRequestRemoval: () => void;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * One email or phone number row. Its trash button turns it in place into a confirmation; when
 * the confirmation closes without removing the factor, focus goes back to the trash button.
 */
const MfaCredentialRow = ({
    credential,
    removable,
    confirming,
    dimmed,
    pending,
    onRequestRemoval,
    onCancel,
    onConfirm,
}: MfaCredentialRowProps) => {
    const i18n = useI18n();
    const config = useConfig();
    const trashButton = useRef<HTMLButtonElement>(null);
    const wasConfirming = useRef(confirming);
    const { identifier, labelKey, Icon } = credentialDetails(credential);

    useEffect(() => {
        if (wasConfirming.current && !confirming) trashButton.current?.focus();
        wasConfirming.current = confirming;
    }, [confirming]);

    if (confirming) {
        return (
            <MfaCredentialItem
                id={`credential-${credential.friendlyName}`}
                className="border-0 p-0"
            >
                <MfaCredentialConfirmation
                    question={i18n('mfaList.removeConfirmation', { identifier })}
                    icon={<Icon />}
                    pending={pending}
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                />
            </MfaCredentialItem>
        );
    }

    return (
        <MfaCredentialItem
            id={`credential-${credential.friendlyName}`}
            className={dimmed ? 'opacity-45' : undefined}
            {...inertProps(dimmed)}
        >
            <MfaCredentialIcon>
                <Icon />
            </MfaCredentialIcon>
            <MfaCredentialContent
                title={identifier}
                descriptions={[
                    i18n(labelKey),
                    i18n('mfaList.createdOn', {
                        date: dateFormat(credential.createdAt, config.language),
                    }),
                ]}
            />
            {removable && (
                <ItemActions>
                    <Button
                        ref={trashButton}
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={removeLabelKey(credential)}
                        onClick={onRequestRemoval}
                    >
                        <Trash2 aria-hidden="true" />
                    </Button>
                </ItemActions>
            )}
        </MfaCredentialItem>
    );
};

export const MfaList = ({
    accessToken,
    showRemoveMfaCredential = false,
    onError = noop as OnError,
    onSuccess = noop as OnSuccess,
}: MfaListProps) => {
    /** Key of the row showing its removal confirmation; only one at a time. */
    const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
    const {
        data: { credentials },
    } = useMfaCredentials(accessToken);
    const removal = useRemoveMfaCredential({ accessToken, onSuccess, onError });

    useCredentialsListedEvent(credentials, onSuccess);

    const emailAndPhoneCredentials = credentials.filter(isEmailOrPhoneCredential);
    const passkeyCount = credentials.filter(isPasskeyCredential).length;
    const confirmationOpen = confirmingKey !== null;

    const closeConfirmation = () => setConfirmingKey(null);

    const remove = (credential: EmailOrPhoneCredential) => {
        if (removal.isPending) return;
        // Settled covers both outcomes: on success the row is already gone from the refetched
        // list, on error it returns to normal with the factor kept.
        removal.mutate(credential, { onSettled: closeConfirmation });
    };

    if (credentials.length === 0) {
        return <MfaCredentialsEmpty />;
    }

    return (
        <ItemGroup className="gap-2">
            {emailAndPhoneCredentials.map(credential => {
                const key = credentialKey(credential);
                return (
                    <MfaCredentialRow
                        key={key}
                        credential={credential}
                        removable={showRemoveMfaCredential}
                        confirming={confirmingKey === key}
                        dimmed={confirmationOpen && confirmingKey !== key}
                        pending={removal.isPending}
                        onRequestRemoval={() => setConfirmingKey(key)}
                        onCancel={closeConfirmation}
                        onConfirm={() => remove(credential)}
                    />
                );
            })}
            {passkeyCount > 0 && <PasskeysRow count={passkeyCount} dimmed={confirmationOpen} />}
        </ItemGroup>
    );
};

export type MfaListWidgetProps = {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Callback function called when the request has succeeded.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Indicates whether delete mfa credential button is displayed
     */
    showRemoveMfaCredential?: boolean;
};

export default createQueryWidget<MfaListWidgetProps>({
    component: MfaList,
});
