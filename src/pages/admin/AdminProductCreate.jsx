import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

// ==========================================
// CLOUDINARY
// ==========================================

const CLOUDINARY_CLOUD_NAME = "dbs8zsq5w";
const CLOUDINARY_UPLOAD_PRESET = "hoardstore_upload";

function AdminProductCreate() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("Còn hàng");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [saving, setSaving] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories();
  }, []);

  // ==========================================
  // LẤY DANH MỤC
  // ==========================================

  async function getCategories() {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    setCategories(data || []);
  }

  // ==========================================
  // SLUG
  // ==========================================

  function slugify(text) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  async function createUniqueSlug(name) {
    const baseSlug = slugify(name);

    let slug = baseSlug;
    let number = 2;

    while (true) {
      const { data, error } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return slug;
      }

      slug = `${baseSlug}-${number}`;
      number++;
    }
  }

  // ==========================================
  // TẠO BLOB
  // ==========================================

  function createBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Không thể tạo ảnh WebP."));
            return;
          }

          resolve(blob);
        },
        "image/webp",
        quality,
      );
    });
  }

  // ==========================================
  // LOAD ẢNH
  // ==========================================

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Không thể đọc ảnh: ${file.name}`));
      };

      image.src = objectUrl;
    });
  }

  // ==========================================
  // NÉN + RESIZE ẢNH
  // ==========================================

  async function compressImage(file) {
    const MAX_DIMENSION = 1600;
    const QUALITY = 0.82;

    const image = await loadImage(file);

    let width = image.width;
    let height = image.height;

    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error(`Không thể xử lý ảnh: ${file.name}`);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(image, 0, 0, width, height);

    const blob = await createBlob(canvas, QUALITY);

    const originalName = file.name.replace(/\.[^/.]+$/, "");

    const compressedFile = new File([blob], `${originalName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });

    console.log(
      `Ảnh: ${file.name} | ` +
        `Gốc: ${(file.size / 1024 / 1024).toFixed(2)} MB | ` +
        `Sau nén: ${(compressedFile.size / 1024).toFixed(0)} KB | ` +
        `${width}x${height} | ` +
        `Quality: ${QUALITY}`,
    );

    return compressedFile;
  }

  // ==========================================
  // UPLOAD CLOUDINARY
  // ==========================================

  async function uploadToCloudinary(file) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "hoardstore");

    const uploadUrl =
      `https://api.cloudinary.com/v1_1/` +
      `${CLOUDINARY_CLOUD_NAME}/image/upload`;

    console.log("ĐANG UPLOAD CLOUDINARY:", {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadUrl,
    });

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();

    console.log("CLOUDINARY HTTP:", response.status);
    console.log("CLOUDINARY RESPONSE:", responseText);

    let data = null;

    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(
        `Cloudinary trả về dữ liệu không hợp lệ. HTTP ${response.status}.`,
      );
    }

    if (!response.ok) {
      console.error("Cloudinary error:", data);

      throw new Error(
        data?.error?.message ||
          `Upload ảnh lên Cloudinary thất bại. HTTP ${response.status}.`,
      );
    }

    if (!data.secure_url) {
      console.error("Cloudinary không có secure_url:", data);

      throw new Error("Cloudinary không trả về URL ảnh.");
    }

    console.log("UPLOAD CLOUDINARY THÀNH CÔNG:", {
      secure_url: data.secure_url,
      public_id: data.public_id,
      folder: data.asset_folder,
    });

    return data.secure_url;
  }

  // ==========================================
  // CHỌN ẢNH
  // ==========================================

  async function handleImageChange(e) {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    try {
      setError(null);
      setProcessingImages(true);

      const compressedFiles = [];

      for (const file of selectedFiles) {
        const compressedFile = await compressImage(file);
        compressedFiles.push(compressedFile);
      }

      setImages((current) => [...current, ...compressedFiles]);
    } catch (error) {
      console.error(error);

      setError(error.message || "Không thể xử lý ảnh.");
    } finally {
      setProcessingImages(false);
      e.target.value = "";
    }
  }

  // ==========================================
  // TẠO PREVIEW
  // ==========================================

  useEffect(() => {
    const urls = images.map((image) => URL.createObjectURL(image));

    setImagePreviews(urls);

    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [images]);

  // ==========================================
  // XÓA ẢNH
  // ==========================================

  function removeImage(index) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  // ==========================================
  // ĐỔI THỨ TỰ ẢNH
  // ==========================================

  function moveImage(index, direction) {
    setImages((current) => {
      const newImages = [...current];

      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newImages.length) {
        return current;
      }

      [newImages[index], newImages[targetIndex]] = [
        newImages[targetIndex],
        newImages[index],
      ];

      return newImages;
    });
  }

  // ==========================================
  // SUBMIT
  // ==========================================

  async function handleSubmit(e) {
    e.preventDefault();

    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Vui lòng nhập giá hợp lệ.");
      return;
    }

    if (!categoryId) {
      setError("Vui lòng chọn danh mục.");
      return;
    }

    if (processingImages) {
      setError("Vui lòng chờ ảnh xử lý xong.");
      return;
    }

    try {
      setSaving(true);

      const slug = await createUniqueSlug(name.trim());

      // ==========================================
      // TẠO PRODUCT
      // ==========================================

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          slug,
          price: Number(price),
          category_id: Number(categoryId),
          condition: condition.trim(),
          material: material.trim(),
          size: size.trim(),
          content: content.trim(),
          description: description.trim(),
        })
        .select()
        .single();

      if (productError) {
        throw productError;
      }

      // ==========================================
      // UPLOAD ẢNH CLOUDINARY
      // ==========================================

      const uploadedImages = [];

      for (let i = 0; i < images.length; i++) {
        const file = images[i];

        const cloudinaryUrl = await uploadToCloudinary(file);

        uploadedImages.push({
          product_id: product.id,
          image_url: cloudinaryUrl,
          is_primary: i === 0,
          sort_order: i,
        });
      }

      // ==========================================
      // LƯU URL ẢNH VÀO SUPABASE
      // ==========================================

      if (uploadedImages.length > 0) {
        const { error: imageError } = await supabase
          .from("product_images")
          .insert(uploadedImages);

        if (imageError) {
          throw imageError;
        }
      }

      navigate("/admin/products");
    } catch (error) {
      console.error(error);

      setError(error.message || "Có lỗi xảy ra khi thêm sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="admin-product-form-page">
      {/* HEADER */}

      <div className="admin-page-header">
        <div className="admin-page-header__main">
          <div className="admin-page-title">
            <div className="admin-page-title__icon">
              <i className="fa-solid fa-box-open"></i>
            </div>

            <div>
              <h2>Thêm sản phẩm</h2>
            </div>
          </div>
        </div>

        <Link to="/admin/products" className="admin-secondary-button">
          <i className="fa-solid fa-arrow-left"></i>
          <span>Quay lại</span>
        </Link>
      </div>

      {/* ERROR */}

      {error && (
        <div className="admin-form-error">
          <i className="fa-solid fa-circle-exclamation"></i>

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Đóng thông báo lỗi"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      <form className="admin-product-form" onSubmit={handleSubmit}>
        {/* THÔNG TIN */}

        <div className="admin-form-card">
          <div className="admin-form-card__header">
            <div className="admin-form-card__title">
              <div className="admin-form-card__icon">
                <i className="fa-solid fa-box"></i>
              </div>

              <div>
                <h3>Thông tin sản phẩm</h3>

                <p>Nhập các thông tin cơ bản của sản phẩm.</p>
              </div>
            </div>
          </div>

          <div className="admin-form-card__body">
            {/* TÊN */}

            <div className="admin-form-group">
              <label>
                Tên sản phẩm
                <span>*</span>
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Barrett Born Beast Noble Gold"
                disabled={saving}
              />
            </div>

            {/* GIÁ + DANH MỤC */}

            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label>
                  Giá
                  <span>*</span>
                </label>

                <div className="admin-price-input">
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="180000"
                    disabled={saving}
                  />

                  <span>VNĐ</span>
                </div>
              </div>

              <div className="admin-form-group">
                <label>
                  Danh mục
                  <span>*</span>
                </label>

                <div className="admin-select-wrapper">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Chọn danh mục</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <i className="fa-solid fa-chevron-down"></i>
                </div>
              </div>
            </div>

            {/* TÌNH TRẠNG + CHẤT LIỆU + KÍCH THƯỚC */}

            <div className="admin-form-grid admin-form-grid--three">
              <div className="admin-form-group">
                <label>Tình trạng</label>

                <div className="admin-select-wrapper">
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    disabled={saving}
                  >
                    <option value="Còn hàng">Còn hàng</option>

                    <option value="Hết hàng">Hết hàng</option>
                  </select>

                  <i className="fa-solid fa-chevron-down"></i>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Chất liệu</label>

                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Ví dụ: Kim loại"
                  disabled={saving}
                />
              </div>

              <div className="admin-form-group">
                <label>Kích thước</label>

                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="Ví dụ: 33cm"
                  disabled={saving}
                />
              </div>
            </div>

            {/* NỘI DUNG */}

            <div className="admin-form-group">
              <label>Nội dung</label>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nội dung ngắn của sản phẩm..."
                rows={4}
                disabled={saving}
              />

              <small className="admin-form-help">
                Có thể nhập thông tin ngắn để hiển thị giới thiệu sản phẩm.
              </small>
            </div>

            {/* MÔ TẢ */}

            <div className="admin-form-group">
              <label>Mô tả</label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết sản phẩm..."
                rows={7}
                disabled={saving}
              />

              <small className="admin-form-help">
                Nhập thông tin chi tiết về sản phẩm nếu cần.
              </small>
            </div>
          </div>
        </div>

        {/* HÌNH ẢNH */}

        <div className="admin-form-card">
          <div className="admin-form-card__header">
            <div className="admin-form-card__title">
              <div className="admin-form-card__icon">
                <i className="fa-solid fa-images"></i>
              </div>

              <div>
                <h3>Hình ảnh sản phẩm</h3>

                <p>Ảnh đầu tiên sẽ được sử dụng làm ảnh chính.</p>
              </div>
            </div>

            {images.length > 0 && (
              <div className="admin-image-count">{images.length} ảnh</div>
            )}
          </div>

          <div className="admin-form-card__body">
            {/* UPLOAD */}

            <label
              className={`admin-upload-box ${
                processingImages ? "is-processing" : ""
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={handleImageChange}
                disabled={saving || processingImages}
              />

              <div className="admin-upload-box__icon">
                <i
                  className={
                    processingImages
                      ? "fa-solid fa-spinner fa-spin"
                      : "fa-solid fa-cloud-arrow-up"
                  }
                ></i>
              </div>

              <strong>
                {processingImages ? "Đang xử lý ảnh..." : "Chọn hình ảnh"}
              </strong>

              <span>
                {processingImages
                  ? "Đang resize và nén ảnh"
                  : "Kéo thả hoặc chọn nhiều ảnh cùng lúc"}
              </span>

              <small>
                JPG, PNG, WEBP, HEIC • Tự động chuyển sang WebP • Tối đa 1600px
              </small>
            </label>

            {/* IMAGE LIST */}

            {images.length > 0 && (
              <div className="admin-image-section">
                <div className="admin-image-section__top">
                  <div>
                    <strong>Đã chọn {images.length} ảnh</strong>

                    <span>Ảnh đầu tiên được dùng làm ảnh chính</span>
                  </div>
                </div>

                <div className="admin-image-grid">
                  {images.map((image, index) => (
                    <div
                      className={`admin-image-item ${
                        index === 0 ? "is-primary" : ""
                      }`}
                      key={`${image.name}-${index}`}
                    >
                      {/* IMAGE */}

                      <div className="admin-image-item__preview">
                        {imagePreviews[index] && (
                          <img
                            src={imagePreviews[index]}
                            alt={image.name}
                            loading="lazy"
                            decoding="async"
                          />
                        )}

                        {index === 0 && (
                          <span className="admin-image-primary">
                            <i className="fa-solid fa-star"></i>
                            Ảnh chính
                          </span>
                        )}

                        <span className="admin-image-number">{index + 1}</span>
                      </div>

                      {/* INFO */}

                      <div className="admin-image-item__info">
                        <span title={image.name}>{image.name}</span>

                        <small>{(image.size / 1024).toFixed(0)} KB</small>
                      </div>

                      {/* ACTIONS */}

                      <div className="admin-image-item__actions">
                        <button
                          type="button"
                          onClick={() => moveImage(index, "left")}
                          disabled={index === 0 || saving}
                          title="Đưa lên trước"
                        >
                          <i className="fa-solid fa-arrow-left"></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => moveImage(index, "right")}
                          disabled={index === images.length - 1 || saving}
                          title="Đưa xuống sau"
                        >
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() => removeImage(index)}
                          disabled={saving}
                          title="Xóa ảnh"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}

        <div className="admin-form-footer">
          <div className="admin-form-footer__hint">
            <i className="fa-solid fa-circle-info"></i>

            <span>Kiểm tra thông tin trước khi thêm sản phẩm.</span>
          </div>

          <div className="admin-form-footer__actions">
            <Link to="/admin/products" className="admin-secondary-button">
              Hủy
            </Link>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving || processingImages}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Đang lưu...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  Thêm sản phẩm
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminProductCreate;
