import { describe, expect, test } from '@jest/globals';
import { LoginWithPasswordParams, LoginWithWebAuthnParams } from '@reachfive/identity-core';

import { specializeIdentifierData } from '../../src/helpers/utils';

describe('specializeIdentifierData', () => {

    describe('EmailLoginWithPasswordParams', () => {

        describe('with Email', () => {
            test('as email property', () => {
                const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                    email: 'bob@mail.com',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                })
                const expected = {
                    email: 'bob@mail.com',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                }
                expect(obtained).toEqual(expected)
            })
    
            test('as identifier property', () => {
                const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                    identifier: 'bob@mail.com',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                })
                const expected = {
                    email: 'bob@mail.com',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                }
                expect(obtained).toEqual(expected)
            })
        })
        
        describe('with PhoneNumber', () => {
            test('as phoneNumber param', () => {
                const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                    phoneNumber: '+33123456789',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                })
                const expected = {
                    phoneNumber: '+33123456789',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                }
                expect(obtained).toEqual(expected)
            })

            test('as identifier param', () => {
                const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                    identifier: '+33123456789',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                })
                const expected = {
                    phoneNumber: '+33123456789',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                }
                expect(obtained).toEqual(expected)
            })
        })
        
        describe('with CustomIdentifier', () => {
            test('as customIdentifier param', () => {
                const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                    customIdentifier: 'bob971',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                })
                const expected = {
                    customIdentifier: 'bob971',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                }
                expect(obtained).toEqual(expected)
            })

            test('as identifier param', () => {
                const obtained = specializeIdentifierData<LoginWithPasswordParams>({
                    identifier: 'bob971',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                })
                const expected = {
                    customIdentifier: 'bob971',
                    password: 'secretpassword',
                    captchaToken: 'azerty12345',
                }
                expect(obtained).toEqual(expected)
            })
        })
    })

    describe('LoginWithWebAuthnParams', () => {
        describe('with Email', () => {
            test('as email property', () => {
                const obtained: LoginWithWebAuthnParams = specializeIdentifierData<LoginWithWebAuthnParams>({
                    email: 'bob@mail.com',
                    auth: {
                        redirectUri: 'http://localhost'
                    },
                })
                const expected = {
                    email: 'bob@mail.com',
                    auth: {
                        redirectUri: 'http://localhost'
                    },
                }
                expect(obtained).toEqual(expected)
            })
    
            test('as identifier property', () => {
                const obtained = specializeIdentifierData<LoginWithWebAuthnParams>({
                    identifier: 'bob@mail.com',
                    auth: {
                        redirectUri: 'http://localhost'
                    },
                })
                const expected = {
                    email: 'bob@mail.com',
                    auth: {
                        redirectUri: 'http://localhost'
                    },
                }
                expect(obtained).toEqual(expected)
            })
        })
        
        describe('with PhoneNumber', () => {
            test('as phoneNumber param', () => {
                const obtained = specializeIdentifierData<LoginWithWebAuthnParams>({
                    phoneNumber: '+33123456789',
                    auth: {
                        redirectUri: 'http://localhost'
                    },
                })
                const expected = {
                    phoneNumber: '+33123456789',
                    auth: {
                        redirectUri: 'http://localhost'
                    },
                }
                expect(obtained).toEqual(expected)
            })

            test('as identifier param', () => {
                const obtained = specializeIdentifierData<LoginWithWebAuthnParams>({
                    identifier: '+33123456789',
                    auth: {
                        redirectUri: 'http://localhost'
                    },
                })
                const expected = {
                    phoneNumber: '+33123456789',
                    auth: {
                        redirectUri: 'http://localhost'
                    },
                }
                expect(obtained).toEqual(expected)
            })
        })
    })

})