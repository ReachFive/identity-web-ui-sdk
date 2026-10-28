import React, { useEffect, useRef } from 'react';

import { LucideIcon, Mail, Smartphone, X } from 'lucide-react';

import { MFA } from '@reachfive/identity-core';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ItemActions, ItemGroup } from '@/components/ui/item.tsx';
import { createQueryWidget, WidgetSpinner } from '@/components/widget/queryWidget';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { dateFormat } from '@/helpers/utils.ts';
import { OnError, OnSuccess } from '@/types';
import {
    MfaCredentialContent,
    MfaCredentialIcon,
    MfaCredentialItem,
    MfaCredentialsEmpty,
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

interface DeleteButtonProps {
    credential: EmailOrPhoneCredential;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onDeleteCallback: (credential: EmailOrPhoneCredential) => void;
    deleteConfirmationTitle: string;
    setDeleteConfirmationTitle: React.Dispatch<React.SetStateAction<string>>;
}

const DeleteButton = ({
    credential,
    isOpen,
    setIsOpen,
    onDeleteCallback,
    deleteConfirmationTitle,
    setDeleteConfirmationTitle,
}: DeleteButtonProps) => {
    const i18n = useI18n();

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="icon"
                    className="ml-1"
                    onClick={_ =>
                        setDeleteConfirmationTitle(
                            credential.type === 'email'
                                ? 'mfa.remove.email'
                                : 'mfa.remove.phoneNumber'
                        )
                    }
                    aria-label={
                        credential.type === 'email' ? 'mfa.remove.email' : 'mfa.remove.phoneNumber'
                    }
                >
                    <X />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{i18n(deleteConfirmationTitle)}</AlertDialogTitle>
                    <AlertDialogDescription />
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{i18n('confirmation.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={_ => onDeleteCallback(credential)}
                    >
                        {i18n('confirmation.yes')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

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

export const MfaList = ({
    accessToken,
    showRemoveMfaCredential,
    onError = noop as OnError,
    onSuccess = noop as OnSuccess,
}: MfaListProps) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [deleteConfirmationTitle, setDeleteConfirmationTitle] = React.useState('');
    const i18n = useI18n();
    const config = useConfig();
    const {
        data: { credentials },
    } = useMfaCredentials(accessToken);
    const removal = useRemoveMfaCredential({ accessToken, onSuccess, onError });

    useCredentialsListedEvent(credentials, onSuccess);

    const emailAndPhoneCredentials = credentials.filter(isEmailOrPhoneCredential);
    const passkeyCount = credentials.filter(isPasskeyCredential).length;

    if (removal.isPending) {
        return <WidgetSpinner />;
    }

    if (credentials.length === 0) {
        return <MfaCredentialsEmpty />;
    }

    return (
        <ItemGroup className="gap-2">
            {emailAndPhoneCredentials.map(credential => {
                const { identifier, labelKey, Icon } = credentialDetails(credential);
                return (
                    <MfaCredentialItem
                        id={`credential-${credential.friendlyName}`}
                        key={`credential-${credential.friendlyName}`}
                        className={isOpen ? 'opacity-15' : undefined}
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
                        {showRemoveMfaCredential && (
                            <ItemActions>
                                <DeleteButton
                                    isOpen={isOpen}
                                    setIsOpen={setIsOpen}
                                    onDeleteCallback={removal.mutate}
                                    deleteConfirmationTitle={deleteConfirmationTitle}
                                    setDeleteConfirmationTitle={setDeleteConfirmationTitle}
                                    credential={credential}
                                />
                            </ItemActions>
                        )}
                    </MfaCredentialItem>
                );
            })}
            {passkeyCount > 0 && <PasskeysRow count={passkeyCount} />}
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
