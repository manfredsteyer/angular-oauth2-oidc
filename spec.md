# TSLint To ESLint Migration Spec

## Goal

Replace any remaining project TSLint setup with a clean ESLint setup. Migrate existing TSLint rules into ESLint only when the migrated rule passes against the current source without requiring source changes.

This step is intentionally configuration focused. Source files should not be changed to satisfy lint rules during this migration.

## Scope

1. Search workspace files for TSLint configuration and usage.
2. Exclude dependencies, build output, generated documentation, and vendored files from migration decisions.
3. Identify project TSLint configs, direct `tslint` dependencies, direct `codelyzer` dependencies, old TSLint lint builders, and `tslint:disable` comments.
4. Migrate only rules that exist in the project TSLint configuration.
5. Keep only migrated ESLint rules that are green on the current source.
6. Remove project TSLint config files and TSLint package references after the ESLint setup is verified.

## Non Goals

1. Do not rewrite source files for lint compliance.
2. Do not broaden lint coverage to unrelated projects unless that was already part of the TSLint setup.
3. Do not introduce new lint policy unrelated to the old TSLint rules.
4. Do not use formatting rules in ESLint when Prettier already owns formatting.
5. Do not keep TSLint as a bridge dependency unless no native ESLint equivalent exists and the rule is required.

## Migration Plan

1. Record the current lint baseline with `npm run lint`.
2. Search for project TSLint files and references:
   `tslint.json`, nested TSLint configs, `tslint`, `codelyzer`, TSLint builders, and `tslint:disable` comments.
3. Compare the working tree against `HEAD` before implementation because lint migration edits already exist locally.
4. Map each discovered TSLint rule to the closest supported ESLint rule from ESLint core, `typescript-eslint`, or `angular-eslint`.
5. Add candidate migrated rules to `eslint.config.js`.
6. Run ESLint against the configured lint target.
7. If a migrated rule creates lint errors, remove that rule from this migration.
8. Repeat until the migrated rule set is green.
9. Remove project TSLint config files.
10. Remove direct `tslint` and `codelyzer` entries from `package.json`.
11. Refresh the lockfile if package entries were removed.
12. Run final verification with `npm run lint`.

## Rule Policy

1. Prefer native ESLint, `typescript-eslint`, and `angular-eslint` equivalents.
2. Preserve the old TSLint intent only where a stable equivalent exists.
3. Prefer warning free rules over partial compatibility.
4. Avoid rules that require type information unless they are part of the old TSLint behavior and pass without unacceptable lint cost.
5. Disable or omit any migrated rule that fails on current source.
6. Migrate inline `tslint:disable` comments only when the equivalent ESLint rule is retained.

## Acceptance Criteria

1. No project TSLint config remains.
2. `package.json` has no direct `tslint` or `codelyzer` dependency.
3. `eslint.config.js` contains only migrated rules that pass on the current source.
4. `npm run lint` passes.
5. No source files are changed for lint compliance in this step.
6. Any removed TSLint rule is documented in the final migration summary with the reason it was not kept.

## Baseline From HEAD

1. `package.json` directly depends on `tslint` and `codelyzer`.
2. Root `tslint.json` uses `node_modules/codelyzer` as its rules directory.
3. `projects/angular-oauth2-oidc-jwks/tslint.json` extends the root config and overrides only selector rules.
4. The current lint script is `npm run lint`, which runs `ng lint lib`.
5. The workspace already has an ESLint flat config in `eslint.config.js`.

## TSLint Rule Inventory

Rules with clear ESLint candidates:

1. Core JavaScript rules: `no-arg`, `no-console`, `no-construct`, `no-debugger`, `no-duplicate-super`, `no-eval`, `no-string-throw`, `no-switch-case-fall-through`, `no-unnecessary-initializer`, `no-var-keyword`, `radix`, `import-blacklist`.
2. TypeScript rules: `callable-types`, `interface-over-type-literal`, `no-empty-interface`, `no-inferrable-types`, `no-misused-new`, `no-non-null-assertion`, `no-unused-expression`.
3. Angular rules: `component-class-suffix`, `component-selector`, `directive-class-suffix`, `directive-selector`, `no-input-rename`, `no-inputs-metadata-property`, `no-output-on-prefix`, `no-output-rename`, `no-outputs-metadata-property`, `use-lifecycle-interface`, `use-pipe-transform-interface`.

Rules to omit unless a non-formatting equivalent is useful and green:

1. Formatting rules owned by Prettier: `comment-format`, `eofline`, `import-spacing`, `indent`, `max-line-length`, `no-trailing-whitespace`, `one-line`, `quotemark`, `semicolon`, `typedef-whitespace`, `whitespace`.
2. Rules disabled in TSLint: `curly`, `member-access`, `no-empty`, `no-string-literal`, `object-literal-sort-keys`, `prefer-const`, `variable-name`.
3. Rules without a low-cost direct migration target in this pass: `deprecation`, `forin`, `member-ordering`, `no-bitwise`, `no-shadowed-variable`, `triple-equals`, `unified-signatures`, `no-host-metadata-property`.

## Working Tree Guardrail

At spec time, the working tree already contains local edits to lint configuration, package files, deleted TSLint configs, and sample source files. Treat those edits as concurrent work: re-read every target file immediately before editing, avoid reverting them, and keep implementation changes scoped to lint configuration and package cleanup unless the user explicitly approves source edits.
