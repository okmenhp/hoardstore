// ============================================================
// SITEMAP.XML ĐỘNG CHO GOOGLE
// ------------------------------------------------------------
// Trả về sitemap.xml luôn mới nhất, lấy trực tiếp từ Supabase:
// - Trang chủ, /products, /about, /contact
// - Tất cả danh mục (/products/<slug>)
// - Tất cả sản phẩm (/products/<danh-muc>/<san-pham>)
//
// Kích hoạt trong netlify.toml:
//   [[edge_functions]]
//     path = "/sitemap.xml"
//     function = "sitemap"
// ============================================================

function siteUrl(request) {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function escapeXml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, lastmod, changefreq, priority) {
  const l = escapeXml(loc);
  const m = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "";
  const c = changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : "";
  const p = priority ? `\n    <priority>${priority}</priority>` : "";
  return `  <url>\n    <loc>${l}</loc>${m}${c}${p}\n  </url>`;
}

async function supabaseGet(supabaseUrl, supabaseKey, path) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase HTTP ${res.status} cho ${path}`);
  }
  return res.json();
}

export default async (request) => {
  const base = siteUrl(request);

  try {
    const supabaseUrl =
      (typeof Netlify !== "undefined" && Netlify.env.get("SUPABASE_URL")) || "";

    const supabaseKey =
      (typeof Netlify !== "undefined" &&
        Netlify.env.get("SUPABASE_ANON_KEY")) ||
      "";

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Thiếu biến môi trường Supabase.");
    }

    // Chạy song song 2 query cho nhanh
    const [categories, products] = await Promise.all([
      supabaseGet(
        supabaseUrl,
        supabaseKey,
        "categories?select=slug&order=slug",
      ),
      supabaseGet(
        supabaseUrl,
        supabaseKey,
        "products?select=slug,updated_at,categories(slug)&order=updated_at.desc&limit=5000",
      ),
    ]);

    const urls = [];

    // Trang tĩnh
    urls.push(urlEntry(`${base}/`, null, "daily", "1.0"));
    urls.push(urlEntry(`${base}/products`, null, "daily", "0.9"));
    urls.push(urlEntry(`${base}/about`, null, "monthly", "0.5"));
    urls.push(urlEntry(`${base}/contact`, null, "monthly", "0.5"));

    // Danh mục
    for (const cat of categories || []) {
      if (!cat.slug) continue;
      urls.push(
        urlEntry(
          `${base}/products/${encodeURIComponent(cat.slug)}`,
          null,
          "daily",
          "0.8",
        ),
      );
    }

    // Sản phẩm
    for (const p of products || []) {
      const catSlug =
        p.categories && p.categories.slug ? p.categories.slug : null;
      if (!p.slug || !catSlug) continue;
      const lastmod = p.updated_at
        ? new Date(p.updated_at).toISOString().split("T")[0]
        : null;
      urls.push(
        urlEntry(
          `${base}/products/${encodeURIComponent(catSlug)}/${encodeURIComponent(p.slug)}`,
          lastmod,
          "weekly",
          "0.7",
        ),
      );
    }

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.join("\n") +
      `\n</urlset>`;

    return new Response(xml, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Lỗi tạo sitemap:", err);
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urlEntry(`${base}/`, null, "daily", "1.0") +
      `\n</urlset>`;
    return new Response(xml, {
      status: 500,
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  }
};
