import fs from "fs";
import path from "path";

/**
 * Ensures our in-project iOS Capacitor plugin classes are present in the generated
 * ios/App/App/capacitor.config.json packageClassList.
 *
 * Why:
 * - Capacitor auto-registers plugins from this list at runtime.
 * - `npx cap sync ios` regenerates this file, so we patch it after sync.
 */

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, "ios", "App", "App", "capacitor.config.json");

const REQUIRED_CLASSES = ["FCMTokenPlugin"];

if (!fs.existsSync(configPath)) {
  console.error(`[patch-ios-capacitor-config] Missing file: ${configPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(configPath, "utf8");
let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.error("[patch-ios-capacitor-config] Failed to parse capacitor.config.json");
  throw e;
}

const list = Array.isArray(json.packageClassList) ? json.packageClassList : [];
const set = new Set(list);
for (const cls of REQUIRED_CLASSES) set.add(cls);
json.packageClassList = Array.from(set);

fs.writeFileSync(configPath, JSON.stringify(json, null, 2) + "\n");
console.log(`[patch-ios-capacitor-config] Ensured: ${REQUIRED_CLASSES.join(", ")}`);

