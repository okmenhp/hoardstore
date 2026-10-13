import { supabase } from "./supabaseClient";

// Gọi Netlify function xóa ảnh trên Cloudinary,
// kèm token đăng nhập Supabase trong header Authorization
// để function kiểm tra quyền admin trước khi xóa.
export async function deleteCloudinaryImages(imageUrls) {
    const result = await supabase.auth.getSession();
    const session = result && result.data ? result.data.session : null;

    const headers = {
        "Content-Type": "application/json",
    };

    if (session && session.access_token) {
        headers.Authorization = "Bearer " + session.access_token;
    }

    return fetch("/.netlify/functions/delete-cloudinary-images", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
            imageUrls: imageUrls,
        }),
    });
}