import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const CLOUDINARY_CLOUD_NAME = "dbs8zsq5w";
const CLOUDINARY_UPLOAD_PRESET = "hoardstore_upload";

function AdminBanners() {
  const [banners, setBanners] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // =========================================================
  // LOAD BANNERS
  // =========================================================

  const loadBanners = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Load banners error:", error);
      setBanners([]);
    } else {
      setBanners(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // =========================================================
  // SELECT IMAGE
  // =========================================================

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file hình ảnh.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Ảnh không được lớn hơn 10MB.");
      return;
    }

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  // =========================================================
  // UPLOAD BANNER
  // =========================================================

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn ảnh banner.");
      return;
    }

    setUploading(true);

    try {
      // -----------------------------------------------------
      // 1. Upload Cloudinary
      // -----------------------------------------------------

      const formData = new FormData();

      formData.append("file", selectedFile);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", "hoardstore/banners");

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok) {
        throw new Error(
          cloudinaryData?.error?.message || "Upload Cloudinary thất bại.",
        );
      }

      const imageUrl = cloudinaryData.secure_url;

      // -----------------------------------------------------
      // 2. Tính sort_order tiếp theo
      // -----------------------------------------------------

      const nextSortOrder =
        banners.length > 0
          ? Math.max(
              ...banners.map((banner) => Number(banner.sort_order || 0)),
            ) + 1
          : 1;

      // -----------------------------------------------------
      // 3. Lưu vào Supabase
      // -----------------------------------------------------

      const { data, error } = await supabase
        .from("banners")
        .insert({
          image_url: imageUrl,
          sort_order: nextSortOrder,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        // Nếu DB insert lỗi thì cố gắng xóa ảnh Cloudinary
        try {
          await fetch("/.netlify/functions/delete-cloudinary-images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageUrls: [imageUrl],
            }),
          });
        } catch (deleteError) {
          console.error("Rollback Cloudinary error:", deleteError);
        }

        throw error;
      }

      setBanners((prev) => [...prev, data]);

      // -----------------------------------------------------
      // Reset
      // -----------------------------------------------------

      setSelectedFile(null);
      setPreview("");

      const fileInput = document.getElementById("banner-upload");

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Upload banner error:", error);

      alert(error?.message || "Không thể thêm banner. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  // =========================================================
  // TOGGLE ACTIVE
  // =========================================================

  const handleToggleActive = async (banner) => {
    setUpdatingId(banner.id);

    const { error } = await supabase
      .from("banners")
      .update({
        is_active: !banner.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", banner.id);

    if (error) {
      console.error("Update banner error:", error);

      alert("Không thể cập nhật trạng thái banner.");
    } else {
      setBanners((prev) =>
        prev.map((item) =>
          item.id === banner.id
            ? {
                ...item,
                is_active: !item.is_active,
              }
            : item,
        ),
      );
    }

    setUpdatingId(null);
  };

  // =========================================================
  // UPDATE SORT ORDER
  // =========================================================

  const handleSortChange = async (bannerId, newPosition) => {
    const position = Number(newPosition);

    if (!Number.isInteger(position) || position < 1) {
      alert("Thứ tự phải là số nguyên lớn hơn 0.");
      return;
    }

    const currentBanner = banners.find((banner) => banner.id === bannerId);

    if (!currentBanner) return;

    const maxPosition = banners.length;
    const finalPosition = Math.min(position, maxPosition);

    if (finalPosition === currentBanner.sort_order) {
      return;
    }

    setUpdatingId(bannerId);

    try {
      const sortedBanners = [...banners].sort(
        (a, b) => a.sort_order - b.sort_order,
      );

      const currentIndex = sortedBanners.findIndex(
        (banner) => banner.id === bannerId,
      );

      if (currentIndex === -1) return;

      // Xóa banner hiện tại khỏi vị trí cũ
      sortedBanners.splice(currentIndex, 1);

      // Chèn vào vị trí mới
      sortedBanners.splice(finalPosition - 1, 0, currentBanner);

      // Đánh lại thứ tự từ 1 -> n
      const reorderedBanners = sortedBanners.map((banner, index) => ({
        ...banner,
        sort_order: index + 1,
      }));

      // Cập nhật từng banner bằng UPDATE
      for (const banner of reorderedBanners) {
        const { error } = await supabase
          .from("banners")
          .update({
            sort_order: banner.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", banner.id);

        if (error) {
          throw error;
        }
      }

      // Cập nhật giao diện
      setBanners(reorderedBanners);
    } catch (error) {
      console.error("Update banner order error:", error);
      alert(
        `Không thể cập nhật thứ tự banner.\n${
          error?.message || "Lỗi không xác định"
        }`,
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const saveSortOrder = async (banner) => {
    const sortOrder = Number(banner.sort_order);

    if (!Number.isFinite(sortOrder)) {
      alert("Thứ tự phải là một số.");
      return;
    }

    setUpdatingId(banner.id);

    const { error } = await supabase
      .from("banners")
      .update({
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq("id", banner.id);

    if (error) {
      console.error("Update sort order error:", error);

      alert("Không thể cập nhật thứ tự.");
    } else {
      await loadBanners();
    }

    setUpdatingId(null);
  };

  // =========================================================
  // DELETE BANNER
  // =========================================================

  const handleDelete = async (banner) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa banner này không?");

    if (!confirmed) {
      return;
    }

    setDeletingId(banner.id);

    try {
      // -----------------------------------------------------
      // 1. Xóa DB
      // -----------------------------------------------------

      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", banner.id);

      if (error) {
        throw error;
      }

      // -----------------------------------------------------
      // 2. Xóa Cloudinary
      // -----------------------------------------------------

      try {
        await fetch("/.netlify/functions/delete-cloudinary-images", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrls: [banner.image_url],
          }),
        });
      } catch (cloudinaryError) {
        console.error("Cloudinary delete error:", cloudinaryError);
      }

      setBanners((prev) => prev.filter((item) => item.id !== banner.id));
    } catch (error) {
      console.error("Delete banner error:", error);

      alert(error?.message || "Không thể xóa banner. Vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // CLEAN PREVIEW URL
  // =========================================================

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="admin-dashboard admin-banners-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <h2>Banner</h2>
        </div>
      </div>

      {/* =====================================================
          ADD BANNER
      ===================================================== */}

      <div className="admin-panel admin-banner-upload">
        <div className="admin-panel__header">
          <div className="admin-panel__title">
            <h3>Thêm banner</h3>

            <p>Khuyến nghị ảnh tỷ lệ khoảng 1920 × 780px.</p>
          </div>
        </div>

        <div className="admin-banner-upload__body">
          <label
            htmlFor="banner-upload"
            className="admin-banner-upload__dropzone"
          >
            {preview ? (
              <img src={preview} alt="Banner preview" />
            ) : (
              <div className="admin-banner-upload__empty">
                <i className="fa-solid fa-cloud-arrow-up"></i>

                <strong>Chọn ảnh banner</strong>

                <span>PNG, JPG, WEBP · tối đa 10MB</span>
              </div>
            )}

            <input
              id="banner-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              hidden
            />
          </label>

          <div className="admin-banner-upload__actions">
            {selectedFile && (
              <span className="admin-banner-upload__filename">
                {selectedFile.name}
              </span>
            )}

            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
            >
              <i
                className={
                  uploading
                    ? "fa-solid fa-spinner fa-spin"
                    : "fa-solid fa-upload"
                }
              ></i>

              {uploading ? "Đang tải lên..." : "Thêm banner"}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          BANNER LIST
      ===================================================== */}

      <div className="admin-panel">
        <div className="admin-panel__header">
          <div className="admin-panel__title">
            <h3>Danh sách banner</h3>

            <p>
              {banners.length} banner
              {banners.length !== 1 ? "" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-table-empty">Đang tải dữ liệu...</div>
        ) : banners.length === 0 ? (
          <div className="admin-table-empty">Chưa có banner nào.</div>
        ) : (
          <div className="admin-banner-list">
            {banners.map((banner, index) => (
              <div className="admin-banner-item" key={banner.id}>
                {/* IMAGE */}

                <div className="admin-banner-item__image">
                  <img
                    src={banner.image_url}
                    alt={`Banner ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* INFO */}

                <div className="admin-banner-item__info">
                  <div className="admin-banner-item__top">
                    <strong>Banner {index + 1}</strong>

                    <span
                      className={`admin-banner-status ${
                        banner.is_active ? "active" : "inactive"
                      }`}
                    >
                      {banner.is_active ? "Đang hiển thị" : "Đang ẩn"}
                    </span>
                  </div>

                  <div className="admin-banner-item__controls">
                    <label>
                      <span>Thứ tự</span>

                      <input
                        type="number"
                        min="1"
                        value={banner.sort_order}
                        onChange={(event) =>
                          handleSortChange(banner.id, event.target.value)
                        }
                      />
                    </label>

                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => saveSortOrder(banner)}
                      disabled={updatingId === banner.id}
                    >
                      <i className="fa-solid fa-floppy-disk"></i>
                      Lưu
                    </button>

                    <button
                      type="button"
                      className={`admin-btn ${
                        banner.is_active
                          ? "admin-btn--warning"
                          : "admin-btn--success"
                      }`}
                      onClick={() => handleToggleActive(banner)}
                      disabled={updatingId === banner.id}
                    >
                      <i
                        className={
                          banner.is_active
                            ? "fa-solid fa-eye-slash"
                            : "fa-solid fa-eye"
                        }
                      ></i>

                      {banner.is_active ? "Ẩn" : "Hiển thị"}
                    </button>

                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      onClick={() => handleDelete(banner)}
                      disabled={deletingId === banner.id}
                    >
                      <i
                        className={
                          deletingId === banner.id
                            ? "fa-solid fa-spinner fa-spin"
                            : "fa-solid fa-trash"
                        }
                      ></i>

                      {deletingId === banner.id ? "Đang xóa..." : "Xóa"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBanners;
