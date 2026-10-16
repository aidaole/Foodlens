const encoder = new TextEncoder();
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
function unb64(s: string) {
  return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
    c.charCodeAt(0),
  );
}
async function key(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
export async function sign(secret: string, text: string) {
  return b64url(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(text)),
    ),
  );
}
export async function issueIdentity(secret: string) {
  const id = crypto.randomUUID();
  return { id, token: id + '.' + await sign(secret, 'installation:' + id) };
}
export async function verifyIdentity(secret: string, token: string): Promise<string | null> {
  try {
    const [id, signature, extra] = token.split('.');
    if (token.length > 100 || extra || !/^[0-9a-f-]{36}$/.test(id) || !signature) return null;
    return await crypto.subtle.verify('HMAC', await key(secret), unb64(signature), encoder.encode('installation:' + id)) ? id : null;
  } catch { return null; }
}
export async function issueSession(secret: string, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + 3600;
  const payload = b64url(
    encoder.encode(JSON.stringify({ id: crypto.randomUUID(), exp: expiresAt })),
  );
  return { token: payload + "." + (await sign(secret, payload)), expiresAt };
}
export async function verifySession(
  secret: string,
  token: string,
  now = Date.now(),
): Promise<string | null> {
  try {
    if (token.length > 500) return null;
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return null;
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        await key(secret),
        unb64(signature),
        encoder.encode(payload),
      ))
    )
      return null;
    const p = JSON.parse(new TextDecoder().decode(unb64(payload)));
    if (
      typeof p.id !== "string" ||
      !/^[0-9a-f-]{36}$/.test(p.id) ||
      !Number.isInteger(p.exp) ||
      p.exp <= now / 1000 ||
      p.exp > now / 1000 + 3600
    )
      return null;
    return p.id;
  } catch {
    return null;
  }
}
