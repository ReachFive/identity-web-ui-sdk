# Changelog

## v.1.4.1

### 18/06/2020

### Fix
- The UI SDK now uses the latest version of the Core SDK.

## v.1.4.0

### 15/06/2020

### Feature
- Add a new `allowWebAuthnLogin` option to the [`showAuth`](https://developer.reachfive.com/sdk-ui/showAuth.html) widget to allow a user to login with biometrics.

## v.1.3.0

### 29/05/2020

### Fix
- Call only the validation methods when the field is required or when the value is not empty.

### Feature
- Set the default value of the _Remember be_ to `false`.
- Upgrade all the dependencies.

## v.1.2.1

### 20/04/2020

### Fix
- The `showRememberMe` check box now properly sets the boolean `persistent` field into `auth` options object with the `showAuth` component.

## v.1.2.0

### 17/04/2020

### Fix
- The UI SDK now uses the latest version of the Core SDK.

## v.1.1.0

### 16/04/2020

### Fix
- The [`showRememberMe`](https://developer.reachfive.com/sdk-ui/showAuth.html#showRememberMe) option is now taken into account.

## v.1.0.1

### 19/03/2020

ReachFive UI SDK is out! 🚀

## v.1.0.0-alpha.10

### 19/02/2020

### Features
- Improve the UX/UI of the password policy rules validation.

## v.1.0.0-alpha.9

### 10/02/2020

### Features
- The _display password in clear text_ option can now be enabled on the password reset widget.

## v.1.0.0-alpha.8

### 06/02/2020

### Fixes
- The UI SDK uses now the latest version of the Core SDK.

## v.1.0.0-alpha.7

### 06/02/2020

### Features
- Add the `returnToAfterPasswordReset` parameter for reset password and the `returnToAfterEmailConfirmation` parameter for signup.

## v.1.0.0-alpha.6

### 22/01/2020

### Fixes
- The bundles are no longer in the `build` folder but in the folder associated with their format (`umd`, `cjs` and `es`).

## v.1.0.0-alpha.5

### 21/01/2020

### Fixes
- Passwords in the French dictionary were considered good enough while they weren't.

## v.1.0.0-alpha.4

### 15/01/2020

### Features
- French weak passwords are now rejected by the password strength policies.
- A UMD bundle is now generated at the build process. It will allow deploying the UI SDK on [unpkg](https://unpkg.com).

## v.1.0.0-alpha.3

### 07/01/2020

### Features
- Implement continuous integration pipelines set up with CircleCI (see the [CircleCI configuration file](.circleci/config.yml) for more details).
- The widgets labels are now translated in the language specified in the client's configuration.

### Fixes
- The eye icon is now correctly displayed in the Auth widget.

## v.1.0.0-alpha.2

### 06/11/2019

### Features
- A `data-testid` attribute was added to most of the HTML elements.
- Handle the errors returned at the creation of a password non-compliant to the account's password policy.

## v.1.0.0-alpha.1

### 21/10/2019

First version of the SDK Web UI.
