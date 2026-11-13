import { type Field } from '@/lib/form';

/** The "trust this device" box of the enrollment screens, sent only while shown. */
export const TRUST_DEVICE_FIELD: Field = {
    key: 'trust_device',
    type: 'checkbox',
    label: 'mfa.stepUp.trustDevice',
    defaultChecked: false,
    required: false,
};
