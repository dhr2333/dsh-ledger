#!/usr/bin/env node
/**
 * Add a bundle to a DSH profile's `dsh.profile.bundles` list.
 *
 * `dsh plugin add` only installs the package; the profile also has to select
 * the bundle so its patch layer is composed. The installer calls this after
 * pnpm finishes. Idempotent: a bundle already selected is left untouched.
 *
 * Usage: node register-bundle.mjs <profile-package.json> <bundle-name>
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const [file, name] = process.argv.slice(2);
if (!file || !name) {
  console.error('usage: register-bundle.mjs <profile-package.json> <bundle-name>');
  process.exit(2);
}
if (!existsSync(file)) {
  console.error(`profile package.json not found: ${file}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(file, 'utf8'));
manifest.dsh ??= {};
manifest.dsh.profile ??= {};
const bundles = Array.isArray(manifest.dsh.profile.bundles) ? manifest.dsh.profile.bundles : [];
if (bundles.includes(name)) {
  console.log(`bundle already selected: ${name}`);
  process.exit(0);
}
bundles.push(name);
manifest.dsh.profile.bundles = bundles;
writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`selected bundle: ${name}`);
