import React, {useEffect} from 'react';
import {TrustedDevice} from "@reachfive/identity-core";
import {createWidget} from "../../components/widget/widget.tsx";
import {useI18n} from "../../contexts/i18n.tsx";
import {dateFormat} from "../../helpers/utils.ts";
import {useConfig} from "../../contexts/config.tsx";
import {useReachfive} from "../../contexts/reachfive.tsx";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "../../components/ui/alert-dialog"
import {Button} from "../../components/ui/button"
import {X} from "lucide-react";

export type TrustedDeviceWidgetProps = {
    accessToken: string

    showRemoveTrustedDevice?: boolean

    onError?: (error?: unknown) => void

    onSuccess?: () => void
}

export interface TrustedDeviceProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string

    /**
     * Indicates whether the delete trusted device button is displayed
     */
    showRemoveTrustedDevice?: boolean

    /**
     * Callback function called when the request has succeeded.
     */
    onSuccess?: () => void

    /**
     * Callback function called when the request has failed.
     */
    onError?: (error?: unknown) => void
}

interface DeleteButtonProps {
    device: TrustedDevice
}

export const TrustedDeviceList = ({
    accessToken,
    showRemoveTrustedDevice,
    onError = (_) => {},
    onSuccess = () => {}
}: TrustedDeviceProps) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [trustedDevices, setTrustedDevices] = React.useState<TrustedDevice[]>([])
    const [loading, setLoading] = React.useState(true)

    const i18n = useI18n()
    const config = useConfig()
    const client = useReachfive()

    const fetchTrustedDevices = () => {
        setLoading(true)
        client.listTrustedDevices(accessToken)
            .then(trustedDevicesResponse => {
                setTrustedDevices(trustedDevicesResponse.trustedDevices)
                setLoading(false)
                onSuccess()
            })
            .catch(onError)
    }

    useEffect(() => {
        fetchTrustedDevices()
    }, [accessToken]);

    const onDelete = (device: TrustedDevice) => {
        client
            .removeTrustedDevice
            ({
                accessToken: accessToken,
                trustedDeviceId: device.id
            })
            .then(_ => {
                fetchTrustedDevices()
                onSuccess()
            })
            .catch(onError)
    }

    const DeleteButton = ({ device }: DeleteButtonProps)  => {
        return (
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="ml-1"><X/></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {i18n('trustDevice.delete.confirmation')}
                        </AlertDialogTitle>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{i18n('confirmation.cancel')}</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={_ => onDelete(device)}>{i18n('confirmation.yes')}</AlertDialogAction>
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
            {(trustedDevices.length === 0) && (
                <div className="text-textColor mb-1 text-center">{i18n('trustedDevices.empty')}</div>
            )}
            {trustedDevices.map((trustedDevice, index) => (
                <div id={`trusted-device-${index}`} key={`trusted-device-${index}`}
                     className={`flex items-center ${isOpen ? 'opacity-15' : ''}`}>
                    <div
                        className="flex flex-col items-center basis-full line-height-1 align-middle whitespace-nowrap box-border p-[calc(var(--padding-y)*1px)] border-solid border-[calc(var(--border-width)*1px)] rounded-[calc(var(--border-radius)*1px)]">
                        <div className="font-bold ">{trustedDevice.metadata.deviceName}</div>
                        <div className="font-bold">{trustedDevice.metadata.ip}</div>
                        <div className="font-bold">{trustedDevice.metadata.deviceClass}</div>
                        <div className="font-bold">{trustedDevice.metadata.operatingSystem}</div>
                        <div className="font-bold">{trustedDevice.metadata.userAgent}</div>
                        <div>
                            <span>{i18n('mfaList.createdAt')}&nbsp;: </span>
                            <time
                                dateTime={trustedDevice.createdAt}>{dateFormat(trustedDevice.createdAt, config.language)}</time>
                        </div>
                    </div>
                    {showRemoveTrustedDevice && <DeleteButton device={trustedDevice}/>}
                </div>
            ))}
        </div>
    );
}

export default createWidget<TrustedDeviceWidgetProps, TrustedDeviceProps>({
    component: TrustedDeviceList,
})
