# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.35.0] - 2025-05-13

### Changed

- BConnect social provider button no longer requires a dedicated query parameter to be displayed.

## [1.34.1] - 2025-05-15

### Fixed

- Reset password with phone number should send phone number value in payload

### Added

- Allow to trust device during mfa credential registration

### Fixed

- Embed TailwindCSS utils in bundle
- Wrap dialog with theme provider (react portal)

## [1.33.2] - 2025-04-10

### Fixed

- ProfileEditor should update consents with key in snake_case

## [1.33.1] - 2025-03-19

### Fixed

- Limits Tailwind styles to widgets scope.

## [1.33.0] - 2025-03-13

### Added

- Allow to define onSuccess and onError callback on all widgets.
- Allow to list and remove trusted devices.
- Add a button in MfaList widget to delete credential.

### Fixed

- Fix phoneNumberField so phone number is not in the payload instead of always valuating it to null.
- Use the right color for Kakao provider as defined in the design guidelines.

## [1.32.2] - 2025-02-10

### Fixed

- Fix date field value format

## [1.32.1] - 2025-02-06

### Fixed

- Fix birthday field value format

## [1.32.0] - 2025-02-05

### Added

- Allow to trust a device during step up when RBA is enabled and the new box is checked

### Changed

- Replace remarkable with marked
- Replace luxon with date-fns
- Removed zxcvbn dependency and use new `getPasswordStrength` SDK Core's method instead.

### Fixed

- Dedupe React dependencies
- Display asterix on phone number field's label when required
- Set a min width on date field's day and year select

## [1.31.3] - 2025-01-28

### Fixed

- Fix form phone number field when optional and not valued

## [1.31.2] - 2025-01-14

### Fixed

- Fix form error handler

## [1.31.1] - 2025-01-10

### Fixed

- Fix phone number country select styles

## [1.31.0] - 2025-01-08

### Added

- Upgrade react and react-dom from v16 to v18
- Better theming options in password field

### Fixed

- Phone number input in MFA widget should only be displayed if no value is already defined

## [1.30.2] - 2024-12-05

### Fixed

- Country selector on PhoneNumber field was displayed with wrong size.

## [1.30.1] - 2024-11-26

### Fixed

- MFA factor selection does not appear when multiple factors are activated.
- Phone number field on reset password view should handle `withCountrySelect` options.

## [1.30.0] - 2024-11-21

### Added

- Add a `allowPhoneNumberResetPassword` boolean option to the `showAuth` widget to allow the ability to process a password reset request by phone number
- Add a `enablePasswordAuthentication` boolean option to the `showAuth` widget to hide/display the password form

## [1.29.0] - 2024-11-08

### Changed

- Display additional info on registered passkeys
- Upgrade SDK Core dependency to 1.34.0

## [1.28.0] - 2024-10-10

### Added

- Add a `allowAuthentMailPhone` boolean option to hide email and password field (keep only custom identifier) on login widget
- Add a possibility to display a country selector on phone number fields
- Add Okta provider
- Add visual marker to labels for required fields
- Add possibility to define custom labels for social buttons

### Fixed

- [showSocialAccounts] Link : afficher le bon variant et non celui par défaut

## [1.27.0] - 2024-05-16

### Added

- Add new widgets for account recovery (Passkeys)

## [1.26.1] - 2024-04-19

### Added

- Add a second UI for login with passkey: choose between integrated password and passkey with `initialScreen: 'login'` or separated password and passkey with `initialScreen: 'login-with-web-authn'`

## [1.26.0] - 2024-03-25

### Added

- Discoverable login for passkey in `showAuth` when `allowWebAuthnLogin` is activated

### Fixed

- MFA stepUp main view initialization and rendering conditions
- Better global error message handling
- SocialAccount `auth` config formarding

## [1.25.7] - 2024-04-03

### Fixed

- Replace lookbehind regular exepression because it's not yet implemented on Safari iOS <16.4

## [1.25.6] - 2024-03-26

### Fixed

- Don't override user form value with initial model form's prop

## [1.25.4] - 2024-03-22

### Changed

- Remove 'loadash' dependency
- Use `CSSProperties` type from 'styled-components' instead of `CSS` from 'CSS'.

### Fixed

- Field props should be updated when form's props changes.
- Email validation should not be triggered when trying to login with a custom identifier

## [1.25.3] - 2024-03-08

### Fixed

- Make `@rollup/rollup-linux-x64-gnu` dependency optional
- Fix React hook warning due to mismatch of React versions
- Resolve not wrapped in act warning issue in tests
- Fix custom theme option forwarding
- Prevent phone-number field validation on empty value

## [1.25.2] - 2024-02-21

### Fixed

- Fix types definitions bundling

## [1.25.1] - 2024-02-19

### Fixed

- Fix bundle dependencies embeding

## [1.25.0] - 2024-02-19

### Changed

- TypeScript migration

### Fixed

- Fix dateField validation when value is empty
- Show API error when trying to unlink a social account with a non-fresh access_token

## [1.24.0] - 2024-01-05

## Added

- Add variable locale

## [1.23.1] - 2023-12-12

### Fixed

- Handle provider variants correctly in showSocialAccount.

## [1.23.0] - 2023-11-27

## Added

- Improved mfa step up UX when only one second factor exists

## [1.22.0] - 2023-11-09

### Added

- User interface enhancement on date type field.

### Fixed

- AccessToken is no more required in passwordless code verification workflow.

## [1.21.0] - 2023-10-12

### Added

- Add Ping provider

### Fixed

- Fix dateField validation import
- Fix identifierField error when initilized with an empty value

## [1.20.2] - 2023-10-02

### Fixed

- Set buffer as dependency instead of using Node module.

## [1.20.1] - 2023-09-29

### Fixed

- Fix import types

## [1.20.0] - 2023-09-22

### Added

- Add Captcha in EmailEditor widget [#140](https://github.com/ReachFive/identity-web-ui-sdk/pull/140)
- Add social provider variant format [#142](https://github.com/ReachFive/identity-web-ui-sdk/pull/142)
- Add ESLint code analyzer [#143](https://github.com/ReachFive/identity-web-ui-sdk/pull/143)
- Add type definitions for SDK methods arguments [#145](https://github.com/ReachFive/identity-web-ui-sdk/pull/145)

### Changed

- Show user error in MFA widget [#136](https://github.com/ReachFive/identity-web-ui-sdk/pull/136)
- Validation on birthdate month and day compatibility + add age restriction message [#141](https://github.com/ReachFive/identity-web-ui-sdk/pull/141)
- Upgrade libphonenumber version to 1.10.44 [#146](https://github.com/ReachFive/identity-web-ui-sdk/pull/146)

### Fixed

- Fix issue when consentField is missing [#144](https://github.com/ReachFive/identity-web-ui-sdk/pull/144)

## [1.19.0] - 2023-02-22

### Added

Support the social provider Naver

### Fixed

Wrong consent version from profile in signup/profile editor forms

## [1.18.0] - 2022-12-12

Allow to start a step up flow during a login when mfa is required
Add dedicated field custom identifier to login views if the right option is enabled
Fix issue during validation custom identifier can now be numbers

## [1.17.0] - 2022-10-26

### Added

New field custom identifier to loginWithPassword
New field custom identifier to signup
New widget for MFA credentials listing
New widget for registering and/or removing MFA credentials
New widget for MFA step up

### Fixed

Use actual consent language in the signup payload.

## [1.16.2] - 2022-08-03

### Fixed

Upgrade identity-web-core-sdk version to 1.24.1

## [1.16.1] - 2022-07-29

### Fixed

Fix code validation in passwordless widget.

## [1.16.0] - 2022-07-27

### Changed

Upgrade identity-web-core-sdk version to 1.24.0

### Fixed

Fix consents UI in profile editor component.

## [1.15.0] - 2022-02-22

### Added

- Add ReCaptcha V3 for authentication pages: forgot-password, signup, login-with-password
- Add ReCaptcha V3 for passwordless page

## [1.14.0] - 2021-11-10

### Changed

- If the SMS feature is enabled for the account, login forms accept a phone number as the identifier.
- Version of consents can be displayed.

### Fixed

Signup field `phone_number` for `showAuth` can now be made mandatory.

## [1.13.0] - 2021-08-02

### Changed

- Upgrade minors versions of dependencies.
- Upgrade the ReachFive Core SDK version to [`1.21.0`](https://github.com/ReachFive/identity-web-core-sdk/releases/tag/v1.21.0).
- The widgets handle now the archived consents: a user cannot accept an archived consent, but he can refuse the consent in the [`showProfileEditor`](https://developer.reachfive.com/sdk-ui/showProfileEditor.html) widget.

## [1.12.0] - 2020-06-02

### Changed

Upgrade identity-web-core-sdk version to 1.20.1

## [1.11.7] - 2020-03-09

### Fixed

Fix the values of the `data-test-id` props for the `showAuth` widget.

## [1.11.6] - 2020-01-27

### Fixed

The [`returnToAfterEmailConfirmation`](https://developer.reachfive.com/sdk-ui/showAuth.html#returnToAfterEmailConfirmation) parameter is now taken into account in the 'Signup with biometrics' form.

### Changed

The Instagram social provider is removed.

## [1.11.5] - 2020-12-10

### Fixed

- Update Apple social login button style.
- Upgrade SDK Core dependency version.

### Changed

Revamp of this changelog to follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0) guidelines.

## [1.11.4] - 2020-11-12

### Fixed

Temporary revert the SDK Core dependency version to solve the login with PKCE in hosted pages.

## [1.11.3] - 2020-11-10

### Fixed

- The [showAuth](https://developer.reachfive.com/sdk-ui/showAuth.html) widget can now handle signup with biometrics if
  the `allowWebAuthnSignup` option is enabled. This Features is also available on the Hosted Pages.
- The device's name is now optional in
  the [showWebAuthnDevices](https://developer.reachfive.com/sdk-ui/showWebAuthnDevices.html).

## [1.11.2] - 2020-11-04

### Added

A new check rule for password strength is now displayed on the signup view on
the [showAuth](https://developer.reachfive.com/sdk-ui/showAuth.html) widget.

## [1.11.1] - 2020-10-28

### Fixed

Revert the new check rule for password strength since the wordings are not yet deployed.

## [1.11.0] - 2020-10-28

### Added

New changes were made on the [showAuth](https://developer.reachfive.com/sdk-ui/showAuth.html) widget:

- A new check rule for password strength is now displayed on the signup view.
- The users will be notified when a password contains words contained in the given name, the family name, or the email
  address. These blacklist words will also be taken into account of the password strength.
- The validation errors will be displayed sooner on the form.

## [1.10.1] - 2020-10-19

### Fixed

Revert the latest FIDO2 signup Features since it's breaking the style of Hosted Pages.

## [1.10.0] - 2020-10-16

### Added

The [showAuth](https://developer.reachfive.com/sdk-ui/showAuth.html) widget can now handle signup with biometrics if
the `allowWebAuthnSignup` option is enabled.

## [1.9.0] - 2020-09-16

### Added

Always override account `opt-out` consents.

### Fixed

Fixes the CircleCi job to deploy a new version.

## [1.8.0] - 2020-07-22

### Added

Add custom fields types (email & phone).

## [1.7.0] - 2020-07-08

### Added

- The user can now set the device's name in
  the [showWebAuthnDevices](https://developer.reachfive.com/sdk-ui/showWebAuthnDevices.html) widget.
- The server error messages can now be overload in the `i18n` widget option.

## [1.6.0] - 2020-07-07

### Added

Display a friendly user error message on
the [showWebAuthnDevices](https://developer.reachfive.com/sdk-ui/showWebAuthnDevices.html) widget when the user wants to
add a device already registered.

## [1.5.0] - 2020-07-01

### Added

Add a new widget [showWebAuthnDevices](https://developer.reachfive.com/sdk-ui/showWebAuthnDevices.html) allowing the
management of the user’s registered FIDO2 devices.

## [1.4.1] - 2020-06-18

### Fixed

The UI SDK now uses the latest version of the Core SDK.

## [1.4.0] - 2020-06-15

### Added

Add a new `allowWebAuthnLogin` option to the [showAuth](https://developer.reachfive.com/sdk-ui/showAuth.html) widget to
allow a user to login with biometrics.

## [1.3.0] - 2020-05-29

### Fixed

Call only the validation methods when the field is required or when the value is not empty.

### Added

- Set the default value of the _Remember be_ to `false`.
- Upgrade all the dependencies.

## [1.2.1] - 2020-04-20

### Fixed

The `showRememberMe` check box now properly sets the boolean `persistent` field into `auth` options object with
the `showAuth` component.

## [1.2.0] - 2020-04-17

### Fixed

The UI SDK now uses the latest version of the Core SDK.

## [1.1.0] - 2020-04-16

### Fixed

The [showRememberMe](https://developer.reachfive.com/sdk-ui/showAuth.html#showRememberMe) option is now taken into
account.

## [1.0.1] - 2020-03-19

ReachFive UI SDK is out! 🚀

## [1.0.0-alpha.10] - 2020-02-19

### Added

Improve the UX/UI of the password policy rules validation.

## [1.0.0-alpha.9] - 2020-02-10

### Added

The _display password in clear text_ option can now be enabled on the password reset widget.

## [1.0.0-alpha.8] - 2020-02-06

### Fixed

The UI SDK uses now the latest version of the Core SDK.

## [1.0.0-alpha.7] - 2020-02-06

### Added

Add the `returnToAfterPasswordReset` parameter for reset password and the `returnToAfterEmailConfirmation` parameter for
signup.

## [1.0.0-alpha.6] - 2020-01-22

### Fixed

The bundles are no longer in the `build` folder but in the folder associated with their format (`umd`, `cjs` and `es`).

## [1.0.0-alpha.5] - 2020-01-21

### Fixed

Passwords in the French dictionary were considered good enough while they weren't.

## [1.0.0-alpha.4] - 2020-01-15

### Added

- French weak passwords are now rejected by the password strength policies.
- A UMD bundle is now generated at the build process. It will allow deploying the UI SDK on [unpkg](https://unpkg.com).

## [1.0.0-alpha.3] - 2020-01-07

### Added

- Implement continuous integration pipelines set up with CircleCI (see
  the [CircleCI configuration file](.circleci/config.yml) for more details).
- The widgets labels are now translated in the language specified in the client's configuration.

### Fixed

The eye icon is now correctly displayed in the Auth widget.

## [1.0.0-alpha.2] - 2019-11-06

### Added

- A `data-testid` attribute was added to most of the HTML elements.
- Handle the errors returned at the creation of a password non-compliant to the account's password policy.

## [1.0.0-alpha.1] - 2019-10-21

First version of the SDK Web UI.

[Unreleased]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.35.0...HEAD
[1.35.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.34.1...v1.35.0
[1.34.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.34.0...v1.34.1
[1.34.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.33.2...v1.34.0
[1.33.2]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.33.1...v1.33.2
[1.33.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.33.0...v1.33.1
[1.33.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.32.2...v1.33.0
[1.32.2]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.32.1...v1.32.2
[1.32.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.32.0...v1.32.1
[1.32.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.31.3...v1.32.0
[1.31.3]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.31.2...v1.31.3
[1.31.2]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.31.1...v1.31.2
[1.31.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.31.0...v1.31.1
[1.31.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.30.2...v1.31.0
[1.30.2]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.30.1...v1.30.2
[1.30.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.30.0...v1.30.1
[1.30.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.29.0...v1.30.0
[1.29.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.28.0...v1.29.0
[1.28.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.27.0...v1.28.0
[1.27.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.26.1...v1.27.0
[1.26.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.26.0...v1.26.1
[1.26.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.25.7...v1.26.0
[1.25.7]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.25.6...v1.25.7
[1.25.6]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.25.4...v1.25.6
[1.25.4]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.25.3...v1.25.4
[1.25.3]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.25.2...v1.25.3
[1.25.2]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.25.1...v1.25.2
[1.25.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.25.0...v1.25.1
[1.25.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.24.0...v1.25.0
[1.24.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.23.1...v1.24.0
[1.23.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.23.0...v1.23.1
[1.23.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.22.0...v1.23.0
[1.22.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.21.0...v1.22.0
[1.21.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.20.2...v1.21.0
[1.20.2]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.20.1...v1.20.2
[1.20.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.20.0...v1.20.1
[1.20.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.19.0...v1.20.0
[1.19.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.18.0...v1.19.0
[1.18.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.17.0...v1.18.0
[1.17.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.16.2...v1.17.0
[1.16.2]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.16.1...v1.16.2
[1.16.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.15.0...v1.16.0
[1.15.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.14.0...v1.15.0
[1.14.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.13.0...v1.14.0
[1.13.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.11.7...v1.12.0
[1.11.7]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.11.6...v1.11.7
[1.11.6]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.11.5...v1.11.6
[1.11.5]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.11.4...v1.11.5
[1.11.4]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.11.3...v1.11.4
[1.11.3]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.11.2...v1.11.3
[1.11.2]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.11.1...v1.11.2
[1.11.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.11.0...v1.11.1
[1.11.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.10.1...v1.11.0
[1.10.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.10.0...v1.10.1
[1.10.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.10...v1.0.1
[1.0.0-alpha.10]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.9...v1.0.0-alpha.10
[1.0.0-alpha.9]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.8...v1.0.0-alpha.9
[1.0.0-alpha.8]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.7...v1.0.0-alpha.8
[1.0.0-alpha.7]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.6...v1.0.0-alpha.7
[1.0.0-alpha.6]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.5...v1.0.0-alpha.6
[1.0.0-alpha.5]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.4...v1.0.0-alpha.5
[1.0.0-alpha.4]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.3...v1.0.0-alpha.4
[1.0.0-alpha.3]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.2...v1.0.0-alpha.3
[1.0.0-alpha.2]: https://github.com/ReachFive/identity-web-ui-sdk/compare/v1.0.0-alpha.1...v1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/ReachFive/identity-web-ui-sdk/releases/tag/v1.0.0-alpha.1
