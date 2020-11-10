# Changelog

## v1.11.3

### 10/11/2020

### Fix
- The [`showAuth`](https://developer.reachfive.com/sdk-ui/showAuth.html) widget can now handle signup with biometrics if the `allowWebAuthnSignup` option is enabled. This feature is also available on the Hosted Pages.
- The device's name is now optional in the [`showWebAuthnDevices`](https://developer.reachfive.com/sdk-ui/showWebAuthnDevices.html).

## v1.11.2

### 04/11/2020

### Feature
A new check rule for password strength is now displayed on the signup view on the [`showAuth`](https://developer.reachfive.com/sdk-ui/showAuth.html) widget.

## v1.11.1

### 28/10/2020

### Fix
Revert the new check rule for password strength since the wordings are not yet deployed.

## v1.11.0

### 28/10/2020

### Feature
New changes were made on the [`showAuth`](https://developer.reachfive.com/sdk-ui/showAuth.html) widget:
- A new check rule for password strength is now displayed on the signup view.
- The users will be notified when a password contains words contained in the given name, the family name, or the email address. These blacklist words will also be taken into account of the password strength.
- The validation errors will be displayed sooner on the form.

## v1.10.1

### 19/10/2020

### Fix
Revert the latest FIDO2 signup feature since it's breaking the style of Hosted Pages.

## v1.10.0

### 16/10/2020

### Feature
The [`showAuth`](https://developer.reachfive.com/sdk-ui/showAuth.html) widget can now handle signup with biometrics if the `allowWebAuthnSignup` option is enabled.

## v1.9.0

### 16/09/2020

### Feature
Always override account `opt-out` consents.

### Fix
Fix the CircleCi job to deploy a new version.

## v1.8.0

### 22/07/2020

### Feature
Add custom fields types (email & phone).

## v1.7.0

### 08/07/2020

### Feature
- The user can now set the device's name in the [showWebAuthnDevices](https://developer.reachfive.com/sdk-ui/showWebAuthnDevices.html) widget.
- The server error messages can now be overload in the `i18n` widget option.

## v1.6.0

### 07/07/2020

### Feature
Display a friendly user error message on the [showWebAuthnDevices](https://developer.reachfive.com/sdk-ui/showWebAuthnDevices.html) widget when the user wants to add a device already registered.

## v1.5.0

### 01/07/2020

### Feature
Add a new widget [`showWebAuthnDevices`](https://developer.reachfive.com/sdk-ui/showWebAuthnDevices.html) allowing the management of the user’s registered FIDO2 devices.

## v1.4.1

### 18/06/2020

### Fix
The UI SDK now uses the latest version of the Core SDK.

## v1.4.0

### 15/06/2020

### Feature
Add a new `allowWebAuthnLogin` option to the [`showAuth`](https://developer.reachfive.com/sdk-ui/showAuth.html) widget to allow a user to login with biometrics.

## v1.3.0

### 29/05/2020

### Fix
Call only the validation methods when the field is required or when the value is not empty.

### Feature
- Set the default value of the _Remember be_ to `false`.
- Upgrade all the dependencies.

## v1.2.1

### 20/04/2020

### Fix
The `showRememberMe` check box now properly sets the boolean `persistent` field into `auth` options object with the `showAuth` component.

## v1.2.0

### 17/04/2020

### Fix
The UI SDK now uses the latest version of the Core SDK.

## v1.1.0

### 16/04/2020

### Fix
The [`showRememberMe`](https://developer.reachfive.com/sdk-ui/showAuth.html#showRememberMe) option is now taken into account.

## v1.0.1

### 19/03/2020

ReachFive UI SDK is out! 🚀

## v1.0.0-alpha.10

### 19/02/2020

### Features
Improve the UX/UI of the password policy rules validation.

## v1.0.0-alpha.9

### 10/02/2020

### Features
The _display password in clear text_ option can now be enabled on the password reset widget.

## v1.0.0-alpha.8

### 06/02/2020

### Fixes
The UI SDK uses now the latest version of the Core SDK.

## v1.0.0-alpha.7

### 06/02/2020

### Features
Add the `returnToAfterPasswordReset` parameter for reset password and the `returnToAfterEmailConfirmation` parameter for signup.

## v1.0.0-alpha.6

### 22/01/2020

### Fixes
The bundles are no longer in the `build` folder but in the folder associated with their format (`umd`, `cjs` and `es`).

## v1.0.0-alpha.5

### 21/01/2020

### Fixes
  Passwords in the French dictionary were considered good enough while they weren't.

## v1.0.0-alpha.4

### 15/01/2020

### Features
- French weak passwords are now rejected by the password strength policies.
- A UMD bundle is now generated at the build process. It will allow deploying the UI SDK on [unpkg](https://unpkg.com).

## v1.0.0-alpha.3

### 07/01/2020

### Features
- Implement continuous integration pipelines set up with CircleCI (see the [CircleCI configuration file](.circleci/config.yml) for more details).
- The widgets labels are now translated in the language specified in the client's configuration.

### Fixes
The eye icon is now correctly displayed in the Auth widget.

## v1.0.0-alpha.2

### 06/11/2019

### Features
- A `data-testid` attribute was added to most of the HTML elements.
- Handle the errors returned at the creation of a password non-compliant to the account's password policy.

## v1.0.0-alpha.1

### 21/10/2019

First version of the SDK Web UI.
