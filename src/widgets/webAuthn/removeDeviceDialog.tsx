import React from 'react';

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
import { useI18n } from '@/contexts/i18n';

interface RemoveDeviceDialogProps {
    onConfirm: () => void;
}

/** Asks for confirmation before removing one device; each device owns its dialog. */
export const RemoveDeviceDialog = ({
    children,
    onConfirm,
}: React.PropsWithChildren<RemoveDeviceDialogProps>) => {
    const i18n = useI18n();

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {i18n('webauthn.registredDevices.confirm.removal')}
                    </AlertDialogTitle>
                    <AlertDialogDescription />
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{i18n('confirmation.cancel')}</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onConfirm}>
                        {i18n('remove')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
