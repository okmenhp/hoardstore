export default async (req) => {
  // ==========================================
  // METHOD
  // ==========================================

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // ==========================================
    // ĐỌC BODY
    // ==========================================

    const body = await req.json();

    const imageUrls =
      body && Array.isArray(body.imageUrls)
        ? body.imageUrls.filter(Boolean)
        : [];

    // ==========================================
    // KHÔNG CÓ ẢNH
    // ==========================================

    if (imageUrls.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          deleted: 0,
          results: [],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // ==========================================
    // CLOUDINARY ENV
    // ==========================================

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    const apiKey = process.env.CLOUDINARY_API_KEY;

    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error("Thiếu biến môi trường Cloudinary.");
    }

    const results = [];

    // ==========================================
    // XÓA TỪNG ẢNH
    // ==========================================

    for (const imageUrl of imageUrls) {
      if (!imageUrl) {
        continue;
      }

      // ========================================
      // LẤY PUBLIC ID
      // ========================================

      const publicId = getPublicIdFromUrl(imageUrl);

      if (!publicId) {
        results.push({
          url: imageUrl,
          success: false,
          error: "Không lấy được public_id từ URL.",
        });

        continue;
      }

      try {
        // ======================================
        // TIMESTAMP
        // ======================================

        const timestamp = Math.floor(Date.now() / 1000);

        // ======================================
        // TẠO CHUỖI SIGNATURE
        // ======================================

        const signatureString =
          "public_id=" + publicId + "&timestamp=" + timestamp + apiSecret;

        // ======================================
        // SHA-1
        // ======================================

        const signature = await sha1(signatureString);

        // ======================================
        // FORM DATA
        // ======================================

        const formData = new URLSearchParams();

        formData.append("public_id", publicId);

        formData.append("timestamp", String(timestamp));

        formData.append("api_key", apiKey);

        formData.append("signature", signature);

        // ======================================
        // GỌI CLOUDINARY
        // ======================================

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/" + cloudName + "/image/destroy",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formData.toString(),
          },
        );

        // ======================================
        // ĐỌC RESPONSE
        // ======================================

        const responseText = await response.text();

        let data = null;

        try {
          data = JSON.parse(responseText);
        } catch {
          data = {
            error: {
              message:
                responseText || "Cloudinary trả về dữ liệu không hợp lệ.",
            },
          };
        }

        // ======================================
        // KIỂM TRA KẾT QUẢ
        // ======================================

        const cloudinaryResult = data && data.result ? data.result : null;

        const cloudinaryError =
          data && data.error && data.error.message ? data.error.message : null;

        /*
         * "ok"       = xóa thành công
         * "not found" = ảnh đã không còn tồn tại
         *
         * Cả hai đều được xem là thành công
         * đối với quá trình xóa sản phẩm.
         */

        const success =
          response.ok &&
          (cloudinaryResult === "ok" || cloudinaryResult === "not found");

        results.push({
          url: imageUrl,
          publicId: publicId,
          success: success,
          result: cloudinaryResult,
          error:
            cloudinaryError ||
            (!success ? "Cloudinary HTTP " + response.status : null),
        });
      } catch (error) {
        console.error("Lỗi xóa ảnh:", error);

        results.push({
          url: imageUrl,
          publicId: publicId,
          success: false,
          error:
            error && error.message
              ? error.message
              : "Không thể xóa ảnh Cloudinary.",
        });
      }
    }

    // ==========================================
    // KIỂM TRA ẢNH THẤT BẠI
    // ==========================================

    const failed = results.filter((item) => !item.success);

    const deleted = results.filter((item) => item.success);

    // ==========================================
    // CÓ ẢNH XÓA THẤT BẠI
    // ==========================================

    if (failed.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          deleted: deleted.length,
          failed: failed.length,
          results: results,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // ==========================================
    // THÀNH CÔNG
    // ==========================================

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deleted.length,
        failed: 0,
        results: results,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    // ==========================================
    // LỖI FUNCTION
    // ==========================================

    console.error("Cloudinary delete error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error && error.message
            ? error.message
            : "Không thể xóa ảnh Cloudinary.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
};

// ==========================================
// LẤY PUBLIC ID TỪ CLOUDINARY URL
// ==========================================

function getPublicIdFromUrl(url) {
  try {
    const parsedUrl = new URL(url);

    const pathname = parsedUrl.pathname;

    const uploadMarker = "/image/upload/";

    const uploadIndex = pathname.indexOf(uploadMarker);

    if (uploadIndex === -1) {
      return null;
    }

    // ========================================
    // LẤY PHẦN SAU /image/upload/
    // ========================================

    let path = pathname.substring(uploadIndex + uploadMarker.length);

    // Bỏ dấu "/" ở đầu nếu có
    path = path.replace(/^\/+/, "");

    // ========================================
    // TÁCH PATH
    // ========================================

    const parts = path.split("/");

    // ========================================
    // BỎ VERSION
    // Ví dụ:
    //
    // v1234567890/
    // hoardstore/
    // image.webp
    // ========================================

    if (parts[0] && /^v\d+$/.test(parts[0])) {
      parts.shift();
    }

    if (parts.length === 0) {
      return null;
    }

    // ========================================
    // GHÉP LẠI PUBLIC ID
    // ========================================

    const publicIdWithExtension = parts.join("/");

    // ========================================
    // BỎ EXTENSION
    //
    // image.jpg  -> image
    // image.png  -> image
    // image.webp -> image
    // ========================================

    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");

    return publicId || null;
  } catch (error) {
    console.error("Không parse được Cloudinary URL:", url, error);

    return null;
  }
}

// ==========================================
// SHA-1
// ==========================================

async function sha1(text) {
  const encoder = new TextEncoder();

  const data = encoder.encode(text);

  const hashBuffer = await crypto.subtle.digest("SHA-1", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
