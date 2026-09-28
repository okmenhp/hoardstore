export function getCloudinaryImageUrl(
  url,
  { width = 500, height = 500, quality = "auto", crop = "fill" } = {},
) {
  if (!url) return "";

  // Không phải ảnh Cloudinary thì giữ nguyên
  if (!url.includes("res.cloudinary.com")) {
    return url;
  }

  const marker = "/image/upload/";

  if (!url.includes(marker)) {
    return url;
  }

  const transformation = [
    "f_auto",
    `q_${quality}`,
    `w_${width}`,
    `h_${height}`,
    `c_${crop}`,
  ].join(",");

  return url.replace(marker, `${marker}${transformation}/`);
}
