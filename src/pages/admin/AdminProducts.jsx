import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [
      { data: productsData, error: productsError },
      { data: categoriesData, error: categoriesError },
    ] = await Promise.all([
      supabase
        .from("products")
        .select(
          `
            id,
            name,
            price,
            slug,
            created_at,
            updated_at,
            category_id,
            categories (
              id,
              name,
              slug
            ),
            product_images (
              id,
              image_url,
              is_primary,
              sort_order
            )
          `,
        )
        .order("created_at", { ascending: false }),

      supabase.from("categories").select("id, name, slug").order("name"),
    ]);

    if (productsError) {
      console.error("Lỗi tải sản phẩm:", productsError);
    }

    if (categoriesError) {
      console.error("Lỗi tải danh mục:", categoriesError);
    }

    setProducts(productsData || []);
    setCategories(categoriesData || []);

    setLoading(false);
  };

  /* =========================================
      FILTER
    ========================================= */

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !keyword || product.name?.toLowerCase().includes(keyword);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.category_id) === String(categoryFilter);

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  /* =========================================
      IMAGE
    ========================================= */

  const getProductImage = (product) => {
    if (!product.product_images?.length) {
      return null;
    }

    const sortedImages = [...product.product_images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;

      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    return sortedImages[0]?.image_url || null;
  };

  /* =========================================
      PRICE
    ========================================= */

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
  };

  /* =========================================
      DATE
    ========================================= */

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("vi-VN");
  };

  /* =========================================
      DELETE
    ========================================= */

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa sản phẩm "${product.name}"?`,
    );

    if (!confirmed) return;

    setDeletingId(product.id);

    try {
      // =====================================
      // 1. LẤY TẤT CẢ ẢNH CỦA SẢN PHẨM
      // =====================================

      const { data: images, error: imagesFetchError } = await supabase
        .from("product_images")
        .select("id, image_url")
        .eq("product_id", product.id);

      if (imagesFetchError) {
        throw imagesFetchError;
      }

      const imageUrls =
        images?.map((image) => image.image_url).filter(Boolean) || [];

      console.log("ẢNH CẦN XÓA:", imageUrls);

      // =====================================
      // 2. XÓA ẢNH TRÊN CLOUDINARY
      // =====================================

      if (imageUrls.length > 0) {
        const response = await fetch(
          "/.netlify/functions/delete-cloudinary-images",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageUrls,
            }),
          },
        );

        // Không dùng response.json() trực tiếp
        // để tránh lỗi Unexpected end of JSON input
        const responseText = await response.text();

        console.log("CLOUDINARY STATUS:", response.status);

        console.log("CLOUDINARY RESPONSE:", responseText);

        let data = null;

        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch {
            throw new Error(
              `Cloudinary function trả về dữ liệu không hợp lệ. HTTP ${response.status}.`,
            );
          }
        }

        // Function không trả JSON
        if (!data) {
          throw new Error(
            `Cloudinary function không trả về dữ liệu. HTTP ${response.status}.`,
          );
        }

        // Function trả lỗi
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Không thể xóa ảnh trên Cloudinary.");
        }

        console.log("ĐÃ XÓA CLOUDINARY:", data.results);
      }

      // =====================================
      // 3. XÓA RECORD product_images
      // =====================================

      const { error: deleteImagesError } = await supabase
        .from("product_images")
        .delete()
        .eq("product_id", product.id);

      if (deleteImagesError) {
        throw deleteImagesError;
      }

      // =====================================
      // 4. XÓA SẢN PHẨM
      // =====================================

      const { error: deleteProductError } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (deleteProductError) {
        throw deleteProductError;
      }

      // =====================================
      // 5. CẬP NHẬT GIAO DIỆN
      // =====================================

      setProducts((current) =>
        current.filter((item) => item.id !== product.id),
      );

      alert("Đã xóa sản phẩm và ảnh thành công.");
    } catch (error) {
      console.error("LỖI XÓA SẢN PHẨM:", error);

      alert(
        `Không thể xóa sản phẩm: ${error?.message || "Lỗi không xác định"}`,
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =========================================
      RESET FILTER
    ========================================= */

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
  };

  return (
    <div className="admin-products">
      {/* =====================================
            PAGE HEADER
        ===================================== */}

      <div className="admin-page-header">
        <div>
          <h2>Quản lý sản phẩm</h2>
        </div>

        <Link to="/admin/products/create" className="admin-primary-button">
          <i className="fa-solid fa-plus"></i>
          Thêm sản phẩm
        </Link>
      </div>

      {/* =====================================
            TOOLBAR
        ===================================== */}

      <div className="admin-products-toolbar">
        <div className="admin-products-search">
          <i className="fa-solid fa-magnifying-glass"></i>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Xóa tìm kiếm"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div className="admin-products-filter">
          <i className="fa-solid fa-filter"></i>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* =====================================
            RESULT INFO
        ===================================== */}

      <div className="admin-products-result">
        <span>
          Hiển thị <strong>{filteredProducts.length}</strong> /{" "}
          {products.length} sản phẩm
        </span>

        {(search || categoryFilter !== "all") && (
          <button type="button" onClick={clearFilters}>
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* =====================================
            TABLE
        ===================================== */}

      <div className="admin-products-panel">
        {loading ? (
          <div className="admin-products-empty">
            <div className="admin-products-empty__icon">
              <i className="fa-solid fa-spinner fa-spin"></i>
            </div>

            <h3>Đang tải sản phẩm...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="admin-products-empty">
            <div className="admin-products-empty__icon">
              <i className="fa-solid fa-box-open"></i>
            </div>

            <h3>
              {products.length === 0
                ? "Chưa có sản phẩm"
                : "Không tìm thấy sản phẩm"}
            </h3>

            <p>
              {products.length === 0
                ? "Hãy thêm sản phẩm đầu tiên cho cửa hàng."
                : "Thử thay đổi từ khóa hoặc bộ lọc danh mục."}
            </p>

            {products.length === 0 && (
              <Link
                to="/admin/products/create"
                className="admin-primary-button"
              >
                <i className="fa-solid fa-plus"></i>
                Thêm sản phẩm
              </Link>
            )}
          </div>
        ) : (
          <div className="admin-products-table">
            {/* TABLE HEADER */}

            <div className="admin-products-table__header">
              <span>Sản phẩm</span>

              <span>Danh mục</span>

              <span>Giá</span>

              <span>Ngày thêm</span>

              <span>Thao tác</span>
            </div>

            {/* TABLE ROWS */}

            {filteredProducts.map((product) => {
              const image = getProductImage(product);

              return (
                <div className="admin-products-table__row" key={product.id}>
                  {/* PRODUCT */}

                  <div className="admin-product-cell">
                    <div className="admin-product-cell__image">
                      {image ? (
                        <img src={image} alt={product.name} />
                      ) : (
                        <i className="fa-solid fa-image"></i>
                      )}
                    </div>

                    <div className="admin-product-cell__info">
                      <strong title={product.name}>{product.name}</strong>

                      {product.slug && <span>/{product.slug}</span>}
                    </div>
                  </div>

                  {/* CATEGORY */}

                  <div className="admin-product-category">
                    {product.categories?.name ? (
                      <span>{product.categories.name}</span>
                    ) : (
                      <span className="is-empty">Chưa phân loại</span>
                    )}
                  </div>

                  {/* PRICE */}

                  <div className="admin-product-price">
                    {formatPrice(product.price)}
                  </div>

                  {/* DATE */}

                  <div className="admin-product-date">
                    {formatDate(product.created_at)}
                  </div>

                  {/* ACTIONS */}

                  <div className="admin-table-actions">
                    <Link
                      to={`/admin/products/edit/${product.id}`}
                      className="admin-table-button edit"
                      title="Sửa sản phẩm"
                    >
                      <i className="fa-solid fa-pen"></i>
                    </Link>

                    <button
                      type="button"
                      className="admin-table-button delete"
                      onClick={() => handleDelete(product)}
                      disabled={deletingId === product.id}
                      title="Xóa sản phẩm"
                    >
                      {deletingId === product.id ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fa-solid fa-trash"></i>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProducts;
