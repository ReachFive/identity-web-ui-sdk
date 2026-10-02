import React from 'react';

import { Separator } from '@/components/miscComponent';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/i18n';
import { ReactComponent as FingerPrintIcon } from '@/icons/fingerprint.svg';
import { ReactComponent as KeyboardIcon } from '@/icons/keyboard.svg';
import { cn } from '@/lib/utils';

export interface WebAuthnLoginViewButtonsProps extends React.ComponentProps<'button'> {
    disabled?: boolean;
    enablePasswordAuthentication?: boolean;
    onPasswordClick: React.MouseEventHandler<HTMLButtonElement>;
}

export const WebAuthnLoginViewButtons = ({
    disabled,
    enablePasswordAuthentication,
    onPasswordClick,
    className,
    ...props
}: WebAuthnLoginViewButtonsProps) => {
    const i18n = useI18n();
    return (
        <div className={cn('r5-webauthn-login-buttons flex items-center gap-4', className)}>
            <Button
                type="submit"
                variant="ghost"
                size="icon-lg"
                className="r5-button-with-icon grow text-button-bg"
                title={i18n('login.withBiometrics')}
                aria-label={i18n('login.withBiometrics')}
                disabled={disabled}
                {...props}
            >
                <FingerPrintIcon className="size-8" />
            </Button>

            {enablePasswordAuthentication && (
                <>
                    <span className="text-muted-foreground">{i18n('or')}</span>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-lg"
                        className="r5-button-with-icon grow text-button-bg"
                        title={i18n('login.withPassword')}
                        aria-label={i18n('login.withPassword')}
                        disabled={disabled}
                        onClick={onPasswordClick}
                    >
                        <KeyboardIcon className="size-8" />
                    </Button>
                </>
            )}
        </div>
    );
};

export interface WebAuthnSignupViewButtonsProps extends React.ComponentProps<'button'> {
    enablePasswordAuthentication?: boolean;
    onBiometricClick: React.MouseEventHandler<HTMLButtonElement>;
    onPasswordClick: React.MouseEventHandler<HTMLButtonElement>;
}

export const WebAuthnSignupViewButtons = ({
    enablePasswordAuthentication,
    onBiometricClick,
    onPasswordClick,
    className,
    ...props
}: WebAuthnSignupViewButtonsProps) => {
    const i18n = useI18n();
    return (
        <div className={cn('r5-webauthn-signup-buttons flex flex-col gap-4', className)}>
            <Button
                type="button"
                variant="ghost"
                size="lg"
                className="r5-button-with-icon w-full text-button-bg"
                onClick={onBiometricClick}
                title={i18n('signup.withBiometrics')}
                aria-label={i18n('signup.withBiometrics')}
                {...props}
            >
                <FingerPrintIcon className="size-8" />
                <span className="r5-button-text uppercase">{i18n('biometrics')}</span>
            </Button>

            {enablePasswordAuthentication && (
                <>
                    <Separator text={i18n('or')} />

                    <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="r5-button-with-icon w-full text-button-bg"
                        data-testid="password-button"
                        onClick={onPasswordClick}
                        title={i18n('signup.withPassword')}
                        aria-label={i18n('signup.withPassword')}
                    >
                        <KeyboardIcon className="size-8" />
                        <span className="r5-button-text uppercase">{i18n('password')}</span>
                    </Button>
                </>
            )}
        </div>
    );
};
