import React, { type RefCallback } from 'react';

import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ItemActions } from '@/components/ui/item';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { dateFormat } from '@/helpers/utils';
import { credentialDetails, type EmailOrPhoneCredential } from '@/widgets/mfa/credentials';
import { MfaCredentialConfirmation } from '@/widgets/mfa/mfaCredentialConfirmation';
import {
    MfaCredentialContent,
    MfaCredentialIcon,
    MfaCredentialItem,
    dimmedRowProps,
} from '@/widgets/mfa/mfaCredentialItem';

/** Placeholder the translated label is split around, to put the date in a `<time>` element. */
const DATE_PLACEHOLDER = '\u0000';

/** "Created on {date}", with the date as a machine-readable `<time>` element. */
const CreatedOn = ({ createdAt }: { createdAt: string }) => {
    const i18n = useI18n();
    const config = useConfig();
    const [before, after = ''] = i18n('mfaList.createdOn', { date: DATE_PLACEHOLDER }).split(
        DATE_PLACEHOLDER
    );

    return (
        <>
            {before}
            <time dateTime={createdAt}>{dateFormat(createdAt, config.language)}</time>
            {after}
        </>
    );
};

interface CredentialSummaryProps {
    credential: EmailOrPhoneCredential;
    removable: boolean;
    trashRef: RefCallback<HTMLElement>;
    onRequestRemoval: () => void;
}

/** The content of a row at rest: icon, identifier, type, creation date and trash button. */
const CredentialSummary = ({
    credential,
    removable,
    trashRef,
    onRequestRemoval,
}: CredentialSummaryProps) => {
    const i18n = useI18n();
    const { identifier, labelKey, removeLabelKey, Icon } = credentialDetails(credential);

    return (
        <>
            <MfaCredentialIcon>
                <Icon />
            </MfaCredentialIcon>
            <MfaCredentialContent
                title={identifier}
                descriptions={[
                    i18n(labelKey),
                    <CreatedOn key="createdOn" createdAt={credential.createdAt} />,
                ]}
            />
            {removable && (
                <ItemActions>
                    <Button
                        ref={trashRef}
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={i18n(removeLabelKey)}
                        onClick={onRequestRemoval}
                    >
                        <Trash2 aria-hidden="true" />
                    </Button>
                </ItemActions>
            )}
        </>
    );
};

interface MfaCredentialRowProps extends CredentialSummaryProps {
    /** This row shows its removal confirmation. */
    confirming: boolean;
    /** Another row shows its removal confirmation: this one is dimmed and inert. */
    dimmed: boolean;
    pending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * One email or phone number row. Its trash button turns it in place into a confirmation.
 */
export const MfaCredentialRow = ({
    confirming,
    dimmed,
    pending,
    onCancel,
    onConfirm,
    ...summary
}: MfaCredentialRowProps) => {
    const i18n = useI18n();
    const { identifier, Icon } = credentialDetails(summary.credential);

    return (
        <MfaCredentialItem
            id={`credential-${summary.credential.friendlyName}`}
            {...dimmedRowProps(dimmed, confirming ? 'border-0 p-0' : undefined)}
        >
            {confirming ? (
                <MfaCredentialConfirmation
                    question={i18n('mfaList.removeConfirmation', { identifier })}
                    icon={<Icon />}
                    pending={pending}
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                />
            ) : (
                <CredentialSummary {...summary} />
            )}
        </MfaCredentialItem>
    );
};
