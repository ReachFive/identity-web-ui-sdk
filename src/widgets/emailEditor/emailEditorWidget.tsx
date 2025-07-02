import React, { useLayoutEffect } from 'react';

import { email } from '../../core/validation';

import { getCaptchaHandler, type WithCaptchaToken } from '../../components/captcha';
import { simpleField } from '../../components/form/fields/simpleField';
import { createForm } from '../../components/form/formComponent';
import { Info, Intro } from '../../components/miscComponent';
import { importGoogleRecaptchaScript } from '../../components/reCaptcha';

import { createMultiViewWidget } from '../../components/widget/widget';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';

import R5CaptchaFox, { CaptchaFoxMode } from '../../components/captchaFox';
import type { OnError, OnSuccess } from '../../types';

type EmailFormData = { email: string };

const EmailEditorForm = createForm<EmailFormData>({
    prefix: 'r5-email-editor-',
    supportMultipleSubmits: true,
    fields: [
        simpleField({
            key: 'email',
            label: 'email',
            type: 'email',
            validator: email,
        }),
    ],
});

interface MainViewProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Boolean that specifies whether reCAPTCHA is enabled or not.
     */
    recaptcha_enabled?: boolean;
    /**
     * The SITE key that comes from your [reCAPTCHA](https://www.google.com/recaptcha/admin/create) setup.
     * This must be paired with the appropriate secret key that you received when setting up reCAPTCHA.
     */
    recaptcha_site_key?: string;
    /**
     * Boolean that specifies whether CaptchaFox is enabled or not.
     */
    captchaFoxEnabled?: boolean;
    /**
     * The SITE key that comes from your [CaptchaFox](https://docs.captchafox.com/getting-started#get-your-captchafox-keys) setup.
     * This must be paired with the appropriate secret key that you received when setting up CaptchaFox.
     */
    captchaFoxSiteKey?: string;
    /**
     * Define how CaptchaFox is displayed (hidden|inline|popup)/ Default to hidden.
     */
    captchaFoxMode?: CaptchaFoxMode;
    /**
     * The URL sent in the email to which the user is redirected.
     * This URL must be whitelisted in the `Allowed Callback URLs` field of your ReachFive client settings.
     */
    redirectUrl?: string;
    /**
     * Whether the signup form fields' labels are displayed on the login view.
     * @default false
     */
    showLabels?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

const MainView = ({
    accessToken,
    recaptcha_enabled = false,
    recaptcha_site_key,
    captchaFoxEnabled = false,
    captchaFoxMode = 'hidden',
    captchaFoxSiteKey,
    redirectUrl,
    showLabels = false,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: MainViewProps) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { goTo } = useRouting();

    useLayoutEffect(() => {
        importGoogleRecaptchaScript(recaptcha_site_key);
    }, [recaptcha_site_key]);

    const callback = (data: WithCaptchaToken<EmailFormData>) => {
        return coreClient.updateEmail({ ...data, accessToken, redirectUrl });
    };

    const handleSuccess = () => {
        onSuccess();
        goTo('success');
    };

    const captchaFox = new R5CaptchaFox(captchaFoxEnabled, captchaFoxMode, captchaFoxSiteKey);
    const handleCaptcha = getCaptchaHandler(
        {
            recaptchaEnabled: recaptcha_enabled,
            recaptchaSiteKey: recaptcha_site_key,
            captchaFoxEnabled: captchaFoxEnabled,
            captchaFoxInstance: captchaFox,
        },
        callback
    );

    return (
        <div>
            <Intro>{i18n('emailEditor.intro')}</Intro>
            <EmailEditorForm
                showLabels={showLabels}
                handler={data => handleCaptcha(data, 'update_email')}
                captchaFox={captchaFox}
                onSuccess={handleSuccess}
                onError={onError}
            />
        </div>
    );
};

const SuccessView = () => {
    const i18n = useI18n();
    return <Info>{i18n('emailEditor.successMessage')}</Info>;
};

export interface EmailEditorWidgetProps extends MainViewProps {}

export default createMultiViewWidget<EmailEditorWidgetProps>({
    initialView: 'main',
    views: {
        main: MainView,
        success: SuccessView,
    },
});
