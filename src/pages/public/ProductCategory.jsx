import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";
import ProductCard from "../../components/ProductCard";
import Breadcrumb from "../../components/Breadcrumb";

function ProductCategory() {
  const { categorySlug } = useParams();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [categorySlug]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // =========================
      // 1. TÌM CATEGORY
      // =========================

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("slug", categorySlug)
        .single();

      if (categoryError) {
        console.error("Lỗi category:", categoryError);

        setCategory(null);
        setProducts([]);

        return;
      }

      setCategory(categoryData);

      console.log("Category:", categoryData);

      // =========================
      // 2. LẤY SẢN PHẨM
      // =========================

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(
          `
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
        `,
        )
        .eq("category_id", categoryData.id)
        .order("id", { ascending: true });

      if (productError) {
        console.error("Lỗi products:", productError);

        setProducts([]);

        return;
      }

      console.log("Products:", productData);

      setProducts(productData || []);
    } catch (error) {
      console.error("Lỗi:", error);
      setCategory(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="product-wrap container">
        <p>Đang tải sản phẩm...</p>
      </main>
    );
  }

  // =========================
  // KHÔNG TÌM THẤY CATEGORY
  // =========================

  if (!category) {
    return (
      <main className="product-wrap container">
        <p>Không tìm thấy danh mục.</p>
      </main>
    );
  }

  return (
    <>
      {/* =========================
          BREADCRUMB
      ========================= */}

      <Breadcrumb
        items={[
          {
            label: "Sản phẩm",
            link: "/products",
          },
          {
            label: category.name,
          },
        ]}
      />

      {/* =========================
          PRODUCTS
      ========================= */}

      <main className="product-wrap container">
        {products.length === 0 ? (
          <p>Danh mục này chưa có sản phẩm.</p>
        ) : (
          <div className="products" id="category-products">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default ProductCategory;
