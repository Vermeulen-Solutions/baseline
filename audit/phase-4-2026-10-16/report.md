# Site standards diagnosis

Standards 0.1.1; manifest SHA-256 a30dfde700dac0ead090ca19f743312d5bb4cd886aa51facd387c372db56b2c4.

Diagnostic scaffold; static passes do not certify the site. Missing evidence remains unverified.

| Rule | Status | Severity | Observation |
| --- | --- | --- | --- |
| package-evidence | pass | required | Observed; contents withheld |
| runtime-profile | pass | required | certified-scoped |
| dependency:astro | pass | recommendation | 7.4.0 |
| dependency:emdash | pass | recommendation | 1.3.0 |
| dependency:@astrojs/node | pass | recommendation | 11.1.8 |
| dependency:@astrojs/react | pass | recommendation | 7.1.0 |
| dependency:react | pass | recommendation | 19.2.4 |
| dependency:react-dom | pass | recommendation | 19.2.4 |
| dependency:tailwindcss | pass | recommendation | 4.3.3 |
| node-policy | warning | recommendation | Declared ^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0; executing audit on v24.21.0 |
| skills:emdash | unverified | recommendation | Measured files 0; drift 0; unavailable 0; complete membership and source currency unverified |
| skills:site | unverified | recommendation | Measured files 0; drift 0; unavailable 0; complete membership and source currency unverified |
| physical-schema | unverified | required | No explicit offline SQLite snapshot supplied |
| public-editor-runtime | unverified | recommendation | Not executed by this scaffold |
| visual-accessibility | unverified | recommendation | Not executed by this scaffold |
| locales-cache-forms | unverified | recommendation | Not executed by this scaffold |
| cloudflare-d1-r2 | unverified | recommendation | Not executed by this scaffold |
