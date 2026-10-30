import React, { type RefCallback } from 'react';

import { Trash2 } from 'lucide-react';

import {
    dimmedRowProps,
    ListItem,
    ListItemContent,
    ListItemIcon,
} from '@/components/list/listItem';
import { RemovalConfirmation } from '@/components/list/removalConfirmation';
import { Button } from '@/components/ui/button';
import { ItemActions } from '@/components/ui/item';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { dateFormat } from '@/helpers/utils';
import { credentialDetails, type MfaCredential } from '@/widgets/mfa/credentials';

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
    credential: MfaCredential;
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
            <ListItemIcon>
                <Icon />
            </ListItemIcon>
            <ListItemContent
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
 * One MFA credential row (email, phone number, …). Its trash button turns it in place into a confirmation.
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
        <ListItem
            data-slot="widget-mfa-credential"
            id={`credential-${summary.credential.friendlyName}`}
            {...dimmedRowProps(dimmed, confirming ? 'border-0 p-0' : undefined)}
        >
            {confirming ? (
                <RemovalConfirmation
                    data-slot="widget-mfa-credential-confirm"
                    question={i18n('mfaList.removeConfirmation', { identifier })}
                    icon={<Icon />}
                    cancelLabel={i18n('mfaList.cancel')}
                    removeLabel={i18n('mfaList.remove')}
                    pending={pending}
                    onCancel={onCancel}
                    onConfirm={onConfirm}
                />
            ) : (
                <CredentialSummary {...summary} />
            )}
        </ListItem>
    );
};
