# reCAPTCHA Enterprise examples

Three pages, one per integration shape. Each is plain HTML against the local UMD build — no
bundler, no framework, nothing to install.

| Directory | Key type | Token reaches the API as |
| --- | --- | --- |
| [`recaptcha-enterprise-web-key/`](recaptcha-enterprise-web-key) | Score-based website key | `captcha_token` in the body |
| [`recaptcha-enterprise-universal-key/`](recaptcha-enterprise-universal-key) | Universal key (Policy Engine) | `captcha_token` in the body |
| [`recaptcha-enterprise-autoexecute/`](recaptcha-enterprise-autoexecute) | Universal key + AutoExecute | `X-Recaptcha-Token` header |

## Running them

The pages load `../../umd/identity-ui.js`, so build the SDK first:

```bash
npm run build
```

Then serve the repository root over HTTP — `file://` will not do, because reCAPTCHA refuses to run
on a page with an opaque origin:

```bash
npx serve -l 8080 .
```

Open `http://localhost:8080/examples/recaptcha-enterprise-web-key/`, fill in the client ID, domain
and site key, and press **Load widget**. The settings persist in `localStorage`, and can also be
passed as query parameters (`?clientId=…&domain=…&siteKey=…`) to share a preconfigured link.

Your ReachFive domain must allow `http://localhost:8080` as an origin, and the reCAPTCHA key must
list `localhost` as an allowed domain.

## What the demos are actually showing

All three pages select the captcha with the single `captcha` option:

```js
client.showAuth({
    container: 'widget',
    captcha: { provider: 'recaptcha_enterprise', siteKey: '…' },
});
```

The first two pages run **identical SDK options** — deliberately. Score-based web keys and
Universal keys share one browser integration: the same `enterprise.js`, the same
`grecaptcha.enterprise.execute(siteKey, { action })`, the same request body. Everything that
distinguishes them lives server-side:

- a **web key** returns a score, which ReachFive compares against the configured threshold, and
  never interrupts the user;
- a **Universal key** runs Policy Engine rules that can deterministically decide to show a
  challenge, so `execute()` may block on user interaction and may reject if the user dismisses it.

So the pair exists to demonstrate a *configuration* difference and its observable consequences, not
two code paths. If you are looking for where the SDK branches on key type — it doesn't, and that is
the point.

**AutoExecute** is the one that genuinely differs. The reCAPTCHA library intercepts the requests
named in the key's Google Cloud policy settings and attaches the token as a header, so the SDK must
*not* call `execute()` — doing both would mint two tokens and bill two assessments while only one
is read. Setting `autoExecute: true` on the captcha option suppresses the SDK's own call.

Each page instruments `fetch` and reports, per request, whether a token arrived in the body, in the
header, or not at all. That is the quickest way to confirm a key is wired the way you think it is.

## Caveat on the AutoExecute demo

ReachFive currently reads the captcha token from the request body. A token carried only in
`X-Recaptcha-Token` is therefore not consumed yet, and that page is written against the assumption
that backend support is coming. Until it lands, the demo is useful for confirming that the library
intercepts the right requests and that the SDK correctly stays out of the way — not for confirming
a successful assessment.
