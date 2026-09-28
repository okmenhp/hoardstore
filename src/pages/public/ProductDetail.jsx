import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs } from "swiper/modules";

import Breadcrumb from "../../components/Breadcrumb";
import "swiper/css";

function ProductDetail() {
  const { categorySlug, productSlug } = useParams();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [categorySlug, productSlug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setProduct(null);
      setRelatedProducts([]);
      setActiveImageIndex(0);

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
        .eq("slug", productSlug)
        .single();

      if (error) {
        console.error("Lỗi lấy sản phẩm:", error);
        setProduct(null);
        setLoading(false);
        return;
      }

      if (!data) {
        console.error("Không có dữ liệu sản phẩm.");
        setProduct(null);
        setLoading(false);
        return;
      }

      console.log("Sản phẩm tìm được:", data);
      console.log("Category trong DB:", data.categories?.slug);
      console.log("Category trên URL:", categorySlug);

      if (data.categories?.slug !== categorySlug) {
        console.error("Danh mục trên URL không khớp với danh mục sản phẩm.");

        setProduct(null);
        setLoading(false);
        return;
      }

      const sortedImages = [...(data.product_images || [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      );

      const productWithSortedImages = {
        ...data,
        product_images: sortedImages,
      };

      // Hiển thị sản phẩm ngay.
      // Không chờ sản phẩm liên quan.
      setProduct(productWithSortedImages);
      setLoading(false);

      // Lấy sản phẩm liên quan ở phía sau.
      fetchRelatedProducts(data);
    } catch (error) {
      console.error("Lỗi:", error);
      setProduct(null);
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (currentProduct) => {
    if (!currentProduct?.category_id) {
      return;
    }

    try {
      const { data: related, error: relatedError } = await supabase
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
        .eq("category_id", currentProduct.category_id)
        .neq("id", currentProduct.id);

      if (relatedError) {
        console.error("Lỗi lấy sản phẩm liên quan:", relatedError);

        setRelatedProducts([]);
        return;
      }

      const shuffled = [...(related || [])].sort(() => Math.random() - 0.5);

      setRelatedProducts(shuffled.slice(0, 6));
    } catch (error) {
      console.error("Lỗi lấy sản phẩm liên quan:", error);

      setRelatedProducts([]);
    }
  };

  if (loading) {
    return null;
  }

  if (!product) {
    return (
      <div className="container">
        <div className="product-not-found">
          <h2>Không tìm thấy sản phẩm</h2>

          <Link to="/products">Quay lại sản phẩm</Link>
        </div>
      </div>
    );
  }

  const images = [...(product.product_images || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  return (
    <>
      <Breadcrumb
        items={[
          {
            label: "Sản phẩm",
            link: "/products",
          },
          {
            label: product.categories?.name || "Danh mục",
            link: product.categories?.slug
              ? `/products/${product.categories.slug}`
              : "#",
          },
          {
            label: product.name,
          },
        ]}
      />

      <section className="product-detail-section">
        <div className="container">
          <div className="product-detail">
            {/* =========================
                GALLERY
            ========================= */}

            <div className="product-gallery">
              <Swiper
                className="product-main-slider"
                modules={[Thumbs]}
                spaceBetween={10}
                loop={false}
                thumbs={{
                  swiper:
                    thumbsSwiper && !thumbsSwiper.destroyed
                      ? thumbsSwiper
                      : null,
                }}
                onSlideChange={(swiper) => {
                  setActiveImageIndex(swiper.activeIndex);
                }}
              >
                {images.map((image, index) => (
                  <SwiperSlide key={image.id}>
                    <div className="product-main-image">
                      {index === activeImageIndex ? (
                        <img
                          src={image.image_url}
                          alt={product.name}
                          fetchPriority={index === 0 ? "high" : "auto"}
                        />
                      ) : (
                        <div className="product-main-image-placeholder" />
                      )}
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {images.length > 1 && (
                <Swiper
                  className="product-thumbs"
                  modules={[Thumbs]}
                  onSwiper={setThumbsSwiper}
                  spaceBetween={10}
                  slidesPerView={3}
                  watchSlidesProgress={true}
                  slideToClickedSlide={true}
                  breakpoints={{
                    480: {
                      slidesPerView: 4,
                    },
                    768: {
                      slidesPerView: 5,
                    },
                  }}
                >
                  {images.map((image) => (
                    <SwiperSlide key={image.id}>
                      <div className="product-thumb">
                        <img
                          src={image.image_url}
                          alt={product.name}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>

            {/* =========================
                PRODUCT INFO
            ========================= */}

            <div className="product-detail-info">
              <span className="product-detail-category">
                {product.categories?.name}
              </span>

              <h1>{product.name}</h1>

              <div className="product-detail-price">
                {Number(product.price).toLocaleString("vi-VN")}đ
              </div>

              <div className="product-detail-line"></div>

              {/* =========================
                  PRODUCT META
              ========================= */}

              <div className="product-meta">
                <div className="product-meta-item">
                  <span>Tình trạng</span>

                  <strong
                    style={{
                      color:
                        product.condition === "Hết hàng"
                          ? "#dc2626"
                          : product.condition === "Còn hàng"
                            ? "#16a34a"
                            : undefined,
                    }}
                  >
                    {product.condition || "Đang cập nhật"}
                  </strong>
                </div>

                <div className="product-meta-item">
                  <span>Kích thước</span>

                  <strong>{product.size || "Đang cập nhật"}</strong>
                </div>

                <div className="product-meta-item">
                  <span>Chất liệu</span>

                  <strong>{product.material || "Đang cập nhật"}</strong>
                </div>
              </div>

              <div className="product-description">
                <h3>Thông tin sản phẩm</h3>

                <p>
                  {product.content ||
                    product.description ||
                    "Nội dung đang cập nhật..."}
                </p>
              </div>

              {/* =========================
                  PROMOTION
              ========================= */}

              <div className="product-detail-promotion">
                <div className="promotion-title">
                  <i className="fa-solid fa-gift"></i>

                  <span>Chương trình khuyến mãi</span>
                </div>

                <ul>
                  <li>Miễn ship đơn hàng từ 500.000đ</li>

                  <li>Tặng kèm giá đỡ cho đơn hàng từ 300.000đ</li>
                </ul>
              </div>

              {/* =========================
                  CONTACT
              ========================= */}

              <a
                href="https://zalo.me/0862074660"
                target="_blank"
                rel="noreferrer"
                className="product-contact-btn"
              >
                <i className="fa-solid fa-comment"></i>

                <span>Liên hệ mua hàng qua Zalo</span>

                <i className="fa-solid fa-arrow-right"></i>
              </a>
            </div>

            {/* =========================
                COMMITMENT
            ========================= */}

            <div className="product-content">
              <div className="product-content-wrap">
                <div className="product-content-title">
                  <span></span>

                  <h2>HoardStore cam kết</h2>
                </div>

                <div className="commit-list">
                  <div className="commit-item">
                    <i className="fa-solid fa-check"></i>

                    <div>
                      <strong>Sản phẩm chính hãng</strong>

                      <p>Sản phẩm được kiểm tra kỹ trước khi gửi.</p>
                    </div>
                  </div>

                  <div className="commit-item">
                    <i className="fa-solid fa-check"></i>

                    <div>
                      <strong>Chất lượng đảm bảo</strong>

                      <p>
                        Đóng gói cẩn thận, hạn chế tối đa hư hỏng khi vận
                        chuyển.
                      </p>
                    </div>
                  </div>

                  <div className="commit-item">
                    <i className="fa-solid fa-check"></i>

                    <div>
                      <strong>Giá cả hợp lý</strong>

                      <p>Giá sản phẩm được cập nhật rõ ràng và minh bạch.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          RELATED PRODUCTS
      ========================= */}

      {relatedProducts.length > 0 && (
        <section className="related-products-section">
          <div className="container">
            <div className="categories">
              <p>SẢN PHẨM LIÊN QUAN</p>
            </div>

            <Swiper
              className="products__hot"
              spaceBetween={16}
              slidesPerView={2}
              breakpoints={{
                600: {
                  slidesPerView: 3,
                },

                1000: {
                  slidesPerView: 5,
                },
              }}
            >
              {relatedProducts.map((item) => {
                const primaryImage =
                  item.product_images?.find((image) => image.is_primary) ||
                  item.product_images?.[0];

                return (
                  <SwiperSlide key={item.id}>
                    <Link
                      to={`/products/${item.categories?.slug}/${item.slug}`}
                      className="card-product"
                    >
                      <div className="product-img">
                        {primaryImage ? (
                          <img
                            src={primaryImage.image_url}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span>Chưa có ảnh</span>
                        )}

                        <div className="product-view">
                          <span>Xem sản phẩm</span>

                          <i className="fas fa-arrow-right"></i>
                        </div>
                      </div>

                      <div className="product-info">
                        {item.categories?.name && (
                          <span className="product-category">
                            {item.categories.name}
                          </span>
                        )}

                        <div className="product-title">
                          <p>{item.name}</p>
                        </div>

                        <div className="product-price">
                          <span>
                            {Number(item.price).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </div>
                    </Link>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </section>
      )}
    </>
  );
}

export default ProductDetail;
