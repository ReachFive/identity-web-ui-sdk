import React from 'react';
import { ConsentVersions, Profile, UserConsent } from '@reachfive/identity-core';

import { UserError } from '../../helpers/errors';
import { camelCaseProperties } from '../../helpers/transformObjectProperties';

import { createWidget } from '../../components/widget/widget';
import { createForm } from '../../components/form/formComponent';
import { buildFormFields } from '../../components/form/formFieldFactory';
import { useReachfive } from '../../contexts/reachfive';
import { FieldCreator } from '../../components/form/fieldCreator';
import { Field } from '../../components/form/formFieldFactory';
import { PhoneNumberOptions } from '../../components/form/fields/phoneNumberField';

import type { OnError, OnSuccess } from '../../types';

type ProfileWithConsents = Profile & { consents?: Record<string, UserConsent> }

const ProfileEditorForm = createForm<ProfileWithConsents>({
    prefix: 'r5-profile-editor-',
    supportMultipleSubmits: true,
    submitLabel: 'save'
});

interface ProfileEditorProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions
    /**
     * 
     */
    profile: ProfileWithConsents
    /**
     * The URL sent in the email to which the user is redirected. 
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string,
    /**
     * 
     */
    resolvedFields: FieldCreator<any, any, any, any>[]
    /**
     * Whether the form fields' labels are displayed on the form view.
     * @default false
     */
    showLabels?: boolean
}

const ProfileEditor = ({
    accessToken,
    onSuccess = (() => {}) as OnSuccess,
    onError = (() => {}) as OnError,
    phoneNumberOptions,
    profile,
    redirectUrl,
    resolvedFields,
    showLabels = false,
}: ProfileEditorProps) => {
    const coreClient = useReachfive()

    const handleSubmit = (data: ProfileWithConsents) =>
        coreClient.updateProfile({
            data,
            accessToken: accessToken,
            redirectUrl: redirectUrl
        });
    console.log('ProfileEditor', profile)
    return (
        <ProfileEditorForm
            handler={handleSubmit}
            initialModel={profile}
            fields={resolvedFields}
            sharedProps={{
                ...phoneNumberOptions,
            }}
            showLabels={showLabels}
            onSuccess={onSuccess}
            onError={onError}
        />
    )
}

export interface ProfileEditorWidgetProps extends Omit<ProfileEditorProps, 'profile' | 'resolvedFields'> {
    /**
     * List of the fields to display in the form.
     * 
     * **Important:**
     * 
     * The following fields can not be changed with this widget:
     * - `password`
     * - `password_confirmation`
     * 
     * It is not possible to update the primary identifier submitted at registration (email or phone number). When the primary identifier is the email address (SMS feature disabled), users can only enter a phone number and update without limit.
     */
    fields?: (string | Field)[]
}

export default createWidget<ProfileEditorWidgetProps, ProfileEditorProps>({
    component: ProfileEditor,
    prepare: (options, { apiClient, config }) => {
        const opts = {
            showLabels: true,
            fields: [],
            ...options
        };
        const { accessToken, fields = [] } = opts;

        const haveNotAllowedFields = fields.some(field => {
            const fieldName = typeof field === 'string' ? field : field.key;
            return fieldName === 'password' || fieldName === 'password_confirmation'
        });

        if (haveNotAllowedFields) {
            throw new UserError('These fields are not allowed: password, password_confirmation.');
        }

        // This step removes the version from the consents
        const resolvedFields = buildFormFields(fields, { ...config, errorArchivedConsents: false });

        return apiClient
            .getUser({
                accessToken,
                fields: resolvedFields.map(({ path }) => path).join(',')
            })
            /** 
             * @todo this can be removed when https://github.com/ReachFive/identity-web-core-sdk/pull/260 will be merged 
             * L'idéal serait que la clé d'un consentement soit en valeur d'une propriété "key" et non une clé de la structure Map utilisée.
             * le mieux serait même que `consents` soit un array et non un map.
             * Mais bon, difficile de changer ça maintenant sans créer un breaking change pour les utilisateurs de l'api ou du sdk core...
             */
            .then(({ consents, ...profile }) => ({
                ...profile,
                consents: consents 
                    ? Object.fromEntries(
                        Object.entries(consents).map(([key, value]) => [
                            key,
                            camelCaseProperties(value) as UserConsent
                        ])
                    )
                    : undefined
            }) as Profile) /** @todo check api response key format in sdk core */
            .then((profile: Profile) => {
                const filteredProfileConsents = (profile.consents && Object.keys(profile.consents).length > 0) ? filterProfileConsents(fields, config.consentsVersions, profile.consents) : undefined;
                const filteredOutConsentsProfile = { ...profile, consents: filteredProfileConsents };
                return ({
                    ...opts,
                    profile: filteredOutConsentsProfile,
                    resolvedFields: resolvedFields.filter(field => {
                        return (field.path !== 'email' || !filteredOutConsentsProfile.email)
                            && (field.path !== 'phone_number' || !config.sms || !filteredOutConsentsProfile.phoneNumber);
                    })
                } satisfies ProfileEditorProps)
            })
            .catch((error: unknown) => {
                options.onError?.(error)
                return Promise.reject(error)
            });
    }
});

// Filter out the profile consents with different version than the one the given consent field own
const filterProfileConsents = (
    fields: (string | Field)[],
    consentsVersions: Record<string, ConsentVersions>,
    profileConsents: Record<string, UserConsent>
) => {
    return Object.keys(profileConsents)
        .filter(profileConsentKey => {
            const consentField = fields.map(f => typeof f === 'string' ? f : f.key).find(field => field.startsWith(`consents.${profileConsentKey}`));
            const consentFieldSplit = consentField ? consentField.split('.v') : [];
            // Find most recent consent version if not given
            const highestConsentVersion = consentsVersions[profileConsentKey].versions[0].versionId;
            const consentFieldVersion = parseInt(consentFieldSplit[1]) || highestConsentVersion;
            const profileConsentVersion = profileConsents[profileConsentKey].consentVersion?.versionId;
            return !consentFieldVersion || consentFieldVersion === profileConsentVersion;
        })
        .reduce<Record<string, UserConsent>>((filteredProfileConsents, consentKey) => {
            filteredProfileConsents[consentKey] = profileConsents[consentKey];
            return filteredProfileConsents;
        }, {});
}
