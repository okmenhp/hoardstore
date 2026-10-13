import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import ProductCard from "../../components/ProductCard";

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
// trang chi tiết. Key là từ khóa tìm kiếm.
// =====================================================
const listCache = {};

function Products() {
  const [searchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const keyword = search.trim();

  // Đã từng tải danh sách cho từ khóa này thì dùng lại
  // cache thay vì fetch lại từ đầu khi bấm "quay lại".
  const cached = listCache[keyword];

  const [products, setProducts] = useState(cached ? cached.products : []);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(cached ? false : true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(cached ? cached.hasMore : true);

  const sentinelRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const hit = listCache[keyword];
    if (hit) {
      // Có cache: dùng lại danh sách đã tải,
      // khôi phục đúng vị trí đang cuộn dở.
      setProducts(hit.products);
      setHasMore(hit.hasMore);
      setError(null);
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
    getProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // Lưu vị trí đang cuộn (kể cả khi cuộn lên đầu trang),
  // để bấm "quay lại" khôi phục đúng chỗ đang xem
  useEffect(() => {
    const saveScroll = () => {
      const entry = listCache[keyword];
      if (entry) {
        entry.scrollY = window.scrollY;
      }
    };
    window.addEventListener("scroll", saveScroll, { passive: true });
    return () => {
      saveScroll();
      window.removeEventListener("scroll", saveScroll);
    };
  }, [keyword]);

  function formatProducts(data) {
    return (data || []).map((product) => ({
      ...product,

      product_images: [...(product.product_images || [])].sort(
        (a, b) =>
          (a.sort_order == null ? 0 : a.sort_order) -
          (b.sort_order == null ? 0 : b.sort_order),
      ),
    }));
  }

  function buildQuery(from, to) {
    let query = supabase.from("products").select(PRODUCT_SELECT);

    if (keyword) {
      query = query.ilike("name", `%${keyword}%`);
    }

    query = query.order("id", { ascending: true }).range(from, to);

    return query;
  }

  async function getProducts() {
    setError(null);
    setLoading(true);
    setProducts([]);
    setHasMore(true);

    try {
      const { data, error: supabaseError } = await buildQuery(0, PAGE_SIZE - 1);

      if (supabaseError) {
        console.error("Lỗi lấy sản phẩm:", supabaseError);
        setError(supabaseError.message);
        setProducts([]);
        return;
      }

      const formattedProducts = formatProducts(data);

      setProducts(formattedProducts);
      setHasMore(formattedProducts.length === PAGE_SIZE);

      // Lưu vào cache để bấm "quay lại" không phải tải lại.
      // Lấy luôn vị trí cuộn hiện tại (phòng khi bạn đã cuộn
      // trong lúc danh sách đang tải, mạng chậm).
      listCache[keyword] = {
        products: formattedProducts,
        hasMore: formattedProducts.length === PAGE_SIZE,
        scrollY: window.scrollY || 0,
      };
    } catch (err) {
      console.error("Lỗi không xác định:", err);
      setError("Không thể tải danh sách sản phẩm.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const from = products.length;

      const { data, error: supabaseError } = await buildQuery(
        from,
        from + PAGE_SIZE - 1,
      );

      if (supabaseError) {
        console.error("Lỗi tải thêm sản phẩm:", supabaseError);
        return;
      }

      const formattedProducts = formatProducts(data);
      const merged = [...products, ...formattedProducts];

      setProducts(merged);
      setHasMore(formattedProducts.length === PAGE_SIZE);

      // Cập nhật cache với danh sách mới
      const prevCache = listCache[keyword] || {};
      listCache[keyword] = {
        products: merged,
        hasMore: formattedProducts.length === PAGE_SIZE,
        scrollY: window.scrollY || prevCache.scrollY || 0,
      };
    } catch (err) {
      console.error("Lỗi không xác định:", err);
    } finally {
      setLoadingMore(false);
    }
  }

  // Luôn trỏ tới bản loadMore mới nhất để observer không bị stale
  // Luôn trỏ tới bản loadMore mới nhất để observer không bị stale
  loadMoreRef.current = loadMore;

  // iOS: lưu vị trí NGAY lúc chạm vào (trước khi chuyển trang),
  // vì Safari không bắn sự kiện scroll kịp lúc vuốt nhanh
  useEffect(() => {
    const saveOnTap = () => {
      const entry = listCache[keyword];
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
  }, [keyword]);

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

        {loading ? (
          <div className="products-loading">
            <div className="products-loading__spinner"></div>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="products">
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
        ) : (
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
