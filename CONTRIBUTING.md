# Contributing

## Local development against ciam-app

The Hosted Page served by `ciam-app` loads this SDK from a CDN build
(`https://cdn.jsdelivr.net/npm/@reachfive/identity-ui@<version>/umd/identity-ui.min.js`). To see local
changes live on a real Hosted Page, point `ciam-app` at a local build.

### 1. Build in watch mode

```sh
npm run watch
```

### 2. Serve the build

Serve the `umd/` folder over HTTP on some local port, e.g.:

```sh
npx serve umd -l 8000
```

### 3. Point ciam-app's Hosted Page at it

Refer to [Serving a local `identity-ui` build](https://github.com/ReachFive/ciam-app#local-identity-ui) in its README.

### Optional: developing against a local `@reachfive/identity-core` too

If you're also iterating on the core SDK, symlink it instead of installing the published version:

```sh
ln -s ../../../identity-web-core-sdk node_modules/@reachfive/identity-core
```

(adjust the relative path to wherever you cloned `identity-web-core-sdk` next to this repo)
