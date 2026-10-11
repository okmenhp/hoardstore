import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import ProductCard from "../../components/ProductCard";

function Products() {
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const keyword = search.trim();

  useEffect(() => {
    getProducts();
  }, [keyword]);

  async function getProducts() {
    setError(null);
    setLoading(true);

    try {
      // =====================================================
      // QUERY PRODUCTS
      // =====================================================

      let query = supabase.from("products").select(`
          *,
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
        `);

      // =====================================================
      // SEARCH
      //
      // Có keyword:
      // /products?search=ak12
      //
      // Không có keyword:
      // /products
      // => lấy tất cả sản phẩm
      // =====================================================

      if (keyword) {
        query = query.ilike("name", `%${keyword}%`);
      }

      // =====================================================
      // SORT
      // =====================================================

      query = query.order("id", { ascending: true });

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        console.error("Lỗi lấy sản phẩm:", supabaseError);
        setError(supabaseError.message);
        setProducts([]);
        return;
      }

      // =====================================================
      // FORMAT PRODUCTS
      //
      // Sắp xếp product_images theo sort_order
      // =====================================================

      const formattedProducts = (data || []).map((product) => ({
        ...product,

        product_images: [...(product.product_images || [])].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
        ),
      }));

      setProducts(formattedProducts);
    } catch (err) {
      console.error("Lỗi không xác định:", err);
      setError("Không thể tải danh sách sản phẩm.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <main className="products-page">
        <div className="container">
          <div className="products-error">
            <h2>Có lỗi xảy ra</h2>
            <p>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="products-page">
      <div className="search-results container">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="search-results__top">
          {keyword ? (
            <p>
              Có {products.length} kết quả tìm kiếm với từ khóa{" "}
              <strong>"{keyword}"</strong>
            </p>
          ) : (
            <p>Tất cả sản phẩm</p>
          )}
        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="products-loading">
            <div className="products-loading__spinner"></div>
          </div>
        ) : products.length > 0 ? (
          /* =================================================
             PRODUCTS
          ================================================= */

          <div className="products">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* =================================================
             EMPTY
          ================================================= */

          <div className="products-empty">
            <div className="products-empty__icon"></div>

            {keyword ? (
              <>
                <h2>Không tìm thấy sản phẩm</h2>

                <p>
                  Không có sản phẩm nào phù hợp với từ khóa{" "}
                  <strong>"{keyword}"</strong>.
                </p>
              </>
            ) : (
              <>
                <h2>Chưa có sản phẩm</h2>

                <p>Hiện chưa có sản phẩm nào được đăng tải.</p>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default Products;
