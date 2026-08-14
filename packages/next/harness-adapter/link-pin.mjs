#!/usr/bin/env node
/**
 * link-pin.mjs — create the local symlink farm from the pinned Harness build
 * so package-name imports (@deepseek-ai/*) resolve through their exports maps.
 *
 * Usage:
 *   node packages/next/harness-adapter/link-pin.mjs [pin-dir]
 *   (pin-dir defaults to HARNESS_PIN_DIR or the verified /tmp/dsh-pin)
 */
import { ensureFarm, resolvePinDir } from "./adapter.mjs";

const pin = process.argv[2] ?? resolvePinDir();
if (!pin) {
  console.error("pinned Harness build not found. Build it first (see P1-EVIDENCE §1) and pass the dir or set HARNESS_PIN_DIR.");
  process.exit(1);
}
const created = await ensureFarm(pin);
console.log(JSON.stringify({ pin, seamsLinked: created.length, created }, null, 2));
