import { type Field } from '@/lib/form';

export const TRUST_DEVICE_FIELD: Field = {
    key: 'trust_device',
    type: 'checkbox',
    label: 'mfa.stepUp.trustDevice',
    defaultChecked: false,
    required: false,
};
