CREATE TABLE IF NOT EXISTS homepage_modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  link_url TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_homepage_modules_enabled_order
  ON homepage_modules (enabled, sort_order, id);

CREATE TABLE IF NOT EXISTS homepage_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module_id INTEGER,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES homepage_modules(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_homepage_links_module_order
  ON homepage_links (module_id, enabled, sort_order, id);

INSERT INTO homepage_links (title, url, icon, sort_order)
SELECT '心情日记', 'https://ta.whan.ipv64.de/blog', 'Blog', 1
WHERE NOT EXISTS (SELECT 1 FROM homepage_links WHERE url = 'https://ta.whan.ipv64.de/blog');
INSERT INTO homepage_links (title, url, icon, sort_order)
SELECT '管理文章', 'https://ta.whan.ipv64.de/admin', 'Book', 2
WHERE NOT EXISTS (SELECT 1 FROM homepage_links WHERE url = 'https://ta.whan.ipv64.de/admin');
INSERT INTO homepage_links (title, url, icon, sort_order)
SELECT '捕鱼游戏', 'https://fish.studygame.ipv64.de/', 'Fire', 3
WHERE NOT EXISTS (SELECT 1 FROM homepage_links WHERE url = 'https://fish.studygame.ipv64.de/');
INSERT INTO homepage_links (title, url, icon, sort_order)
SELECT '雷霆战机', 'https://han.studygame.ipv64.de/', 'CompactDisc', 4
WHERE NOT EXISTS (SELECT 1 FROM homepage_links WHERE url = 'https://han.studygame.ipv64.de/');
