import React, { useEffect } from 'react';

import { format } from 'date-fns';
import {
    CircleHelpIcon,
    LoaderCircle,
    Gamepad2Icon,
    MonitorIcon,
    SmartphoneIcon,
    WatchIcon,
    X,
} from 'lucide-react';

import { TrustedDevice, TrustedDeviceMetadata } from '@reachfive/identity-core';

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
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '../../components/ui/item';
import { createWidget } from '../../components/widget/widget.tsx';
import { useI18n } from '../../contexts/i18n.tsx';
import { useReachfive } from '../../contexts/reachfive.tsx';
import { OnError, OnSuccess } from '../../types';

export type TrustedDeviceWidgetProps = {
    accessToken: string;

    showRemoveTrustedDevice?: boolean;

    onError?: OnError;

    onSuccess?: OnSuccess;
};

export interface TrustedDeviceProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;

    /**
     * Indicates whether the delete trusted device button is displayed
     */
    showRemoveTrustedDevice?: boolean;

    /**
     * Callback function called when the request has succeeded.
     */
    onSuccess?: OnSuccess;

    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

interface DeleteButtonProps {
    device: TrustedDevice;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onDeleteCallback: (device: TrustedDevice) => void;
}

const DeleteDialog = ({
    children,
    device,
    isOpen,
    setIsOpen,
    onDeleteCallback,
}: React.PropsWithChildren<DeleteButtonProps>) => {
    const i18n = useI18n();

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{i18n('trustDevice.delete.confirmation')}</AlertDialogTitle>
                    <AlertDialogDescription />
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{i18n('confirmation.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={_ => onDeleteCallback(device)}
                    >
                        {i18n('confirmation.yes')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

/**
 * @see https://github.com/nielsbasjes/yauaa/blob/main/analyzer/src/main/java/nl/basjes/parse/useragent/classify/DeviceClass.java
 */
function DeviceClassIcon({ deviceClass }: { deviceClass: TrustedDeviceMetadata['deviceClass'] }) {
    const normalizedDeviceClass = deviceClass?.toLocaleLowerCase();
    if (!normalizedDeviceClass) {
        return <CircleHelpIcon />;
    } else if (normalizedDeviceClass === 'desktop') {
        return <MonitorIcon />;
    } else if (['mobile', 'tablet', 'phone'].includes(normalizedDeviceClass)) {
        return <SmartphoneIcon />;
    } else if (normalizedDeviceClass === 'watch') {
        return <WatchIcon />;
    } else if (['game console', 'handheld game console'].includes(normalizedDeviceClass)) {
        return <Gamepad2Icon />;
    } else return <CircleHelpIcon />;
}

export const TrustedDeviceList = ({
    accessToken,
    showRemoveTrustedDevice,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: TrustedDeviceProps) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [trustedDevices, setTrustedDevices] = React.useState<TrustedDevice[]>([]);
    const [loading, setLoading] = React.useState(true);

    const i18n = useI18n();
    const client = useReachfive();

    const fetchTrustedDevices = () => {
        setLoading(true);
        client
            .listTrustedDevices(accessToken)
            .then(response => {
                setTrustedDevices(response.trustedDevices);
                onSuccess({ name: 'mfa_trusted_device_listed', devices: response.trustedDevices });
            })
            .catch(onError)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTrustedDevices();
    }, [accessToken]);

    const onDelete = (device: TrustedDevice) => {
        client
            .removeTrustedDevice({
                accessToken: accessToken,
                trustedDeviceId: device.id,
            })
            .then(() => {
                fetchTrustedDevices();
                onSuccess({ name: 'mfa_trusted_device_deleted', device });
            })
            .catch(onError);
    };

    if (loading) {
        return <LoaderCircle className="animate-spin" />;
    }

    return (
        <div>
            {trustedDevices.length === 0 && (
                <div className="mb-1 text-center text-theme">{i18n('trustedDevices.empty')}</div>
            )}
            <div className="flex w-full max-w-md flex-col gap-4">
                {trustedDevices.map((trustedDevice, _) => (
                    <Item
                        key={trustedDevice.id}
                        role="listitem"
                        variant="outline"
                        className={isOpen ? 'opacity-15' : ''}
                    >
                        <ItemMedia>
                            <DeviceClassIcon deviceClass={trustedDevice.metadata.deviceClass} />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                            <ItemTitle>
                                {trustedDevice.metadata.operatingSystem} -{' '}
                                {trustedDevice.metadata.userAgent}
                            </ItemTitle>
                            <ItemTitle>{trustedDevice.metadata.ip}</ItemTitle>
                            <ItemDescription>
                                <span>{i18n('mfaList.createdAt')}&nbsp;: </span>
                                <time dateTime={trustedDevice.createdAt}>
                                    {format(trustedDevice.createdAt, 'PP')}
                                </time>
                            </ItemDescription>
                        </ItemContent>
                        {showRemoveTrustedDevice && (
                            <ItemActions>
                                <DeleteDialog
                                    device={trustedDevice}
                                    isOpen={isOpen}
                                    setIsOpen={setIsOpen}
                                    onDeleteCallback={onDelete}
                                >
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="rounded-full"
                                    >
                                        <X />
                                    </Button>
                                </DeleteDialog>
                            </ItemActions>
                        )}
                    </Item>
                ))}
            </div>
        </div>
    );
};

export default createWidget<TrustedDeviceWidgetProps, TrustedDeviceProps>({
    component: TrustedDeviceList,
});
