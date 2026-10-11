const FONT = "Dancing%20Script";
const TEXT = "%40HoardStore";

// width = chiều rộng ảnh khi hiển thị, chữ tự to nhỏ theo tỉ lệ
export function withWatermark(url, width = 1080) {
    if (!url || !url.includes("/image/upload/")) return url;
    if (url.includes("l_text")) return url; // đã có chữ thì bỏ qua

    const [head, tail] = url.split("/image/upload/");
    const parts = tail.split("/");

    // vị trí đoạn version (v123...), chữ được chèn ngay trước nó,
    // tức là sau mọi biến đổi sẵn có (resize, crop...)
    const vIdx = parts.findIndex((p) => /^v\d+$/.test(p));
    const insertAt = vIdx === -1 ? 0 : vIdx;
    const hasTransform = vIdx > 0;

    const size = Math.max(14, Math.round(width * 0.048));

    const layer = [
        ...(hasTransform ? [] : [`c_limit,w_${width}`]),
        `l_text:${FONT}_${size}_bold:${TEXT},co_white`,
        "o_95",
        "a_-15",
        "fl_layer_apply,g_center,x_-0.08,y_0.12",
    ];

    parts.splice(insertAt, 0, ...layer);
    return `${head}/image/upload/${parts.join("/")}`;
}