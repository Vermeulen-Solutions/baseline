# Database structural inspection

Status: **drift**; exit 1.

Structural/registry/migration parity only; no content equality, D1 query-limit or Worker/R2 certification

| Source | Schema SHA-256 |
| --- | --- |
| 1 | 5bc6eaceb5bc0c58f166e69180c9a7a6a370d5e447df4100d072cbb0268aac1b |
| 2 | 0f95069b3cbcb1437ac9b43cb6c112f1118da94787d63b151d62348a3ed279c0 |

| Source | Collection table | Physical columns | Logical fields | Generated/hidden |
| --- | --- | --- | --- | --- |
| 1 | ec_pages | 57 | 2 | 0 |
| 2 | ec_pages | 17 | 2 | 0 |

Issues: 2; unverified scopes: none.

- {"rule":"physical-column-budget","table":"ec_pages","physicalColumns":57,"limit":50}
- {"rule":"unregistered-column-review","table":"ec_pages","columns":["legacy_0","legacy_1","legacy_2","legacy_3","legacy_4","legacy_5","legacy_6","legacy_7","legacy_8","legacy_9","legacy_10","legacy_11","legacy_12","legacy_13","legacy_14","legacy_15","legacy_16","legacy_17","legacy_18","legacy_19","legacy_20","legacy_21","legacy_22","legacy_23","legacy_24","legacy_25","legacy_26","legacy_27","legacy_28","legacy_29","legacy_30","legacy_31","legacy_32","legacy_33","legacy_34","legacy_35","legacy_36","legacy_37","legacy_38","legacy_39"],"action":"Review retained legacy/generated columns; never auto-drop"}

Detailed structural, registry and optional seed-subset evidence: [report.json](report.json).
