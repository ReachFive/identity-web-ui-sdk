import React, { FC } from 'react';
import { ConsentVersions, Profile, UserConsent } from '@reachfive/identity-core';

import { UserError } from '../../helpers/errors';
import { camelCaseProperties } from '../../helpers/transformObjectProperties';

import { createWidget } from '../../components/widget/widget';
import { createForm } from '../../components/form/formComponent';
import { buildFormFields, computeFieldList } from '../../components/form/formFieldFactory';
import { useReachfive } from '../../contexts/reachfive';
import { FieldCreator } from '../../components/form/fieldCreator';
import { Field } from '../../components/form/formFieldFactory';
import CountrySelector from '../../components/form/fields/countrySelector';

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
     * Callback function called when the request has failed.
     */
    onSuccess?: () => void
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onError?: () => void
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
    resolvedFields: FieldCreator<unknown>[]
    /**
     * Whether the form fields' labels are displayed on the form view.
     * @default false
     */
    showLabels?: boolean
}

const ProfileEditor = ({
    accessToken,
    onSuccess = () => {},
    onError = () => {},
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

    return (
        <ProfileEditorForm
            handler={handleSubmit}
            initialModel={profile}
            fields={resolvedFields}
            showLabels={showLabels}
            onSuccess={onSuccess}
            onError={onError}
        />
    )
}

interface FieldComponent extends Field {
    component?: FC<any>; 
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
    fields?: (string | FieldComponent)[];
}

export default createWidget<ProfileEditorWidgetProps, ProfileEditorProps>({
    component: ProfileEditor,
    prepare: (options, { apiClient, config }) => {
        const opts = {
            showLabels: true,
            fields: [{ key: 'country', component: CountrySelector }],
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
                fields: computeFieldList(resolvedFields)
            })
            .then(profile => camelCaseProperties(profile) as Profile) /** @todo check api response key format in sdk core */
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
                })
            });
    }
});

// Filter out the profile consents with different version than the one the given consent field own
const filterProfileConsents = (fields: (string | FieldComponent)[], consentsVersions: Record<string, ConsentVersions>, profileConsents: Record<string, UserConsent>) => {
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
