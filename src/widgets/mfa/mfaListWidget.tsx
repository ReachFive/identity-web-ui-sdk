import React, {useEffect} from 'react';
import { MFA } from '@reachfive/identity-core'

import { createWidget } from '../../components/widget/widget';

import { useI18n } from '../../contexts/i18n';
import { useConfig } from '../../contexts/config';
import { dateFormat } from "../../helpers/utils.ts";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
    AlertDialogDescription
} from "../../components/ui/alert-dialog"
import { Button } from "../../components/ui/button"
import { useReachfive } from "../../contexts/reachfive.tsx";
import { X, MessageSquareMore, Mail } from "lucide-react";
import { OnError, OnSuccess  } from "../../types";

const credentialIconByType = (type: MFA.CredentialsResponse['credentials'][number]['type']) => {
    switch (type) {
        case 'email':
            return <Mail className="bg-background w-icon h-icon stroke-textColor" />
        case 'sms':
            return <MessageSquareMore className="bg-background w-icon h-icon stroke-textColor" />
    }
}

export interface MfaListProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string
    /**
     * Callback function called when the request has succeeded.
     */
    onSuccess?: OnSuccess
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError
    /**
     * Indicates whether delete mfa credential button is displayed
     */
    showRemoveMfaCredential?: boolean
}

interface DeleteButtonProps {
    credential: MFA.Credential
}
export const MfaList = ({
    accessToken,
    showRemoveMfaCredential,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess
    }: MfaListProps) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [deleteConfirmationTitle, setDeleteConfirmationTitle] = React.useState('')
    const [credentials, setCredentials] = React.useState<MFA.Credential[]>([])
    const i18n = useI18n()
    const config = useConfig()
    const client = useReachfive()

    const fetchMfaCredentials = () => {
        setLoading(true)
        client.listMfaCredentials(accessToken)
            .then(mfaCredentialsResponse => {
                setCredentials(mfaCredentialsResponse.credentials)
                onSuccess(mfaCredentialsResponse)
            })
            .catch(onError)
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        fetchMfaCredentials()
    }, [accessToken]);

    const onDelete = (credential: MFA.Credential) => {
        switch (credential.type) {
            case "sms":
                client.removeMfaPhoneNumber({
                    accessToken,
                    phoneNumber: credential.phoneNumber
                })
                    .then(resp => {
                        fetchMfaCredentials()
                        onSuccess(resp)
                    })
                    .catch(onError)
                break
            case 'email':
                client.removeMfaEmail({accessToken})
                    .then(resp => {
                        fetchMfaCredentials()
                        onSuccess(resp)
                    })
                    .catch(onError)
                break
        }
    }

        const DeleteButton = ({ credential }: DeleteButtonProps) => {
            return (
                <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            size="icon"
                            className="ml-1"
                            onClick={_ => setDeleteConfirmationTitle(credential.type === 'email' ? 'mfa.remove.email': 'mfa.remove.phoneNumber' )}>
                            <X />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {i18n(deleteConfirmationTitle)}
                            </AlertDialogTitle>
                            <AlertDialogDescription />
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{i18n('confirmation.cancel')}</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" onClick={_ => onDelete(credential)}>{i18n('confirmation.yes')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )
        }

    if(loading) {
        return <></>
    }

    return (
        <div>
            {(credentials.length === 0) && (
                <div className="text-textColor mb-1 text-center">{i18n('mfaList.noCredentials')}</div>
            )}
            {credentials.map((credential, index) => (
                <div id={`credential-${index}`} key={`credential-${index}`} className={`flex flex-col ${isOpen ? 'opacity-15' : ''}`}>
                    <div id={`toModify-${index}`} className="flex flex-row items-center rounded">
                        <div className="flex flex-row basis-full items-center rounded align-middle whitespace-nowrap box-border p-generic border-solid border-generic border-border" >
                            {credentialIconByType(credential.type)}
                            <div className="ml-innerBlock w-max justify-items-stretch text-textColor">
                                <div className="font-bold">{credential.friendlyName}</div>
                                <div>{MFA.isEmailCredential(credential) ? credential.email : MFA.isPhoneCredential(credential) ? credential.phoneNumber : 'N/A'}</div>
                                <div>
                                    <span>{i18n('mfaList.createdAt')}&nbsp;: </span>
                                    <time dateTime={credential.createdAt}>{dateFormat(credential.createdAt, config.language)}</time>
                                </div>
                            </div>
                        </div>
                        {showRemoveMfaCredential && <DeleteButton credential={credential}/>}
                    </div>
                </div>
            ))}
        </div>
    );
}

export type MfaListWidgetProps = {
     /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string
    /**
     * Callback function called when the request has succeeded.
     */
    onSuccess?: OnSuccess
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError
    /**
     * Indicates whether delete mfa credential button is displayed
     */
    showRemoveMfaCredential?: boolean
}

export default createWidget<MfaListWidgetProps, MfaListProps>({
    component: MfaList,
});
