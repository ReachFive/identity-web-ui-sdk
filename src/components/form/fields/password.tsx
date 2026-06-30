import React from 'react';

import { CircleAlertIcon, CircleCheckIcon, EyeIcon, EyeOffIcon } from 'lucide-react';

import { PasswordStrength } from '@reachfive/identity-core';

import { Required } from '@/components/form/fields/required';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { ItemDescription, ItemTitle } from '@/components/ui/item';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { cn } from '@/lib/utils';

const PasswordInputContext = React.createContext<{ password: string } | null>(null);

type PasswordFieldProps = Omit<React.ComponentProps<'input'>, 'type'> & {
    canShowPassword?: boolean;
    label: string;
    description?: React.ReactNode;
    errors?: { message?: string }[];
    showLabels: boolean;
};

const PasswordField = React.forwardRef<
    HTMLInputElement,
    React.PropsWithChildren<PasswordFieldProps>
>(function PasswordField(
    {
        canShowPassword,
        children,
        defaultValue,
        errors,
        id,
        label,
        description,
        onChange,
        placeholder,
        required,
        showLabels,
        value,
        ...props
    },
    ref
) {
    const i18n = useI18n();
    const [showPassword, setShowPassword] = React.useState(false);
    const [password, setPassword] = React.useState(defaultValue ?? '');
    const togglePassword = React.useCallback(() => setShowPassword(p => !p), []);

    const currentValue = value ?? password;

    const handleChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setPassword(e.target.value);
            onChange?.(e);
        },
        [onChange]
    );

    const generatedId = React.useId();
    const resolvedId = id ?? generatedId;
    const descriptionId = description ? `${resolvedId}-description` : undefined;
    const hasError = errors !== undefined && errors.length > 0;
    const errorId = hasError ? `${resolvedId}-error` : undefined;

    return (
        <PasswordInputContext.Provider value={{ password: currentValue.toString() }}>
            <Field data-invalid={hasError}>
                <FieldLabel htmlFor={resolvedId} className={cn(showLabels ? '' : 'sr-only')}>
                    {label}
                    {required && <Required />}
                </FieldLabel>
                <InputGroup>
                    <InputGroupInput
                        type={showPassword ? 'text' : 'password'}
                        ref={ref}
                        id={resolvedId}
                        defaultValue={defaultValue}
                        onChange={handleChange}
                        placeholder={placeholder ?? (!showLabels ? label : undefined)}
                        required={required}
                        value={value ?? ''}
                        aria-label={label}
                        aria-describedby={children ? 'password-strength password-rules' : undefined}
                        aria-invalid={hasError ? true : undefined}
                        aria-errormessage={hasError ? errorId : undefined}
                        {...props}
                    />
                    {canShowPassword && (
                        <InputGroupAddon align="inline-end">
                            <InputGroupButton
                                size="icon-xs"
                                aria-checked={showPassword}
                                role="switch"
                                data-testid={
                                    showPassword ? 'hide-password-btn' : 'show-password-btn'
                                }
                                onClick={togglePassword}
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                <span className="sr-only">
                                    {showPassword ? i18n('password.hide') : i18n('password.show')}
                                </span>
                            </InputGroupButton>
                        </InputGroupAddon>
                    )}
                </InputGroup>
                {description && (
                    <FieldDescription id={descriptionId}>{description}</FieldDescription>
                )}
                {errors && <FieldError id={errorId} errors={errors} />}
                {children}
            </Field>
        </PasswordInputContext.Provider>
    );
});
PasswordField.displayName = 'PasswordField';

type PasswordPolicyRulesProps = {};

const PasswordPolicyRules = function PasswordPolicyRules(_props: PasswordPolicyRulesProps) {
    const client = useReachfive();
    const { passwordPolicy } = useConfig();
    const i18n = useI18n();
    const { password } = usePasswordInput();
    const deferredPassword = React.useDeferredValue(password);

    const [error, setError] = React.useState(false);
    const [strength, setStrength] = React.useState<PasswordStrength>({ score: 0 });

    React.useEffect(() => {
        if (deferredPassword.length === 0) {
            setStrength({ score: 0 } satisfies PasswordStrength);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        (async () => {
            try {
                setStrength(await client.getPasswordStrength(deferredPassword));
            } catch (_e) {
                setError(true);
            }
        })();
    }, [client, deferredPassword]);

    if (error) return null;

    // hide if the password is empty
    if (password.length === 0) return null;

    return (
        <div className="flex flex-col w-full gap-3" role="group">
            <StrengthIndicator strength={strength} />
            <div
                id="password-rules"
                className="flex flex-col gap-2 p-3 border border-input rounded-lg bg-input/20"
            >
                {passwordPolicy.minStrength && (
                    <RuleCheckedItem
                        role="status"
                        checked={strength.score >= passwordPolicy.minStrength}
                        title={
                            <span>
                                {i18n('passwordStrength.minimum.required')}{' '}
                                <strong>
                                    {i18n(`passwordStrength.score${passwordPolicy.minStrength}`)}
                                </strong>
                            </span>
                        }
                    />
                )}
                <div className="font-semibold" id="password-rules-title">
                    {i18n('validation.password.must.contain')}
                </div>
                <div
                    className="flex flex-col gap-1"
                    role="list"
                    aria-labelledby="password-rules-title"
                >
                    {passwordPolicy.minLength && (
                        <RuleCheckedItem
                            role="listitem"
                            checked={password.length >= passwordPolicy.minLength}
                            title={i18n('validation.password.minLength', {
                                min: passwordPolicy.minLength,
                            })}
                        />
                    )}
                    {passwordPolicy.specialCharacters && (
                        <RuleCheckedItem
                            role="listitem"
                            checked={new RegExp('[ !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]').test(
                                password
                            )}
                            title={i18n('validation.password.specials.characters')}
                        />
                    )}
                    {passwordPolicy.lowercaseCharacters && (
                        <RuleCheckedItem
                            role="listitem"
                            checked={/[a-z]/.test(password)}
                            title={i18n('validation.password.specials.lowercase')}
                        />
                    )}
                    {passwordPolicy.uppercaseCharacters && (
                        <RuleCheckedItem
                            role="listitem"
                            checked={/[A-Z]/.test(password)}
                            title={i18n('validation.password.specials.uppercase')}
                        />
                    )}
                    {passwordPolicy.digitCharacters && (
                        <RuleCheckedItem
                            role="listitem"
                            checked={/[0-9]/.test(password)}
                            title={i18n('validation.password.specials.digi')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
PasswordPolicyRules.displayName = 'PasswordPolicyRules';

const StrengthIndicator = function StrengthIndicator({ strength }: { strength: PasswordStrength }) {
    const { passwordPolicy } = useConfig();
    const i18n = useI18n();
    const label = i18n(`passwordStrength.score${strength.score}`);
    return (
        <div className="w-full">
            <div
                role="meter"
                aria-label={label}
                aria-valuenow={strength.score}
                aria-valuemin={0}
                aria-valuemax={4}
                aria-valuetext={i18n(`passwordStrength.score${strength.score}`)}
                aria-live="polite"
                className="flex gap-1"
                id="password-strength"
            >
                {Array.from({ length: 4 }).map((_, i) => {
                    const color =
                        strength.score >= passwordPolicy.minStrength
                            ? 'bg-primary'
                            : 'bg-destructive';

                    return (
                        <div
                            key={i}
                            className={cn(
                                'h-1 flex-1 rounded-full',
                                strength.score > i ? color : 'bg-foreground/20'
                            )}
                        />
                    );
                })}
            </div>
            <div className="flex justify-end text-sm text-muted-foreground">{label}</div>
        </div>
    );
};
StrengthIndicator.displayName = 'StrengthIndicator';

type RuleCheckedItemProps = Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> & {
    checked: boolean;
    description?: React.ReactNode;
    title: React.ReactNode;
};

const RuleCheckedItem = function RuleCheckedItem({
    description,
    checked,
    title,
    ...props
}: RuleCheckedItemProps) {
    const i18n = useI18n();
    return (
        <div className="flex gap-2 items-center" {...props}>
            {checked ? (
                <>
                    <CircleCheckIcon className="size-4 text-primary" aria-hidden="true" />
                    <span className="sr-only" aria-live="polite">
                        {i18n('validated')}
                    </span>
                </>
            ) : (
                <>
                    <CircleAlertIcon className="size-4 text-destructive" aria-hidden="true" />
                    <span className="sr-only" aria-live="polite">
                        {i18n('invalid')}
                    </span>
                </>
            )}
            <div className="flex flex-col">
                <ItemTitle>{title}</ItemTitle>
                {description && <ItemDescription>{description}</ItemDescription>}
            </div>
        </div>
    );
};

const usePasswordInput = () => {
    const context = React.useContext(PasswordInputContext);
    if (context == null) {
        throw new Error('usePasswordInput must be used within a PasswordInputContext');
    }
    return context;
};

export { PasswordField, PasswordPolicyRules };
