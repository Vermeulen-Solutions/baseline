---
bump: none
platforms: [emdash, static]
areas: [tooling]
adoption: none
visible: no
database: no
---

# site:files: transitive blocking and a stricter import scan

`site:files` checked each adoption once, in path order, so a file importing a blocked file that sorted after it was still adopted. Blocking now repeats until nothing changes.

The import scan also ignores comments (a JSDoc `import('…')` type is not an import) and strings in tests, and reads only real `import`/`export … from`, side-effect, dynamic and CSS `@import` statements.

## For sites

Nothing to do: the tool runs from the Baseline checkout.
