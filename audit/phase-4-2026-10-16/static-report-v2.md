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
| node-policy | pass | recommendation | Declared ^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0; executing audit on v24.21.0 |
| capability:server | pass | required | server |
| capability:adapter | pass | required | node |
| capability:cms | pass | required | {"emdash":true,"react":true,"dynamic":false} |
| capability:storage | pass | required | {"sqlite":true,"local":true} |
| capability:i18n | not-applicable | required | absent |
| capability:cache-hints | not-applicable | recommendation | absent |
| schema-prebuild | pass | recommendation | Command presence is static evidence; missing DB still needs measurement |
| skills:emdash | unverified | required | {"presentSkills":3,"missingSkills":0,"measuredFiles":20,"missingFiles":0,"extraFiles":0,"changedFiles":0,"refusedEntries":0,"manifestMembership":"unverified","sourceCurrency":"unverified"} |
| skills:site | unverified | required | {"presentSkills":8,"missingSkills":0,"measuredFiles":83,"missingFiles":0,"extraFiles":0,"changedFiles":0,"refusedEntries":0,"manifestMembership":"unverified","sourceCurrency":"unverified"} |
| upstream-currency | unverified | recommendation | Offline inventory is not an upstream freshness check |
| physical-schema | unverified | required | No explicit offline SQLite snapshot supplied |
| public-editor-runtime | unverified | recommendation | Not executed by static diagnosis |
| visual-accessibility | unverified | recommendation | Not executed by static diagnosis |
| forms-provider-delivery | unverified | recommendation | Not executed by static diagnosis |
| cloudflare-d1-r2 | unverified | recommendation | Not executed by static diagnosis |
