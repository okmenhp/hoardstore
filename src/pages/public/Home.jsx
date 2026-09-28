import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";
import ProductCard from "../../components/ProductCard";
import Banner from "../../components/Banner";

function Home() {
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});

  useEffect(() => {
    const fetchHomeData = async () => {
      // =========================
      // LẤY DANH MỤC
      // =========================

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select(
          `
            id,
            name,
            slug
          `,
        )
        .order("id", { ascending: true });

      if (categoryError) {
        console.error("Lỗi lấy danh mục:", categoryError);
        return;
      }

      if (!categoryData) return;

      setCategories(categoryData);

      // =========================
      // LẤY TẤT CẢ SẢN PHẨM
      // =========================

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(
          `
            id,
            name,
            slug,
            price,
            content,
            description,
            created_at,
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
        .order("id", { ascending: true });

      if (productError) {
        console.error("Lỗi lấy sản phẩm:", productError);
        return;
      }

      if (!productData) return;

      // =========================
      // SẮP XẾP ẢNH
      // =========================

      const products = productData.map((product) => ({
        ...product,

        product_images: [...(product.product_images || [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        ),
      }));

      // =========================
      // CHIA SẢN PHẨM THEO DANH MỤC
      // =========================

      const groupedProducts = {};

      categoryData.forEach((category) => {
        groupedProducts[category.id] = products
          .filter((product) => product.category_id === category.id)
          .slice(0, 10);
      });

      setProductsByCategory(groupedProducts);
    };

    fetchHomeData();
  }, []);

  return (
    <>
      {/* ==================== BANNER ==================== */}

      <div className="banner container">
        <Banner />
      </div>

      {/* ==================== SẢN PHẨM THEO DANH MỤC ==================== */}

      {categories.map((category) => {
        const products = productsByCategory[category.id] || [];

        // Nếu danh mục chưa có sản phẩm
        // thì không hiển thị section
        if (products.length === 0) {
          return null;
        }

        return (
          <div className="product-wrap container" key={category.id}>
            <div className="categories">
              <p>{category.name}</p>
              <Link to={`/products/${category.slug}`} className="view-more">
                Xem thêm <i className="fas fa-arrow-right"></i>
              </Link>{" "}
            </div>

            <div className="products">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        );
      })}

      {/* ==================== KHUYẾN MÃI ==================== */}

      <div className="promotions">
        <div className="promotions-box container">
          <div className="categories">
            <p>TIN KHUYẾN MÃI</p>

            <Link to="#" className="view-more">
              Xem thêm
            </Link>
          </div>

          <div className="promotions__content">
            <p>Hiện tại không có chương trình khuyến mãi nào</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
