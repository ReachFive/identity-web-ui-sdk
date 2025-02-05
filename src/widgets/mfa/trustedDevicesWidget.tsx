import React from 'react';
import { TrustedDevice } from "@reachfive/identity-core";
import { createWidget } from "../../components/widget/widget.tsx";
import { UserError } from "../../helpers/errors.ts";
import { AlertDialog } from "radix-ui";
// import { ReactComponent as Delete } from '../../icons/delete.svg'
import {useI18n} from "../../contexts/i18n.tsx";
// import {useConfig} from "../../contexts/config.tsx";
// import {useReachfive} from "../../contexts/reachfive.tsx";
import {Info} from "../../components/miscComponent.tsx";
import styled from "styled-components";
import {Card} from "../../components/form/cardComponent.tsx";
import '../../index.css';

export type TrustedDevicesWidgetProps = {
    accessToken: string

    showRemoveTrustedDevice?: boolean
}

export interface TrustedDeviceProps {
    trustedDevices: TrustedDevice[],
    accessToken: string
}


const Credential = styled(Card)`
    display: flex;
    flex-direction: row;
    align-items: center;
    color: ${props => props.theme.textColor};
    line-height: 1.5;
`;

const CardContent = styled.div`
    margin-left: ${props => props.theme._blockInnerHeight}px;
    white-space: initial;
`;

// const iconStyle = css`
//     width: ${props => props.theme.fontSize * 2}px;
//     height: ${props => props.theme.fontSize * 2}px;
//     fill: ${props => props.theme.textColor};
//     flex-shrink: 4;
// `

// const DeleteIcon = styled(Delete)`${iconStyle}`;

export const TrustedDeviceList = ({
    trustedDevices,
    // accessToken
}: TrustedDeviceProps) => {
    const i18n = useI18n()
    // const config = useConfig()
    // const client = useReachfive()
        //
        // const onDelete = (device: TrustedDevice) => {
        //     client
        //         .removeTrustedDevice
        //         ({
        //             accessToken,
        //             trustedDeviceId: device.id
        //         })
        //         .catch(error => {
        //             throw UserError.fromAppError(error)
        //         })
        // }

        // const deleteButton = (device: TrustedDevice) => {
        //     return (
        //         <AlertDialog.Root>
        //             <AlertDialog.Trigger asChild>
        //                 <button onClick={ () => onDelete(device)}><DeleteIcon/></button>
        //             </AlertDialog.Trigger>
        //             <AlertDialog.Portal>
        //                 <AlertDialog.Overlay className="AlertDialogOverlay" />
        //                 <AlertDialog.Content className="AlertDialogContent">
        //                     <AlertDialog.Title className="AlertDialogTitle">
        //                         Are you absolutely sure?
        //                     </AlertDialog.Title>
        //                     <AlertDialog.Description className="AlertDialogDescription">
        //                         This action cannot be undone. This will permanently delete your
        //                         account and remove your data from our servers.
        //                     </AlertDialog.Description>
        //                     <div style={{ display: "flex", gap: 25, justifyContent: "flex-end" }}>
        //                         <AlertDialog.Cancel asChild>
        //                             <button className="Button red">Cancel</button>
        //                         </AlertDialog.Cancel>
        //                         <AlertDialog.Action asChild>
        //                             <button className="Button red">Yes, delete account</button>
        //                         </AlertDialog.Action>
        //                     </div>
        //                 </AlertDialog.Content>
        //             </AlertDialog.Portal>
        //         </AlertDialog.Root>
        //     )
        // }
    //     < div >
    //     < AlertDialog.Root >
    //     < AlertDialog.Trigger
    // asChild >
    // < button
    // className = "inline-flex h-[35px] items-center justify-center rounded bg-destructive px-[15px] font-medium leading-none text-violet11 outline-none outline-offset-1 hover:bg-accent focus-visible:outline-2 focus-visible:outline-emerald-900 select-none" >
    //     Delete
    // account
    // < /button>
// </AlertDialog.Trigger>
//     <AlertDialog.Portal>
//         <AlertDialog.Overlay
//             className="fixed inset-0 bg-blackA6 data-[state=open]:animate-overlayShow bg-popover"/>
//         <AlertDialog.Content
//             className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray1 p-[25px] shadow-[var(--shadow-6)] focus:outline-none data-[state=open]:animate-contentShow">
//             <AlertDialog.Title className="m-0 text-[17px] font-medium text-green-400">
//                 Are you absolutely sure?
//             </AlertDialog.Title>
//             <AlertDialog.Description
//                 className="mb-5 mt-[15px] text-[15px] leading-normal text-mauve11">
//                 This action cannot be undone. This will permanently delete your
//                 account and remove your data from our servers.
//             </AlertDialog.Description>
//             <div className="flex justify-end gap-[25px]">
//                 <AlertDialog.Cancel asChild>
//                     <button
//                         className="inline-flex h-[35px] items-center justify-center rounded bg-mauve4 px-[15px] font-medium leading-none text-mauve11 outline-none outline-offset-1 hover:bg-mauve5 focus-visible:outline-2 focus-visible:outline-mauve7 select-none">
//                         Cancel
//                     </button>
//                 </AlertDialog.Cancel>
//                 <AlertDialog.Action asChild>
//                     <button
//                         className="inline-flex h-[35px] items-center justify-center rounded bg-red4 px-[15px] font-medium leading-none text-red11 outline-none outline-offset-1 hover:bg-red5 focus-visible:outline-2 focus-visible:outline-red7 select-none">
//                         Yes, delete account
//                     </button>
//                 </AlertDialog.Action>
//             </div>
//         </AlertDialog.Content>
//     </AlertDialog.Portal>
// </AlertDialog.Root>
// </div>
    return (
        <div className="bg-fuchsia-500">
            element2
            {(trustedDevices.length === 0) && (
                <Info>{i18n('trustedDevices.empty')}</Info>
            )}
            {trustedDevices.map((trustedDevice, index) => (
                <Credential key={`trusted-device-${index}`}>
                    <CardContent>
                        <div style={{fontWeight: 'bold'}}>{trustedDevice.metadata.deviceName}</div>
                        <div style={{fontWeight: 'bold'}}>{trustedDevice.metadata.ip}</div>
                        <div style={{fontWeight: 'bold'}}>{trustedDevice.metadata.deviceClass}</div>
                        <div style={{fontWeight: 'bold'}}>{trustedDevice.metadata.operatingSystem}</div>
                        <div style={{fontWeight: 'bold'}}>{trustedDevice.metadata.userAgent}</div>
                        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <span className="bg-orange-500 text-3xl">{i18n('mfaList.createdAt')}&nbsp;: </span>
                        </div>
                        <div className="bg-red-600">
                            <AlertDialog.Root>
                                <AlertDialog.Trigger asChild>
                                    <button className="bg-amber-700 text-purple-200 text-center font-thin">Delete</button>
                                </AlertDialog.Trigger>
                                <AlertDialog.Portal>
                                    <AlertDialog.Overlay className="fixed inset-0 bg-amber-50"/>
                                    <AlertDialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray1 p-[25px] shadow-[var(--shadow-6)] focus:outline-none">
                                        <AlertDialog.Title className="m-0 text-[17px] font-medium text-green-400">
                                            Are you absolutely sure?
                                        </AlertDialog.Title>
                                        <AlertDialog.Description className="mb-5 mt-[15px] text-[15px] leading-normal text-mauve11">
                                            This action cannot be undone. This will permanently delete your
                                            account and remove your data from our servers.
                                        </AlertDialog.Description>
                                        <div style={{display: "flex", gap: 25, justifyContent: "flex-end"}}>
                                            <AlertDialog.Cancel asChild>
                                                <button className="Button red">Cancel</button>
                                            </AlertDialog.Cancel>
                                            <AlertDialog.Action asChild>
                                                <button className="Button red">Yes, delete account</button>
                                            </AlertDialog.Action>
                                        </div>
                                    </AlertDialog.Content>
                                </AlertDialog.Portal>
                            </AlertDialog.Root>
                        </div>
                    </CardContent>
                </Credential>
            ))}
        </div>
    );
}

export default createWidget<TrustedDevicesWidgetProps, TrustedDeviceProps>({
    component: TrustedDeviceList,
    prepare: (options, {apiClient}) => {
        return apiClient.listTrustedDevices(options.accessToken)
            .catch(error => {
                throw UserError.fromAppError(error)
            })
            .then(({trustedDevices}) => ({
                ...options,
                trustedDevices
            }))
    }
})
