/**
 * manifest.mjs — P1 runtime: content-hashed RuntimeManifest.
 *
 * Plan §11.2: the manifest pins every semantic input; `instrumentVersion`
 * hashes the manifest so any semantic change yields a new instrument class.
 * The manifest itself never contains the instrumentVersion (no self-reference).
 */
import crypto from "node:crypto";
import { canonicalJson } from "../contracts/epoch-rules.mjs";

export const MANIFEST_SCHEMA = "runtime-manifest/1";

export { canonicalJson };

function sha256Hex(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

/**
 * Build the manifest from explicit semantic inputs. Returns
 * {manifest, digest, instrumentVersion}.
 */
export function buildManifest(inputs) {
  const manifest = {
    schema: MANIFEST_SCHEMA,
    epoch: "native-next-v1",
    legacyBaselineCommit: "1460441528069465dca7263dba3e9ac01b18c78a",
    harnessBaselineCommit: "47f943859bef60e4160492346772ded9b24f765a",
    retryPolicy: "none",
    compaction: "off",
    ...inputs,
  };
  const bytes = Buffer.from(canonicalJson(manifest));
  const digest = sha256Hex(bytes);
  return { manifest, bytes, digest, instrumentVersion: `native-next-v1-${digest.slice(0, 16)}` };
}
