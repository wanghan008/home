const COOKIE = "blog_admin";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}
async function makeSession(secret) {
  const payload = String(Date.now() + SESSION_SECONDS * 1000) + "." + crypto.randomUUID();
  return payload + "." + await sign(payload, secret);
}
async function validSession(request, secret) {
  const header = request.headers.get("Cookie") || "";
  const token = header.split(";").map(x => x.trim()).find(x => x.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || Number(parts[0]) < Date.now()) return false;
  return (await sign(parts[0] + "." + parts[1], secret)) === parts[2];
}
function cookie(value, maxAge) {
  return COOKIE + "=" + value + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + maxAge;
}
function validDate(value) {
  if (typeof value !== "string" || value.length !== 10) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function safeUrl(value, allowEmpty = true) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return allowEmpty;
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  try { const u = new URL(v); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
}
function cleanText(value, max, required = false) {
  if (typeof value !== "string") return required ? null : "";
  const v = value.trim();
  if (required && !v) return null;
  return v.slice(0, max);
}
function cleanOrder(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) ? Math.max(-10000, Math.min(10000, n)) : 0;
}
function cleanEnabled(value) { return value === false || value === 0 ? 0 : 1; }
async function readBody(request) {
  try { return await request.json(); } catch { return null; }
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204 });
    if (!env.DB) return json({ error: "D1 数据库尚未绑定。" }, 503);


    if (url.pathname === "/api/homepage" && request.method === "GET") {
      const [modules, links] = await Promise.all([
        env.DB.prepare("SELECT id, title, subtitle, description, image_url, link_url, icon, sort_order FROM homepage_modules WHERE enabled = 1 ORDER BY sort_order, id").all(),
        env.DB.prepare("SELECT id, module_id, title, url, description, icon, sort_order FROM homepage_links WHERE enabled = 1 ORDER BY sort_order, id").all()
      ]);
      return json({ modules: modules.results || [], links: links.results || [] }, 200, { "cache-control": "public, max-age=60" });
    }

    if (url.pathname === "/api/moods" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT id, title, content, mood_date, created_at, updated_at FROM moods WHERE published = 1 ORDER BY mood_date DESC, id DESC LIMIT 100"
      ).all();
      return json({ items: results || [] }, 200, { "cache-control": "public, max-age=60" });
    }

    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({ error: "后台密钥尚未配置，请先设置 Cloudflare Secrets。" }, 503);
      const data = await readBody(request);
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

      if (url.pathname === "/api/admin/homepage/modules" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM homepage_modules ORDER BY sort_order, id").all();
        return json({ items: results || [] });
      }
      if (url.pathname === "/api/admin/homepage/modules" && request.method === "POST") {
        const data = await readBody(request);
        const title = cleanText(data?.title, 100, true);
        const subtitle = cleanText(data?.subtitle, 160);
        const description = cleanText(data?.description, 5000);
        const image = cleanText(data?.image_url, 1000);
        const link = cleanText(data?.link_url, 1000);
        if (!title || subtitle === null || description === null || image === null || link === null || !safeUrl(image) || !safeUrl(link)) return json({ error: "请检查模块标题、文字和图片/跳转网址。" }, 400);
        const result = await env.DB.prepare("INSERT INTO homepage_modules (title, subtitle, description, image_url, link_url, icon, sort_order, enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(title, subtitle, description, image, link, cleanText(data.icon, 40), cleanOrder(data.sort_order), cleanEnabled(data.enabled)).run();
        return json({ ok: true, id: result.meta.last_row_id }, 201);
      }
      if (url.pathname === "/api/admin/homepage/links" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM homepage_links ORDER BY sort_order, id").all();
        return json({ items: results || [] });
      }
      if (url.pathname === "/api/admin/homepage/links" && request.method === "POST") {
        const data = await readBody(request);
        const title = cleanText(data?.title, 100, true);
        const target = cleanText(data?.url, 1000, true);
        if (!title || !target || !safeUrl(target, false)) return json({ error: "请填写有效的链接名称和 http/https 网址或站内路径。" }, 400);
        const moduleId = data.module_id == null || data.module_id === "" ? null : Number(data.module_id);
        if (moduleId !== null && (!Number.isSafeInteger(moduleId) || moduleId <= 0)) return json({ error: "所属模块无效。" }, 400);
        const result = await env.DB.prepare("INSERT INTO homepage_links (module_id, title, url, description, icon, sort_order, enabled) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(moduleId, title, target, cleanText(data.description, 300), cleanText(data.icon, 40), cleanOrder(data.sort_order), cleanEnabled(data.enabled)).run();
        return json({ ok: true, id: result.meta.last_row_id }, 201);
      }
      const moduleMatch = url.pathname.match(/^\/api\/admin\/homepage\/modules\/(\d+)$/);
      if (moduleMatch) {
        const id = Number(moduleMatch[1]);
        if (request.method === "PUT") {
          const data = await readBody(request);
          const title = cleanText(data?.title, 100, true);
          const subtitle = cleanText(data?.subtitle, 160);
          const description = cleanText(data?.description, 5000);
          const image = cleanText(data?.image_url, 1000);
          const link = cleanText(data?.link_url, 1000);
          if (!title || subtitle === null || description === null || image === null || link === null || !safeUrl(image) || !safeUrl(link)) return json({ error: "请检查模块标题、文字和图片/跳转网址。" }, 400);
          await env.DB.prepare("UPDATE homepage_modules SET title=?, subtitle=?, description=?, image_url=?, link_url=?, icon=?, sort_order=?, enabled=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(title, subtitle, description, image, link, cleanText(data.icon, 40), cleanOrder(data.sort_order), cleanEnabled(data.enabled), id).run();
          return json({ ok: true });
        }
        if (request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM homepage_modules WHERE id=?").bind(id).run();
          return json({ ok: true });
        }
      }
      const linkMatch = url.pathname.match(/^\/api\/admin\/homepage\/links\/(\d+)$/);
      if (linkMatch) {
        const id = Number(linkMatch[1]);
        if (request.method === "PUT") {
          const data = await readBody(request);
          const title = cleanText(data?.title, 100, true);
          const target = cleanText(data?.url, 1000, true);
          const moduleId = data.module_id == null || data.module_id === "" ? null : Number(data.module_id);
          if (!title || !target || !safeUrl(target, false) || (moduleId !== null && (!Number.isSafeInteger(moduleId) || moduleId <= 0))) return json({ error: "请检查链接名称、网址和所属模块。" }, 400);
          await env.DB.prepare("UPDATE homepage_links SET module_id=?, title=?, url=?, description=?, icon=?, sort_order=?, enabled=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(moduleId, title, target, cleanText(data.description, 300), cleanText(data.icon, 40), cleanOrder(data.sort_order), cleanEnabled(data.enabled), id).run();
          return json({ ok: true });
        }
        if (request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM homepage_links WHERE id=?").bind(id).run();
          return json({ ok: true });
        }
      }
      if (url.pathname === "/api/admin/moods" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT id, title, content, mood_date, published, created_at, updated_at FROM moods ORDER BY mood_date DESC, id DESC LIMIT 200"
        ).all();
        return json({ items: results || [] });
      }
      if (url.pathname === "/api/admin/moods" && request.method === "POST") {
        const data = await readBody(request);
        if (!data || !String(data.title || "").trim() || !String(data.content || "").trim() || !validDate(data.mood_date)) {
          return json({ error: "标题、正文和有效日期不能为空。" }, 400);
        }
        const result = await env.DB.prepare(
          "INSERT INTO moods (title, content, mood_date, published) VALUES (?, ?, ?, ?)"
        ).bind(String(data.title).trim().slice(0, 120), String(data.content).slice(0, 20000), data.mood_date, 1).run();
        return json({ ok: true, id: result.meta.last_row_id }, 201);
      }
      const prefix = "/api/admin/moods/";
      if (url.pathname.startsWith(prefix)) {
        const idText = url.pathname.slice(prefix.length);
        const id = Number(idText);
        if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== idText) return json({ error: "文章编号无效。" }, 400);
        if (request.method === "PUT") {
          const data = await readBody(request);
          if (!data || !String(data.title || "").trim() || !String(data.content || "").trim() || !validDate(data.mood_date)) {
            return json({ error: "标题、正文和有效日期不能为空。" }, 400);
          }
          await env.DB.prepare(
            "UPDATE moods SET title = ?, content = ?, mood_date = ?, published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
          ).bind(String(data.title).trim().slice(0, 120), String(data.content).slice(0, 20000), data.mood_date, 1, id).run();
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
