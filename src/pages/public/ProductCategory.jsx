import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { supabase } from "../../lib/supabaseClient";
import ProductCard from "../../components/ProductCard";
import Breadcrumb from "../../components/Breadcrumb";

const PAGE_SIZE = 24;

// Chỉ lấy cột cần cho ProductCard,
// tránh tải thừa dữ liệu khi danh sách lớn
const PRODUCT_SELECT = `
  id,
  name,
  slug,
  price,
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
`;

// =====================================================
// CACHE GIỮ DANH SÁCH KHI BẤM "QUAY LẠI"
// -----------------------------------------------------
// Lưu ngoài component nên không bị mất khi chuyển sang
// trang chi tiết. Key là slug danh mục.
// =====================================================
const categoryCache = {};

function ProductCategory() {
  const { categorySlug } = useParams();

  // Đã từng tải danh mục này thì dùng lại cache
  // thay vì fetch lại từ đầu khi bấm "quay lại".
  const cached = categoryCache[categorySlug];

  const [category, setCategory] = useState(cached ? cached.category : null);
  const [products, setProducts] = useState(cached ? cached.products : []);
  const [loading, setLoading] = useState(cached ? false : true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(cached ? cached.hasMore : true);

  const sentinelRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const hit = categoryCache[categorySlug];
    if (hit) {
      // Có cache: dùng lại danh sách đã tải,
      // khôi phục đúng vị trí đang cuộn dở.
      setCategory(hit.category);
      setProducts(hit.products);
      setHasMore(hit.hasMore);
      setLoading(false);

      // Khôi phục vị trí cuộn cũ. Chỉ tự cuộn khi có vị trí đã lưu
      // đáng tin (> 100). Nếu không lưu được, để trình duyệt tự
      // khôi phục (native) — tránh tự cuộn sai về đầu trang.
      const targetY = hit.scrollY || 0;
      if (targetY > 100) {
        let attempts = 0;
        let timer = 0;
        const tryScroll = () => {
          attempts++;
          if (window.scrollY < targetY - 50) {
            window.scrollTo(0, targetY);
          }
          const settled = window.scrollY >= targetY - 50;
          if (!settled && attempts < 15) {
            timer = window.setTimeout(tryScroll, 200);
          }
        };
        timer = window.setTimeout(tryScroll, 80);
        return () => window.clearTimeout(timer);
      }
      return undefined;
    }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug]);

  // Lưu vị trí đang cuộn (kể cả khi cuộn lên đầu trang),
  // để bấm "quay lại" khôi phục đúng chỗ đang xem
  useEffect(() => {
    const saveScroll = () => {
      const entry = categoryCache[categorySlug];
      if (entry) {
        entry.scrollY = window.scrollY;
      }
    };
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => {
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
    };
  }, [categorySlug]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setProducts([]);
      setHasMore(true);

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

      // =========================
      // 2. LẤY SẢN PHẨM (TRANG ĐẦU)
      // =========================

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("category_id", categoryData.id)
        .order("id", { ascending: true })
        .range(0, PAGE_SIZE - 1);

      if (productError) {
        console.error("Lỗi products:", productError);

        setProducts([]);

        return;
      }

      const formatted = formatProducts(productData);

      setProducts(formatted);
      setHasMore(formatted.length === PAGE_SIZE);

      // Lưu vào cache để bấm "quay lại" không phải tải lại.
      // Lấy luôn vị trí cuộn hiện tại (phòng khi bạn đã cuộn
      // trong lúc danh sách đang tải, mạng chậm).
      categoryCache[categorySlug] = {
        category: categoryData,
        products: formatted,
        hasMore: formatted.length === PAGE_SIZE,
        scrollY: window.scrollY || 0,
      };
    } catch (error) {
      console.error("Lỗi:", error);
      setCategory(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatProducts = (data) =>
    (data || []).map((product) => ({
      ...product,

      product_images: [...(product.product_images || [])].sort(
        (a, b) =>
          (a.sort_order == null ? 0 : a.sort_order) -
          (b.sort_order == null ? 0 : b.sort_order),
      ),
    }));

  const loadMore = async () => {
    if (loadingMore || !hasMore || !category) return;

    setLoadingMore(true);

    try {
      const from = products.length;

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("category_id", category.id)
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (productError) {
        console.error("Lỗi tải thêm sản phẩm:", productError);
        return;
      }

      const formatted = formatProducts(productData);
      const merged = [...products, ...formatted];

      setProducts(merged);
      setHasMore(formatted.length === PAGE_SIZE);

      // Cập nhật cache với danh sách mới
      const prevCache = categoryCache[categorySlug] || {};
      categoryCache[categorySlug] = {
        category: category,
        products: merged,
        hasMore: formatted.length === PAGE_SIZE,
        scrollY: window.scrollY || prevCache.scrollY || 0,
      };
    } catch (error) {
      console.error("Lỗi:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Luôn trỏ tới bản loadMore mới nhất để observer không bị stale
  loadMoreRef.current = loadMore;

  // iOS: lưu vị trí NGAY lúc chạm vào (trước khi chuyển trang),
  // vì Safari không bắn sự kiện scroll kịp lúc vuốt nhanh
  useEffect(() => {
    const saveOnTap = () => {
      const entry = categoryCache[categorySlug];
      if (entry) {
        entry.scrollY = window.scrollY;
      }
    };
    document.addEventListener("click", saveOnTap, {
      capture: true,
      passive: true,
    });
    document.addEventListener("touchend", saveOnTap, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener("click", saveOnTap, { capture: true });
      document.removeEventListener("touchend", saveOnTap, { capture: true });
    };
  }, [categorySlug]);

  // Dự phòng cho iOS: nếu IntersectionObserver không kích hoạt,
  // dùng sự kiện cuộn để tải thêm khi gần cuối trang
  useEffect(() => {
    if (!hasMore || loading) return;

    const onScrollNearBottom = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 800;
      if (nearBottom && loadMoreRef.current) {
        loadMoreRef.current();
      }
    };

    window.addEventListener("scroll", onScrollNearBottom, { passive: true });
    return () => window.removeEventListener("scroll", onScrollNearBottom);
  }, [hasMore, loading]);

  // Tự động tải thêm khi cuộn gần tới cuối danh sách.
  // Chạy lại mỗi khi danh sách đổi để chắc chắn gắn được
  // vào thẻ sentinel (lúc mới mở trang thẻ này chưa có).
  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && loadMoreRef.current) {
          loadMoreRef.current();
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, products.length]);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="product-wrap container">
        <div className="products-loading">
          <div className="products-loading__spinner"></div>
        </div>
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
          <>
            <div className="products" id="category-products">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Tự tải thêm khi cuộn tới đây, không dùng nút bấm */}
            {hasMore && (
              <div ref={sentinelRef} style={{ minHeight: "60px" }}>
                {loadingMore && (
                  <div className="products-loading">
                    <div className="products-loading__spinner"></div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default ProductCategory;
