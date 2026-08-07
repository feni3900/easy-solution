"use client";

let cachedRole: string | null = null;
let inFlight: Promise<string> | null = null;

export async function getClientRole(): Promise<string> {
  if (cachedRole !== null) return cachedRole;
  if (!inFlight) {
    inFlight = fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { role_name: "" }))
      .then((d) => {
        cachedRole = (d?.role_name ?? "") as string;
        return cachedRole;
      })
      .catch(() => {
        cachedRole = "";
        return cachedRole;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

export function isGuestRole(role: string | null | undefined): boolean {
  return role === "Guest";
}

export async function guardedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes("/auth/v1/")) {
      const role = await getClientRole();
      if (isGuestRole(role)) {
        return new Response(JSON.stringify({ message: "Guest account is read-only", code: "42501", details: "", hint: "" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
  }
  return fetch(input, init);
}
