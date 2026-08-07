// One-off script: create a read-only "Guest" role + login in the live Supabase DB.
// Usage: node scripts/create-guest.mjs
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

const env = loadEnv(resolve(process.cwd(), ".env.local"));
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE env vars in .env.local");
  process.exit(1);
}

const GUEST_EMAIL = "guest@smart.com";
const GUEST_PASSWORD = "Guest@1234";

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation,resolution=merge-duplicates",
};

const baseHeaders = { apikey: key, Authorization: `Bearer ${key}` };

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text };
  }
}

// 1. Ensure Guest role
console.log("Creating/ensuring Guest role...");
const roleRes = await fetch(`${url}/rest/v1/roles_permissions`, {
  method: "POST",
  headers,
  body: JSON.stringify({ role_name: "Guest", max_discount_percentage: 0, allow_due: false }),
});
let roleInfo = await json(roleRes);
let roleId = Array.isArray(roleInfo.body) ? roleInfo.body[0]?.role_id : null;
if (!roleId) {
  const listRes = await fetch(`${url}/rest/v1/roles_permissions?role_name=eq.Guest&select=role_id`, { headers: baseHeaders });
  const list = await json(listRes);
  roleId = list.body?.[0]?.role_id;
}
console.log("Guest role_id:", roleId);

// 2. Ensure auth user
console.log("Creating/ensuring auth user...");
let authRes = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: { ...headers, Prefer: undefined, "Content-Type": "application/json" },
  body: JSON.stringify({ email: GUEST_EMAIL, password: GUEST_PASSWORD, email_confirm: true }),
});
let authInfo = await json(authRes);
let authUserId = authInfo.body?.id;
if (!authUserId) {
  const listRes = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, { headers: baseHeaders });
  const list = await json(listRes);
  authUserId = list.body?.users?.find((u) => u.email === GUEST_EMAIL)?.id;
}
console.log("Guest auth user_id:", authUserId);

// 3. Ensure users profile row
if (authUserId && roleId) {
  console.log("Creating/ensuring users profile...");
  const profRes = await fetch(`${url}/rest/v1/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: authUserId,
      username: "guest",
      full_name: "Guest User",
      role_id: roleId,
      salesperson_nickname: "Guest",
      is_active: true,
    }),
  });
  const profInfo = await json(profRes);
  console.log("Profile insert status:", profInfo.status);
}

console.log("\nDone. Guest login:");
console.log("  email:   " + GUEST_EMAIL);
console.log("  password:" + GUEST_PASSWORD);
