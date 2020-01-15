# Changelog

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
