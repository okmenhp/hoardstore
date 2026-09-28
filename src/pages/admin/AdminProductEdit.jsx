import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

// =========================================================
// CLOUDINARY
// =========================================================

const CLOUDINARY_CLOUD_NAME = "dbs8zsq5w";
const CLOUDINARY_UPLOAD_PRESET = "hoardstore_upload";

function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");

  // Thông tin bổ sung
  const [condition, setCondition] = useState("Còn hàng");
  const [material, setMaterial] = useState("");
  const [size, setSize] = useState("");

  const [currentImages, setCurrentImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [error, setError] = useState(null);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    getData();
  }, [id]);

  useEffect(() => {
    return () => {
      newImages.forEach((image) => {
        if (image.preview) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [newImages]);

  async function getData() {
    setLoading(true);
    setError(null);

    const [categoriesResult, productResult] = await Promise.all([
      supabase
        .from("categories")
        .select("id, name")
        .order("id", { ascending: true }),

      supabase
        .from("products")
        .select(
          `
          id,
          name,
          slug,
          price,
          content,
          description,
          category_id,
          condition,
          material,
          size,
          product_images (
            id,
            image_url,
            is_primary,
            sort_order
          )
        `,
        )
        .eq("id", id)
        .single(),
    ]);

    if (categoriesResult.error) {
      console.error(categoriesResult.error);

      setError(categoriesResult.error.message);
      setLoading(false);

      return;
    }

    if (productResult.error) {
      console.error(productResult.error);

      setError(productResult.error.message);
      setLoading(false);

      return;
    }

    const product = productResult.data;

    setCategories(categoriesResult.data || []);

    setName(product.name || "");
    setPrice(product.price ?? "");
    setCategoryId(product.category_id ? String(product.category_id) : "");
    setContent(product.content || "");
    setDescription(product.description || "");

    // Thông tin bổ sung
    setCondition(product.condition || "Còn hàng");
    setMaterial(product.material || "");
    setSize(product.size || "");

    const sortedImages = [...(product.product_images || [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    );

    setCurrentImages(sortedImages);

    setLoading(false);
  }

  // =========================================================
  // COMPRESS IMAGE
  // =========================================================

  async function compressImage(file) {
    const MAX_DIMENSION = 1600;
    const QUALITY = 0.82;

    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = async () => {
        URL.revokeObjectURL(objectUrl);

        let width = image.width;
        let height = image.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            width = MAX_DIMENSION;
            height = Math.round((image.height / image.width) * MAX_DIMENSION);
          } else {
            height = MAX_DIMENSION;
            width = Math.round((image.width / image.height) * MAX_DIMENSION);
          }
        }

        const canvas = document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Không thể xử lý ảnh."));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(image, 0, 0, width, height);

        const blob = await new Promise((resolveBlob) => {
          canvas.toBlob((result) => resolveBlob(result), "image/webp", QUALITY);
        });

        if (!blob) {
          reject(new Error(`Không thể nén ảnh: ${file.name}`));
          return;
        }

        const originalName = file.name.replace(/\.[^/.]+$/, "");

        const compressedFile = new File([blob], `${originalName}.webp`, {
          type: "image/webp",
          lastModified: Date.now(),
        });

        console.log(
          `Ảnh: ${file.name} | ` +
            `Gốc: ${(file.size / 1024 / 1024).toFixed(2)} MB | ` +
            `Sau nén: ${(compressedFile.size / 1024).toFixed(0)} KB | ` +
            `${width}x${height}`,
        );

        resolve(compressedFile);
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);

        reject(new Error(`Không thể đọc ảnh: ${file.name}`));
      };

      image.src = objectUrl;
    });
  }

  // =========================================================
  // CHOOSE NEW IMAGES
  // =========================================================

  async function handleNewImages(e) {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    try {
      setError(null);
      setProcessingImages(true);

      const compressedFiles = await Promise.all(
        selectedFiles.map((file) => compressImage(file)),
      );

      const imagesWithPreview = compressedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setNewImages((current) => [...current, ...imagesWithPreview]);
    } catch (error) {
      console.error(error);

      setError(error.message || "Không thể xử lý ảnh.");
    } finally {
      setProcessingImages(false);
      e.target.value = "";
    }
  }

  function removeNewImage(index) {
    setNewImages((images) => {
      const image = images[index];

      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }

      return images.filter((_, i) => i !== index);
    });
  }

  // =========================================================
  // SLUG
  // =========================================================

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

  async function createUniqueSlug(name, currentId) {
    const baseSlug = slugify(name);

    let slug = baseSlug;
    let number = 2;

    while (true) {
      const { data, error } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .neq("id", currentId)
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

  // =========================================================
  // DELETE CURRENT IMAGE
  // =========================================================

  async function handleDeleteImage(image) {
    const confirmed = window.confirm("Bạn có chắc muốn xóa ảnh này?");

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      /*
       * Ảnh hiện tại nằm trên Cloudinary.
       *
       * Không dùng Supabase Storage cũ.
       *
       * Việc xóa file thật trên Cloudinary
       * được xử lý bằng server/API riêng.
       */

      const { error: databaseError } = await supabase
        .from("product_images")
        .delete()
        .eq("id", image.id);

      if (databaseError) {
        throw databaseError;
      }

      setCurrentImages((images) =>
        images.filter((item) => item.id !== image.id),
      );
    } catch (error) {
      console.error(error);

      setError(error.message || "Không thể xóa ảnh.");
    }
  }

  // =========================================================
  // SET PRIMARY IMAGE
  // =========================================================

  async function handleSetPrimary(imageId) {
    setError(null);

    try {
      const { error } = await supabase
        .from("product_images")
        .update({
          is_primary: false,
        })
        .eq("product_id", id);

      if (error) {
        throw error;
      }

      const { error: primaryError } = await supabase
        .from("product_images")
        .update({
          is_primary: true,
        })
        .eq("id", imageId);

      if (primaryError) {
        throw primaryError;
      }

      setCurrentImages((images) =>
        images.map((image) => ({
          ...image,
          is_primary: image.id === imageId,
        })),
      );
    } catch (error) {
      console.error(error);

      setError(error.message || "Không thể đặt ảnh chính.");
    }
  }

  // =========================================================
  // CLOUDINARY UPLOAD
  // =========================================================

  async function uploadToCloudinary(file) {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "hoardstore");

    const uploadUrl =
      `https://api.cloudinary.com/v1_1/` +
      `${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cloudinary error:", data);

      throw new Error(
        data?.error?.message || "Upload ảnh lên Cloudinary thất bại.",
      );
    }

    if (!data.secure_url) {
      throw new Error("Cloudinary không trả về URL ảnh.");
    }

    return data.secure_url;
  }

  // =========================================================
  // UPLOAD NEW IMAGES
  // =========================================================

  async function uploadNewImages() {
    const uploadedImages = [];

    for (let i = 0; i < newImages.length; i++) {
      const file = newImages[i].file;

      const cloudinaryUrl = await uploadToCloudinary(file);

      uploadedImages.push({
        product_id: Number(id),
        image_url: cloudinaryUrl,
        is_primary: false,
        sort_order: currentImages.length + i,
      });
    }

    if (uploadedImages.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from("product_images")
      .insert(uploadedImages)
      .select();

    if (error) {
      throw error;
    }

    return data;
  }

  // =========================================================
  // SAVE PRODUCT
  // =========================================================

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
      setError("Vui lòng chờ xử lý ảnh xong.");
      return;
    }

    try {
      setSaving(true);

      const newSlug = await createUniqueSlug(name.trim(), Number(id));

      const { error: productError } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          slug: newSlug,
          price: Number(price),
          category_id: Number(categoryId),
          content: content.trim(),
          description: description.trim(),

          // Thông tin bổ sung
          condition: condition.trim(),
          material: material.trim(),
          size: size.trim(),

          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (productError) {
        throw productError;
      }

      await uploadNewImages();

      navigate("/admin/products");
    } catch (error) {
      console.error(error);

      setError(error.message || "Có lỗi xảy ra khi cập nhật sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // LOADING / ERROR
  // =========================================================

  if (loading) {
    return null;
  }

  if (error && !name) {
    return (
      <div className="admin-product-form-page">
        <div className="admin-form-error">
          <i className="fa-solid fa-circle-exclamation"></i>

          <span>{error}</span>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="admin-product-form-page">
      {/* HEADER */}

      <div className="admin-page-header">
        <div className="admin-page-header__main">
          <div className="admin-breadcrumb">
            <Link to="/admin/products">Sản phẩm</Link>

            <i className="fa-solid fa-chevron-right"></i>

            <span>Sửa sản phẩm</span>
          </div>

          <div className="admin-page-title">
            <div className="admin-page-title__icon">
              <i className="fa-solid fa-pen-to-square"></i>
            </div>

            <div>
              <h2>Sửa sản phẩm</h2>

              <p>Cập nhật thông tin và hình ảnh sản phẩm.</p>
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
        {/* =====================================================
            THÔNG TIN SẢN PHẨM
        ===================================================== */}

        <div className="admin-form-card">
          <div className="admin-form-card__header">
            <div className="admin-form-card__title">
              <div className="admin-form-card__icon">
                <i className="fa-solid fa-box"></i>
              </div>

              <div>
                <h3>Thông tin sản phẩm</h3>

                <p>Chỉnh sửa các thông tin cơ bản của sản phẩm.</p>
              </div>
            </div>
          </div>

          <div className="admin-form-card__body">
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

            {/* =====================================================
                THÔNG TIN BỔ SUNG
            ===================================================== */}

            <div className="admin-form-grid">
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
                Thông tin ngắn dùng để giới thiệu sản phẩm.
              </small>
            </div>

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

        {/* =====================================================
            ẢNH HIỆN TẠI
        ===================================================== */}

        <div className="admin-form-card">
          <div className="admin-form-card__header">
            <div className="admin-form-card__title">
              <div className="admin-form-card__icon">
                <i className="fa-solid fa-images"></i>
              </div>

              <div>
                <h3>Ảnh hiện tại</h3>

                <p>Quản lý các hình ảnh đang được sử dụng.</p>
              </div>
            </div>

            <div className="admin-image-count">{currentImages.length} ảnh</div>
          </div>

          <div className="admin-form-card__body">
            {currentImages.length === 0 ? (
              <div className="admin-empty-images">
                <div className="admin-empty-images__icon">
                  <i className="fa-regular fa-image"></i>
                </div>

                <strong>Chưa có ảnh sản phẩm</strong>

                <span>Bạn có thể thêm ảnh mới ở bên dưới.</span>
              </div>
            ) : (
              <div className="admin-image-section">
                <div className="admin-image-section__top">
                  <div>
                    <strong>Đang có {currentImages.length} ảnh</strong>

                    <span>Chọn biểu tượng ngôi sao để đổi ảnh chính</span>
                  </div>
                </div>

                <div className="admin-image-grid">
                  {currentImages.map((image, index) => (
                    <div
                      className={`admin-image-item ${
                        image.is_primary ? "is-primary" : ""
                      }`}
                      key={image.id}
                    >
                      <div className="admin-image-item__preview">
                        <img
                          src={image.image_url}
                          alt={`${name} - ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                        />

                        {image.is_primary && (
                          <span className="admin-image-primary">
                            <i className="fa-solid fa-star"></i>
                            Ảnh chính
                          </span>
                        )}

                        <span className="admin-image-number">{index + 1}</span>
                      </div>

                      <div className="admin-image-item__info">
                        <span>Ảnh sản phẩm {index + 1}</span>

                        <small>Cloudinary</small>
                      </div>

                      <div className="admin-image-item__actions">
                        <button
                          type="button"
                          className={image.is_primary ? "primary-active" : ""}
                          onClick={() => handleSetPrimary(image.id)}
                          disabled={image.is_primary || saving}
                          title={
                            image.is_primary
                              ? "Đang là ảnh chính"
                              : "Đặt làm ảnh chính"
                          }
                        >
                          <i className="fa-solid fa-star"></i>
                        </button>

                        <button
                          type="button"
                          className="delete"
                          onClick={() => handleDeleteImage(image)}
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

        {/* =====================================================
            THÊM ẢNH MỚI
        ===================================================== */}

        <div className="admin-form-card">
          <div className="admin-form-card__header">
            <div className="admin-form-card__title">
              <div className="admin-form-card__icon">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>

              <div>
                <h3>Thêm ảnh mới</h3>

                <p>Ảnh sẽ được resize và nén trước khi upload.</p>
              </div>
            </div>

            {newImages.length > 0 && (
              <div className="admin-image-count">
                +{newImages.length} ảnh mới
              </div>
            )}
          </div>

          <div className="admin-form-card__body">
            <label
              className={`admin-upload-box ${
                processingImages ? "is-processing" : ""
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                onChange={handleNewImages}
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

              <small>JPG, PNG, WEBP, HEIC • WebP tối đa 1600px</small>
            </label>

            {newImages.length > 0 && (
              <div className="admin-image-section">
                <div className="admin-image-section__top">
                  <div>
                    <strong>Đã chọn {newImages.length} ảnh mới</strong>

                    <span>Các ảnh này sẽ được upload khi bấm Lưu thay đổi</span>
                  </div>
                </div>

                <div className="admin-image-grid">
                  {newImages.map((image, index) => (
                    <div
                      className="admin-image-item"
                      key={`${image.file.name}-${index}`}
                    >
                      <div className="admin-image-item__preview">
                        <img
                          src={image.preview}
                          alt={image.file.name}
                          loading="lazy"
                          decoding="async"
                        />

                        <span className="admin-image-number">+{index + 1}</span>
                      </div>

                      <div className="admin-image-item__info">
                        <span title={image.file.name}>{image.file.name}</span>

                        <small>{(image.file.size / 1024).toFixed(0)} KB</small>
                      </div>

                      <div className="admin-image-item__actions">
                        <button
                          type="button"
                          className="delete"
                          onClick={() => removeNewImage(index)}
                          disabled={saving || processingImages}
                          title="Bỏ ảnh"
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

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="admin-form-footer">
          <div className="admin-form-footer__hint">
            <i className="fa-solid fa-circle-info"></i>

            <span>Kiểm tra thông tin trước khi lưu thay đổi.</span>
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
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminProductEdit;
