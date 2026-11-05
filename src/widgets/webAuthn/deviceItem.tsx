import React from 'react';

import { TrashIcon } from 'lucide-react';

import type { DeviceCredential } from '@reachfive/identity-core';

import { Button } from '@/components/ui/button';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { dateFormat } from '@/helpers/utils';

import { getProviderData } from './providerData';
import { RemoveDeviceDialog } from './removeDeviceDialog';

interface DeviceItemProps {
    device: DeviceCredential;
    removeWebAuthnDevice: (id: string) => void;
}

export const DeviceItem = ({ device, removeWebAuthnDevice }: DeviceItemProps) => {
    const i18n = useI18n();
    const config = useConfig();
    const { id, friendlyName, createdAt, lastUsedAt, aaguid } = device;
    const [provider, Icon] = getProviderData(aaguid ?? '');

    return (
        <Item data-testid="device" variant="outline">
            <ItemMedia
                variant="icon"
                className="group-has-[[data-slot=item-description]]/item:self-center"
            >
                <Icon className="size-8" />
            </ItemMedia>
            <ItemContent>
                <ItemTitle data-testid="device-name">{friendlyName}</ItemTitle>
                {provider && (
                    <ItemDescription data-testid="device-provider">{provider}</ItemDescription>
                )}
                {createdAt && (
                    <ItemDescription data-testid="device-created-at">
                        {i18n('webauthn.registredDevices.createdAt')}:&nbsp;
                        <time dateTime={createdAt}>
                            {dateFormat(createdAt, config.language, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            })}
                        </time>
                    </ItemDescription>
                )}
                {lastUsedAt && (
                    <ItemDescription data-testid="device-last-used-at">
                        {i18n('webauthn.registredDevices.lastUsedAt')}:&nbsp;
                        <time dateTime={lastUsedAt}>
                            {dateFormat(lastUsedAt, config.language, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            })}
                        </time>
                    </ItemDescription>
                )}
            </ItemContent>
            <ItemActions>
                <RemoveDeviceDialog onConfirm={() => removeWebAuthnDevice(id)}>
                    <Button
                        size="icon-sm"
                        variant="destructive"
                        className="rounded-full"
                        aria-label={i18n('remove')}
                        title={i18n('remove')}
                        data-testid="device-remove"
                    >
                        <TrashIcon />
                    </Button>
                </RemoveDeviceDialog>
            </ItemActions>
        </Item>
    );
};
