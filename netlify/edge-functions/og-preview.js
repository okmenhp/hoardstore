// ============================================================
// OG PREVIEW CHO BOT (Zalo / Facebook / WhatsApp / Telegram...)
// ------------------------------------------------------------
// Khi bot của Zalo/Facebook/WhatsApp vào link sản phẩm để lấy
// ảnh preview, function này trả về một trang HTML mini chỉ chứa
// thẻ og:title / og:description / og:image của đúng sản phẩm.
//
// Người thật thì function trả về undefined -> Netlify phục vụ
// web React bình thường, không ảnh hưởng gì.
//
// Kích hoạt trong netlify.toml:
//   [[edge_functions]]
//     path = "/products/*"
//     function = "og-preview"
// ============================================================

const BOT_PATTERNS = [
    "facebookexternalhit",
    "facebot",
    "twitterbot",
    "linkedinbot",
    "slackbot",
    "telegrambot",
    "discordbot",
    "whatsapp",
    "zalo",
    "zaloapp",
    "pinterest",
    "embedly",
];

const SHOP_NAME = "HoardStore - Shop Mô Hình Súng Đột Kích";

const DEFAULT_DESC =
    "Shop mô hình súng Đột Kích (Crossfire), mô hình trưng bày chất lượng. Liên hệ mua hàng nhanh qua Zalo.";

function siteUrl(request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
}

function isBot(userAgent) {
    const ua = (userAgent || "").toLowerCase();
    return BOT_PATTERNS.some((pattern) => ua.includes(pattern));
}

function escapeHtml(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function ogHtml({ title, description, image, url }) {
    const t = escapeHtml(title);
    const d = escapeHtml(description);
    const u = escapeHtml(url);
    const img = escapeHtml(image);

    return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="HoardStore">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
</head>
<body></body>
</html>`;
}

function htmlResponse(data) {
    return new Response(ogHtml(data), {
        headers: {
            "content-type": "text/html; charset=utf-8",
            // Bot được phép cache preview 1 giờ
            "cache-control": "public, max-age=3600",
        },
    });
}

export default async(request) => {
    const userAgent = request.headers.get("user-agent") || "";

    // Không phải bot -> để Netlify phục vụ web React bình thường
    if (!isBot(userAgent)) {
        return;
    }

    const url = new URL(request.url);
    const base = siteUrl(request);
    const defaultImage = `${base}/image/logo.png`;

    const defaultData = {
        title: SHOP_NAME,
        description: DEFAULT_DESC,
        image: defaultImage,
        url: url.href,
    };

    // Chỉ xử lý link dạng /products/<danh-muc>/<san-pham>
    const match = url.pathname.match(/^\/products\/([^/]+)\/([^/]+)\/?$/);

    if (!match) {
        return htmlResponse(defaultData);
    }

    const productSlug = match[2];

    try {
        const supabaseUrl =
            // @ts-ignore - Netlify cung cấp biến toàn cục này ở edge
            (typeof Netlify !== "undefined" && Netlify.env.get("SUPABASE_URL")) || "";

        const supabaseKey =
            // @ts-ignore
            (typeof Netlify !== "undefined" &&
                Netlify.env.get("SUPABASE_ANON_KEY")) ||
            "";

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Thiếu biến môi trường Supabase.");
        }

        const apiUrl =
            `${supabaseUrl}/rest/v1/products` +
            `?slug=eq.${encodeURIComponent(productSlug)}` +
            `&select=name,price,product_images(image_url,is_primary,sort_order)` +
            `&limit=1`;

        const res = await fetch(apiUrl, {
            headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
            },
        });

        if (!res.ok) {
            throw new Error(`Supabase HTTP ${res.status}`);
        }

        const rows = await res.json();
        const product = rows && rows[0];

        if (!product) {
            throw new Error("Không tìm thấy sản phẩm.");
        }

        const images = [...(product.product_images || [])].sort(
            (a, b) =>
            (a.sort_order == null ? 0 : a.sort_order) -
            (b.sort_order == null ? 0 : b.sort_order),
        );

        const primary = images.find((image) => image.is_primary) || images[0];

        let image = defaultImage;

        if (primary && primary.image_url) {
            image = primary.image_url;

            // Ảnh Cloudinary: resize về chuẩn preview MXH 1200x630
            if (
                image.includes("res.cloudinary.com") &&
                image.includes("/image/upload/")
            ) {
                image = image.replace(
                    "/image/upload/",
                    "/image/upload/f_auto,q_auto,w_1200,h_630,c_fill/",
                );
            }
        }

        return htmlResponse({
            title: `${product.name} | HoardStore`,
            description: `${product.name}. ${DEFAULT_DESC}`,
            image,
            url: url.href,
        });
    } catch (error) {
        // Lỗi gì cũng trả về preview chung của shop,
        // không bao giờ làm hỏng việc share link
        return htmlResponse(defaultData);
    }
};