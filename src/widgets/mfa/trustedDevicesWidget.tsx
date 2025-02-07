import React, {useEffect} from 'react';
import { TrustedDevice } from "@reachfive/identity-core";
import { createWidget } from "../../components/widget/widget.tsx";
import { UserError } from "../../helpers/errors.ts";
import { AlertDialog } from "radix-ui";
import { ReactComponent as Delete } from '../../icons/delete.svg';
import {useI18n} from "../../contexts/i18n.tsx";
import {Info} from "../../components/miscComponent.tsx";
import {dateFormat} from "../../helpers/utils.ts";
import {useConfig} from "../../contexts/config.tsx";
import {useReachfive} from "../../contexts/reachfive.tsx";

export type TrustedDevicesWidgetProps = {
    accessToken: string

    showRemoveTrustedDevice?: boolean
}

export interface TrustedDeviceProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string

    showRemoveTrustedDevice?: boolean

    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onError?: () => void
}


export const TrustedDeviceList = ({
    accessToken,
    showRemoveTrustedDevice
}: TrustedDeviceProps) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [trustedDevices, setTrustedDevices] = React.useState<TrustedDevice[]>([])

    const i18n = useI18n()
    const config = useConfig()
    const client = useReachfive()

    const fetchTrustedDevices = () => {
        client.listTrustedDevices(accessToken)
            .then(trustedDevicesResponse => {
                setTrustedDevices(trustedDevicesResponse.trustedDevices)
            })
            .catch(error => {
                throw UserError.fromAppError(error)
            })
    }

    useEffect(() => {
        fetchTrustedDevices()
    }, [accessToken]);

    const onDelete = (device: TrustedDevice) => {
        client
            .removeTrustedDevice
            ({
                accessToken,
                trustedDeviceId: device.id
            })
            .then(_ => fetchTrustedDevices())
            .catch(error => {
                throw UserError.fromAppError(error)
            })
    }

    const deleteButton = (device: TrustedDevice) => {
        return (
            <AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialog.Trigger asChild>
                    <button className="p-[calc(var(--padding-y)*1px)]"><Delete className="fill-dangerColor w-[2vw] h-[2vh]"/></button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay/>
                    <AlertDialog.Content
                        className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray1 p-[25px] shadow-[var(--shadow-6)] focus:outline-none">
                        <AlertDialog.Title className="m-0 text-[17px] font-medium">
                            Are you sure you want to delete this device ?
                        </AlertDialog.Title>
                        <div className="flex justify-end gap-[3vw] pt-[1vw]">
                            <AlertDialog.Cancel asChild>
                                <button className="transition ease-in-out hover:scale-110 fill-white px-[1vh] shadow-lg hover:bg-gray-200 rounded-sm">Cancel</button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                                <button onClick={_ => onDelete(device)} className="transition ease-in-out hover:scale-110 hover:bg-red-500 px-[1vh] bg-dangerColor shadow-lg text-white rounded-sm">Yes</button>
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        )
    }


    return (
        <div>
            {(trustedDevices.length === 0) && (
                <Info>{i18n('trustedDevices.empty')}</Info>
            )}
            {trustedDevices.map((trustedDevice, index) => (
                <div id={`trusted-device-${index}`} key={`trusted-device-${index}`} className={`flex items-center ${isOpen ? 'opacity-15' : ''}`}>
                    <div className="flex flex-col items-center basis-full line-height-1 align-middle whitespace-nowrap box-border p-[calc(var(--padding-y)*1px)] border-solid border-[calc(var(--border-width)*1px)] rounded-[calc(var(--border-radius)*1px)]" >
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
                    {showRemoveTrustedDevice && deleteButton(trustedDevice)}
                </div>
            ))}
        </div>
    );
}

export default createWidget<TrustedDevicesWidgetProps, TrustedDeviceProps>({
    component: TrustedDeviceList,
    prepare: (options) => ({
            ...options
        }
    )
})
