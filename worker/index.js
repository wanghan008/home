const COOKIE = "blog_admin";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
function b64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}
async function makeSession(secret) {
  const payload = `${Date.now() + SESSION_SECONDS * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${await sign(payload, secret)}`;
}
async function validSession(request, secret) {
  const cookie = request.headers.get("Cookie") || "";
  const token = cookie.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || Number(parts[0]) < Date.now()) return false;
  const payload = parts.slice(0, 2).join(".");
  return (await sign(payload, secret)) === parts[2];
}
function validDate(value) {\n  if (typeof value !== "string" || value.length !== 10) return false;\n  const parsed = new Date(value + "T00:00:00Z");\n  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;\n}\nfunction cookie(value, maxAge) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
async function body(request) {
  try { return await request.json(); } catch { return null; }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (!env.DB) return json({ error: "数据库尚未绑定，请先完成 Cloudflare D1 配置。" }, 503);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "Allow": "GET, POST, PUT, DELETE, OPTIONS" } });

    if (url.pathname === "/api/moods" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT id, title, content, mood_date, created_at, updated_at FROM moods WHERE published = 1 ORDER BY mood_date DESC, id DESC LIMIT 100").all();
      return json({ items: results || [] }, 200, { "cache-control": "public, max-age=60" });
    }

    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: "后台密钥尚未配置，请先设置 Cloudflare Secrets。" }, 503);
      const data = await body(request);
      if (!data || typeof data.password !== "string" || data.password.length > 256) return json({ error: "请输入管理员密码。" }, 400);
      if (data.password !== env.ADMIN_PASSWORD) return json({ error: "密码不正确。" }, 401);
      const token = await makeSession(env.SESSION_SECRET);
      return json({ ok: true }, 200, { "set-cookie": cookie(token, SESSION_SECONDS) });
    }
    if (url.pathname === "/api/admin/logout" && request.method === "POST") {
      return json({ ok: true }, 200, { "set-cookie": cookie("", 0) });
    }
    if (url.pathname.startsWith("/api/admin/")) {
      if (!env.SESSION_SECRET || !(await validSession(request, env.SESSION_SECRET))) return json({ error: "登录已失效，请重新登录。" }, 401);
      if (url.pathname === "/api/admin/me" && request.method === "GET") return json({ ok: true });
      if (url.pathname === "/api/admin/moods" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT id, title, content, mood_date, published, created_at, updated_at FROM moods ORDER BY mood_date DESC, id DESC LIMIT 200").all();
        return json({ items: results || [] });
      }
      if (url.pathname === "/api/admin/moods" && request.method === "POST") {
        const data = await body(request);
        if (!data || !String(data.title || "").trim() || !String(data.content || "").trim() || !/^\\d{4}-\\d{2}-\\d{2}$/.test(data.mood_date || "")) return json({ error: "标题、正文和有效日期不能为空。" }, 400);
        const result = await env.DB.prepare("INSERT INTO moods (title, content, mood_date, published) VALUES (?, ?, ?, ?)").bind(String(data.title).trim().slice(0, 120), String(data.content).slice(0, 20000), data.mood_date, data.published ? 1 : 0).run();
        return json({ ok: true, id: result.meta.last_row_id }, 201);
      }
      const match = url.pathname.match(/^\\/api\\/admin\\/moods\\/(\\d+)$/);
      if (match) {
        const id = Number(match[1]);
        if (request.method === "PUT") {
          const data = await body(request);
          if (!data || !String(data.title || "").trim() || !String(data.content || "").trim() || !/^\\d{4}-\\d{2}-\\d{2}$/.test(data.mood_date || "")) return json({ error: "标题、正文和有效日期不能为空。" }, 400);
          await env.DB.prepare("UPDATE moods SET title = ?, content = ?, mood_date = ?, published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(String(data.title).trim().slice(0, 120), String(data.content).slice(0, 20000), data.mood_date, data.published ? 1 : 0, id).run();
          return json({ ok: true });
        }
        if (request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM moods WHERE id = ?").bind(id).run();
          return json({ ok: true });
        }
      }
      return json({ error: "接口不存在。" }, 404);
    }
    return json({ error: "接口不存在。" }, 404);
  },
};