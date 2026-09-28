import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import ProductCard from "../../components/ProductCard";

function Products() {
  const [products, setProducts] = useState([]);
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  const search = searchParams.get("search") || "";

  useEffect(() => {
    getProducts();
  }, [search]);

  async function getProducts() {
    setError(null);

    if (!search.trim()) {
      setProducts([]);
      return;
    }

    const { data, error } = await supabase
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
      .ilike("name", `%${search.trim()}%`)
      .order("id", { ascending: true });

    if (error) {
      console.error(error);
      setError(error.message);
      return;
    }

    const formattedProducts = (data || []).map((product) => ({
      ...product,
      product_images: [...(product.product_images || [])].sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    }));

    setProducts(formattedProducts);
  }

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

  return (
    <main className="products-page">
      <div className="search-results container">
        <div className="search-results__top">
          <p>
            Có {products.length} kết quả tìm kiếm với từ khóa{" "}
            <strong>"{search}"</strong>
          </p>
        </div>

        {products.length > 0 ? (
          <div className="products">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="products-empty">
            <div className="products-empty__icon"></div>

            <h2>Không tìm thấy sản phẩm</h2>
          </div>
        )}
      </div>
    </main>
  );
}

export default Products;
