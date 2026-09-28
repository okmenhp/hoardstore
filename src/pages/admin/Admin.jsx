import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

function Admin() {
  const [productCount, setProductCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const [
        { count: productsCount },
        { count: categoriesCount },
        { data: products },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),

        supabase.from("categories").select("*", { count: "exact", head: true }),

        supabase
          .from("products")
          .select(
            `
              id,
              name,
              price,
              created_at,
              categories (
                name
              ),
              product_images (
                image_url,
                is_primary,
                sort_order
              )
            `,
          )
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setProductCount(productsCount || 0);
      setCategoryCount(categoriesCount || 0);
      setLatestProducts(products || []);

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("vi-VN") + "đ";
  };

  const getProductImage = (product) => {
    if (!product.product_images?.length) {
      return null;
    }

    const primary = product.product_images.find((image) => image.is_primary);

    return primary?.image_url || product.product_images[0]?.image_url || null;
  };

  return (
    <div className="admin-dashboard">
      {/* =========================
          PAGE HEADER
      ========================= */}

      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <h2>Tổng quan</h2>

          <p>Chào mừng bạn đến với trang quản trị HoardStore.</p>
        </div>
      </div>

      {/* =========================
          STATISTICS
      ========================= */}

      <div className="admin-stats">
        {/* PRODUCTS */}

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--blue">
            <i className="fa-solid fa-box"></i>
          </div>

          <div className="admin-stat-card__content">
            <span>Tổng sản phẩm</span>

            <strong>{loading ? "—" : productCount}</strong>
          </div>
        </div>

        {/* CATEGORIES */}

        <div className="admin-stat-card">
          <div className="admin-stat-card__icon admin-stat-card__icon--purple">
            <i className="fa-solid fa-layer-group"></i>
          </div>

          <div className="admin-stat-card__content">
            <span>Danh mục</span>

            <strong>{loading ? "—" : categoryCount}</strong>
          </div>
        </div>
      </div>

      {/* =========================
          LATEST PRODUCTS
      ========================= */}

      <div className="admin-panel">
        <div className="admin-panel__header">
          <div className="admin-panel__title">
            <h3>Sản phẩm mới nhất</h3>

            <p>5 sản phẩm được thêm gần đây</p>
          </div>

          <Link to="/admin/products" className="admin-panel__view-all">
            <span>Xem tất cả</span>
            <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>

        <div className="admin-products-table">
          {/* TABLE HEADER */}

          <div className="admin-table-header">
            <span>Sản phẩm</span>
            <span>Danh mục</span>
            <span>Giá</span>
            <span>Ngày thêm</span>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="admin-table-empty">Đang tải dữ liệu...</div>
          ) : latestProducts.length === 0 ? (
            /* EMPTY */

            <div className="admin-table-empty">Chưa có sản phẩm nào.</div>
          ) : (
            /* PRODUCTS */

            latestProducts.map((product) => {
              const image = getProductImage(product);

              return (
                <div className="admin-table-row" key={product.id}>
                  {/* PRODUCT */}

                  <div className="admin-product-info">
                    <div className="admin-product-image">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <i className="fa-solid fa-image"></i>
                      )}
                    </div>

                    <span className="admin-product-name" title={product.name}>
                      {product.name}
                    </span>
                  </div>

                  {/* CATEGORY */}

                  <span className="admin-category">
                    {product.categories?.name || "Chưa phân loại"}
                  </span>

                  {/* PRICE */}

                  <strong className="admin-price">
                    {formatPrice(product.price)}
                  </strong>

                  {/* DATE */}

                  <span className="admin-date">
                    {new Date(product.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
