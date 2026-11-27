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

async function ensureImagesTable(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS uploaded_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT '',
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    image_data BLOB NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`).run();
}
function validImageBytes(bytes, type) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (request.method === "OPTIONS") return new Response(null, { status: 204 });
    if (!env.DB) return json({ error: "D1 数据库尚未绑定。" }, 503);


    const publicImageMatch = url.pathname.match(/^\\/api\\/images\\/(\\d+)$/);
    if (publicImageMatch && request.method === "GET") {
      await ensureImagesTable(env.DB);
      const row = await env.DB.prepare("SELECT mime_type, size_bytes, image_data FROM uploaded_images WHERE id = ?").bind(Number(publicImageMatch[1])).first();
      if (!row) return json({ error: "图片不存在。" }, 404);
      const bytes = row.image_data instanceof Uint8Array ? row.image_data : new Uint8Array(row.image_data);
      return new Response(bytes, { headers: {
        "content-type": row.mime_type,
        "content-length": String(row.size_bytes),
        "cache-control": "public, max-age=86400",
        "x-content-type-options": "nosniff"
      }});
    }

    if (url.pathname === "/api/appearance" && request.method === "GET") {
      await env.DB.prepare("CREATE TABLE IF NOT EXISTS site_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
      const row = await env.DB.prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'appearance'").first();
      const defaults = { theme: "classic", backgroundUrl: "", backgroundFit: "cover", backgroundBlur: 20, backgroundDim: 70 };
      let appearance = defaults;
      if (row?.setting_value) {
        try { appearance = { ...defaults, ...JSON.parse(row.setting_value) }; } catch {}
      }
      return json({ appearance }, 200, { "cache-control": "public, max-age=30" });
    }

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

      if (url.pathname === "/api/admin/images" && request.method === "GET") {
        await ensureImagesTable(env.DB);
        const { results } = await env.DB.prepare("SELECT id, name, mime_type, size_bytes, created_at FROM uploaded_images ORDER BY id DESC").all();
        const total = (results || []).reduce((sum, item) => sum + Number(item.size_bytes || 0), 0);
        return json({ items: results || [], count: (results || []).length, totalBytes: total, maxCount: 20, maxTotalBytes: 4 * 1024 * 1024, maxImageBytes: 200 * 1024 });
      }
      if (url.pathname === "/api/admin/images" && request.method === "POST") {
        await ensureImagesTable(env.DB);
        let form;
        try { form = await request.formData(); } catch { return json({ error: "无法读取上传文件。" }, 400); }
        const file = form.get("image");
        if (!file || typeof file.arrayBuffer !== "function") return json({ error: "请选择一张图片。" }, 400);
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return json({ error: "仅支持 JPG、PNG 或 WebP 图片。" }, 400);
        if (file.size <= 0 || file.size > 200 * 1024) return json({ error: "压缩后的图片必须在 200 KB 以内。" }, 413);
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (!validImageBytes(bytes, file.type)) return json({ error: "图片格式校验失败，请重新选择图片。" }, 400);
        const stats = await env.DB.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(size_bytes), 0) AS total FROM uploaded_images").first();
        if (Number(stats?.count || 0) >= 20) return json({ error: "图片库最多保存 20 张，请先删除不需要的图片。" }, 409);
        if (Number(stats?.total || 0) + bytes.byteLength > 4 * 1024 * 1024) return json({ error: "图片库总容量不能超过 4 MB，请先删除部分图片。" }, 409);
        const name = cleanText(file.name || "image", 120) || "image";
        const result = await env.DB.prepare("INSERT INTO uploaded_images (name, mime_type, size_bytes, image_data) VALUES (?, ?, ?, ?)").bind(name, file.type, bytes.byteLength, bytes).run();
        return json({ ok: true, id: result.meta.last_row_id, name, mime_type: file.type, size_bytes: bytes.byteLength, url: "/api/images/" + result.meta.last_row_id }, 201);
      }
      const imageMatch = url.pathname.match(/^\\/api\\/admin\\/images\\/(\\d+)$/);
      if (imageMatch && request.method === "DELETE") {
        await ensureImagesTable(env.DB);
        await env.DB.prepare("DELETE FROM uploaded_images WHERE id = ?").bind(Number(imageMatch[1])).run();
        return json({ ok: true });
      }


      if (url.pathname === "/api/admin/appearance" && request.method === "GET") {
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS site_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
        const row = await env.DB.prepare("SELECT setting_value FROM site_settings WHERE setting_key = 'appearance'").first();
        const defaults = { theme: "classic", backgroundUrl: "", backgroundFit: "cover", backgroundBlur: 20, backgroundDim: 70 };
        let appearance = defaults;
        if (row?.setting_value) {
          try { appearance = { ...defaults, ...JSON.parse(row.setting_value) }; } catch {}
        }
        return json({ appearance });
      }
      if (url.pathname === "/api/admin/appearance" && request.method === "PUT") {
        const data = await readBody(request);
        const themes = ["classic", "tech", "minimal", "glass", "nature", "ocean", "sunset", "sakura", "cyberpunk", "aurora", "midnight", "lavender", "cream", "forest", "desert", "mono", "retro", "nordic", "rose", "emerald"];
        const fits = ["cover", "contain", "center"];
        const theme = themes.includes(data?.theme) ? data.theme : null;
        const backgroundUrl = cleanText(data?.backgroundUrl, 1000);
        const backgroundFit = fits.includes(data?.backgroundFit) ? data.backgroundFit : null;
        const blur = Number(data?.backgroundBlur);
        const dim = Number(data?.backgroundDim);
        if (!theme || !backgroundFit || !safeUrl(backgroundUrl) || !Number.isFinite(blur) || !Number.isFinite(dim)) {
          return json({ error: "请检查风格、背景图片网址和显示参数。" }, 400);
        }
        const appearance = {
          theme,
          backgroundUrl,
          backgroundFit,
          backgroundBlur: Math.max(0, Math.min(30, Math.round(blur))),
          backgroundDim: Math.max(0, Math.min(90, Math.round(dim))),
        };
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS site_settings (setting_key TEXT PRIMARY KEY, setting_value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
        await env.DB.prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES ('appearance', ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value, updated_at=CURRENT_TIMESTAMP").bind(JSON.stringify(appearance)).run();
        return json({ ok: true, appearance });
      }

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
