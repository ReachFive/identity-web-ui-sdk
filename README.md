[![CircleCI](https://circleci.com/gh/ReachFive/identity-web-ui-sdk/tree/master.svg?style=svg)](https://circleci.com/gh/ReachFive/identity-web-ui-sdk/tree/master) [![npm](https://img.shields.io/npm/v/@reachfive/identity-ui.svg?color=blue)](https://www.npmjs.com/package/@reachfive/identity-ui)

# ReachFive Identity Web UI SDK

## Installation

The following command installs the Identity Web UI SDK as a Node.js dependency:

```sh
npm install --save @reachfive/identity-ui
```

## Testing

To launch the tests, run:

```
npm run test
```

To update the tests snapshots:

```
npm run test:update
```

### Testing local version with hosted pages
Go to the root of this directory and run the command `python -m SimpleHTTPServer`

Then, in the file `co/reachfive/auth/views/hostedpages/auth.scala.html` of ciam-app, replace the line `<script src="https://unpkg.com/@@reachfive/identity-ui@@latest/umd/identity-ui.min.js"></script>` by `<script src="http://localhost:8000/umd/identity-ui.min.js"></script>`.

## Changelog

Please refer to [changelog](CHANGELOG.md) to see the descriptions of each release.

## License

MIT © [ReachFive](https://reachfive.co/)
