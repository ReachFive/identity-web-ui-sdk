import { describe, expect, test } from '@jest/globals';

import { stepUpFactors } from '../../../src/widgets/stepUp/factors';

describe('stepUpFactors', () => {
    test.each([
        [
            ['sms', 'email'],
            ['email', 'sms'],
        ],
        [['email', 'totp'], ['email']],
        [['webauthn'], []],
    ])('%j gives the code factors %j', (amr, codeFactors) => {
        expect(stepUpFactors(amr)).toStrictEqual({ codeFactors });
    });
});
