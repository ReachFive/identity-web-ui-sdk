import React from 'react';
import { useFormContext } from 'react-hook-form';

import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';

import { CaptchaBoundary, useCaptcha, type CaptchaConfig } from '@/components/captcha';
import { Required } from '@/components/form/fields/required';
import { useFormSubmissionSucceeded, useLockFormSubmit } from '@/components/form/formSubmission';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    type InputOTPSlotStatus,
} from '@/components/ui/input-otp';
import { useI18n } from '@/contexts/i18n';
import { isAppError, VERIFICATION_CODE_REFUSED } from '@/helpers/errors';
import { cn } from '@/lib/utils';

type OtpError = { message?: string; type?: string };

/** The codes that may be sent in total when the flow sets no limit of its own. */
const DEFAULT_MAX_SENDS = 5;
/** The time to wait after a new code is sent before another one may be. */
const RESEND_COOLDOWN_SECONDS = 60;

type OtpFieldProps = {
    label: string;
    /** The number of digits the code is made of: one slot is rendered per digit. */
    length: number;
    showLabels: boolean;
    autoFocus?: boolean;
    /** Submits the enclosing form as soon as every slot is filled. */
    autoSubmit?: boolean;
    description?: React.ReactNode;
    disabled?: boolean;
    /** An error typed `VERIFICATION_CODE_REFUSED` counts as a refused code, see `maxTrials`. */
    errors?: OtpError[];
    id?: string;
    /**
     * The codes that may be sent in total, the first one included: the resend link tells how many
     * were sent, and is disabled once they all were.
     * @default 5
     */
    maxSends?: number;
    /**
     * The number of times the code may be refused before it is known to be unusable: the field is then
     * locked, along with the enclosing form, until a new code is sent.
     */
    maxTrials?: number;
    name?: string;
    readOnly?: boolean;
    required?: boolean;
    /** The captcha config to use with the resend request. */
    resendCaptcha?: CaptchaConfig;
    value?: string;
    onBlur?: () => void;
    onChange?: (value: string) => void;
    /** Called with the code once every slot is filled. */
    onComplete?: (value: string) => void;
    /** The function called by the resend link. */
    onResend?: (captcha: { captchaToken?: string }) => Promise<unknown>;
};

function resolveSlotStatus(
    accepted: boolean,
    disabled: boolean,
    hasError: boolean
): InputOTPSlotStatus | undefined {
    if (accepted) return 'success';
    if (disabled) return 'disabled';
    if (hasError) return 'error';
    return undefined;
}

/** Counts the codes the API refused. */
function useRefusedCodes(error: OtpError | undefined) {
    const [refusedCodes, setRefusedCodes] = React.useState(0);
    const counted = React.useRef<OtpError | undefined>(undefined);

    React.useEffect(() => {
        if (error?.type === VERIFICATION_CODE_REFUSED && error !== counted.current) {
            counted.current = error;
            setRefusedCodes(count => count + 1);
        }
    }, [error]);

    return [refusedCodes, () => setRefusedCodes(0)] as const;
}

const OtpField = React.forwardRef<HTMLInputElement, OtpFieldProps>(function OtpField(
    {
        autoSubmit,
        description,
        disabled = false,
        errors,
        id,
        label,
        length,
        maxSends = DEFAULT_MAX_SENDS,
        maxTrials,
        name,
        required,
        resendCaptcha,
        showLabels,
        value,
        onChange,
        onComplete,
        onResend,
        ...props
    },
    ref
) {
    const i18n = useI18n();
    // `null` when the field is used outside a form
    const form = useFormContext() as ReturnType<typeof useFormContext> | null;

    const inputRef = React.useRef<HTMLInputElement>(null);
    // expose the input as ref of this component
    React.useImperativeHandle(ref, () => inputRef.current!);

    const [refusedCodes, resetRefusedCodes] = useRefusedCodes(errors?.[0]);
    const [sentCodes, setSentCodes] = React.useState(1);

    // Whether the last form submission accepted the code
    const accepted = useFormSubmissionSucceeded();
    const exhausted = maxTrials !== undefined && refusedCodes >= maxTrials;
    const allSent = sentCodes >= maxSends;
    // no code can be used any more, and no other one can be sent: the flow has to start over
    const limitReached = exhausted && (!onResend || allSent);
    // Locks the form submission if succeed or if max trials has been reached
    useLockFormSubmit(exhausted || accepted);

    const handleComplete = (code: string) => {
        onComplete?.(code);
        // Tigger form submission if autoSubmit is enable
        if (autoSubmit) inputRef.current?.form?.requestSubmit();
    };

    const resend = async (captcha: { captchaToken?: string }) => {
        await onResend?.(captcha);
        setSentCodes(count => count + 1);
        resetRefusedCodes();
        // Clears both the value and its error
        if (form && name) {
            // do not use `onChange` to avoid revalidates empty field
            form.resetField(name);
        } else onChange?.('');
    };

    const generatedId = React.useId();
    const resolvedId = id ?? generatedId;
    const hasError = errors !== undefined && errors.length > 0;
    const errorId = `${resolvedId}-error`;
    const locked = disabled || exhausted || accepted;

    return (
        <Field data-invalid={hasError}>
            <FieldLabel htmlFor={resolvedId} className={cn(showLabels ? '' : 'sr-only')}>
                {label}
                {required && <Required />}
            </FieldLabel>
            <InputOTP
                ref={inputRef}
                id={resolvedId}
                name={name}
                maxLength={length}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={locked}
                required={required}
                value={value ?? ''}
                onChange={newValue => onChange?.(newValue)}
                onComplete={handleComplete}
                aria-invalid={hasError ? true : undefined}
                aria-errormessage={hasError ? errorId : undefined}
                {...props}
            >
                <InputOTPGroup data-slot="widget-otp">
                    {Array.from({ length }, (_, index) => (
                        <InputOTPSlot
                            key={index}
                            index={index}
                            status={resolveSlotStatus(accepted, locked, hasError)}
                            data-slot="widget-otp-slot"
                        />
                    ))}
                </InputOTPGroup>
            </InputOTP>
            {description && <FieldDescription>{description}</FieldDescription>}
            {errors && <FieldError errors={errors} id={errorId} />}
            {exhausted && !limitReached && (
                <Alert variant="destructive" data-slot="widget-otp-unusable">
                    <AlertTriangleIcon className="size-4" aria-hidden="true" />
                    <AlertTitle className="mt-0">
                        {i18n('verificationCode.unusable.title')}
                    </AlertTitle>
                    <AlertDescription>
                        {i18n('verificationCode.unusable.description')}
                    </AlertDescription>
                </Alert>
            )}
            {limitReached && (
                <Alert variant="destructive" data-slot="widget-otp-limit-reached">
                    <AlertTriangleIcon className="size-4" aria-hidden="true" />
                    <AlertTitle className="mt-0">
                        {i18n('verificationCode.limitReached.title')}
                    </AlertTitle>
                    <AlertDescription>
                        {i18n('verificationCode.limitReached.description')}
                    </AlertDescription>
                </Alert>
            )}
            {onResend && !limitReached && (
                <CaptchaBoundary captcha={resendCaptcha}>
                    <ResendCode
                        // an accepted code is already on its way: no other one is needed
                        disabled={accepted || allSent}
                        maxSends={maxSends}
                        sentCodes={sentCodes}
                        onResend={resend}
                    />
                </CaptchaBoundary>
            )}
        </Field>
    );
});
OtpField.displayName = 'OtpField';

/** Counts down the seconds left once started. */
function useCountdown() {
    const [deadline, setDeadline] = React.useState<number>();
    const [remaining, setRemaining] = React.useState(0);

    React.useEffect(() => {
        if (deadline === undefined) return;
        // computed from the clock: a background tab may delay the ticks
        const timer = setInterval(() => {
            const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setRemaining(left);
            if (left === 0) setDeadline(undefined);
        }, 1000);
        return () => clearInterval(timer);
    }, [deadline]);

    const start = (seconds: number) => {
        // set at once, so that no render shows the countdown over before its first tick
        setRemaining(seconds);
        setDeadline(Date.now() + seconds * 1000);
    };

    return [remaining, start] as const;
}

/** Formats seconds as `mm:ss`. */
function formatDuration(seconds: number) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

type ResendCodeProps = {
    disabled: boolean;
    maxSends: number;
    sentCodes: number;
    onResend: (captcha: { captchaToken?: string }) => Promise<void>;
};

function ResendCode({ disabled, maxSends, sentCodes, onResend }: ResendCodeProps) {
    const i18n = useI18n();
    const { Captcha, handler: captchaHandler } = useCaptcha();
    const [pending, setPending] = React.useState(false);
    const [error, setError] = React.useState<{ message: string }>();
    const [cooldown, startCooldown] = useCountdown();
    // no countdown on a link which stays disabled once it is over
    const waiting = !disabled && cooldown > 0;

    const resend = async () => {
        setPending(true);
        setError(undefined);
        try {
            await captchaHandler({}, onResend);
            startCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            setError({
                message: isAppError(err)
                    ? i18n(err.errorMessageKey ?? err.error, {
                          defaultValue: err.errorUserMsg ?? err.errorDescription ?? err.error,
                      })
                    : i18n('verificationCode.resend.error'),
            });
        } finally {
            setPending(false);
        }
    };

    return (
        <div data-slot="widget-otp-resend" className="flex flex-col gap-2">
            <Button
                type="button"
                variant="link"
                className="h-auto justify-start p-0"
                disabled={disabled || pending || waiting}
                onClick={() => void resend()}
            >
                <RefreshCwIcon className="size-4" aria-hidden="true" />
                {waiting
                    ? i18n('verificationCode.resend.cooldown', {
                          remaining: formatDuration(cooldown),
                          sent: sentCodes,
                          max: maxSends,
                      })
                    : i18n('verificationCode.resend.count', { sent: sentCodes, max: maxSends })}
            </Button>
            {error && <FieldError errors={[error]} />}
            {Captcha && <Captcha />}
        </div>
    );
}

export { OtpField };
