import React from 'react';

import { LoaderCircle, Mail, MessageSquareMore, X } from 'lucide-react';

import { MFA } from '@reachfive/identity-core';

import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item.tsx';

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
} from '../../components/ui/alert-dialog';
import { Button } from '../../components/ui/button';
import { createWidget } from '../../components/widget/widget';
import { useConfig } from '../../contexts/config';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive.tsx';
import { dateFormat } from '../../helpers/utils.ts';
import { OnError, OnSuccess } from '../../types';
import {
    CredentialsProviderProps,
    useCredentials,
    withCredentials,
} from './contexts/credentials.tsx';

type CredentialIconProps = {
    type: MFA.CredentialsResponse['credentials'][number]['type'];
};

const CredentialIcon = ({ type }: CredentialIconProps) => {
    switch (type) {
        case 'email':
            return <Mail className="bg-background w-icon h-icon stroke-textColor" />;
        case 'sms':
            return <MessageSquareMore className="bg-background w-icon h-icon stroke-textColor" />;
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
    credential: MFA.Credential;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onDeleteCallback: (credential: MFA.Credential) => void;
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

export const MfaList = withCredentials(
    ({
        accessToken,
        showRemoveMfaCredential,
        onError = (() => {}) as OnError,
        onSuccess = (() => {}) as OnSuccess,
    }: MfaListProps) => {
        const [isOpen, setIsOpen] = React.useState(false);
        const [loading, setLoading] = React.useState(false);
        const [deleteConfirmationTitle, setDeleteConfirmationTitle] = React.useState('');
        const i18n = useI18n();
        const config = useConfig();
        const client = useReachfive();
        const { credentials, refresh } = useCredentials();

        const refreshCredentials = async () => {
            setLoading(true);
            try {
                await refresh();
            } catch (error) {
                onError(error);
            } finally {
                setLoading(false);
            }
        };

        const onDelete = (credential: MFA.Credential) => {
            switch (credential.type) {
                case 'sms':
                    client
                        .removeMfaPhoneNumber({
                            accessToken,
                            phoneNumber: credential.phoneNumber,
                        })
                        .then(() => {
                            refreshCredentials();
                            onSuccess({ name: 'mfa_phone_number_deleted' });
                        })
                        .catch(onError);
                    break;
                case 'email':
                    client
                        .removeMfaEmail({ accessToken })
                        .then(() => {
                            refreshCredentials();
                            onSuccess({ name: 'mfa_email_deleted' });
                        })
                        .catch(onError);
                    break;
            }
        };

        if (loading) {
            return <LoaderCircle className="animate-spin" />;
        }

        return (
            <ItemGroup>
                {credentials.length === 0 && (
                    <Item>
                        <ItemContent>
                            <ItemTitle>{i18n('mfaList.noCredentials')}</ItemTitle>
                        </ItemContent>
                    </Item>
                )}
                {credentials.map((credential, _) => (
                    <Item
                        variant="outline"
                        id={`credential-${credential.friendlyName}`}
                        data-testid="credential"
                        key={`credential-${credential.friendlyName}`}
                        className={`${isOpen ? 'opacity-15' : ''}`}
                    >
                        <ItemMedia className="!self-center" variant="image">
                            <CredentialIcon type={credential.type} />
                        </ItemMedia>
                        <ItemContent>
                            <ItemTitle>{credential.friendlyName}</ItemTitle>
                            <ItemDescription>
                                {MFA.isEmailCredential(credential)
                                    ? credential.email
                                    : MFA.isPhoneCredential(credential)
                                      ? credential.phoneNumber
                                      : 'N/A'}
                            </ItemDescription>
                            <ItemDescription>
                                <span>{i18n('mfaList.createdAt')}&nbsp;: </span>
                                <time dateTime={credential.createdAt}>
                                    {dateFormat(credential.createdAt, config.language)}
                                </time>
                            </ItemDescription>
                        </ItemContent>
                        {showRemoveMfaCredential && (
                            <ItemActions>
                                <DeleteButton
                                    isOpen={isOpen}
                                    setIsOpen={setIsOpen}
                                    onDeleteCallback={onDelete}
                                    deleteConfirmationTitle={deleteConfirmationTitle}
                                    setDeleteConfirmationTitle={setDeleteConfirmationTitle}
                                    credential={credential}
                                />
                            </ItemActions>
                        )}
                    </Item>
                ))}
            </ItemGroup>
        );
    }
);

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

export default createWidget<MfaListWidgetProps, MfaListProps & CredentialsProviderProps>({
    component: MfaList,
    prepare: async (options, { apiClient }) => {
        try {
            const { credentials } = await apiClient.listMfaCredentials(options.accessToken);
            options.onSuccess?.({
                name: 'mfa_credentials_listed',
                credentials,
            });
            return {
                ...options,
                credentials,
            };
        } catch (error) {
            options.onError?.(error);
            throw error;
        }
    },
});
