import { Link } from "react-router-dom";
import { getCloudinaryImageUrl } from "../utils/cloudinary";

function ProductCard({ product }) {
  const primaryImage =
    product.product_images?.find((image) => image.is_primary) ||
    product.product_images?.[0];

  const imageUrl = primaryImage
    ? getCloudinaryImageUrl(primaryImage.image_url, {
        width: 500,
        height: 500,
      })
    : "";

  return (
    <Link
      to={`/products/${product.categories?.slug}/${product.slug}`}
      className="card-product"
    >
      <div className="product-img">
        {primaryImage ? (
          <img src={imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span>Chưa có ảnh</span>
        )}

        <div className="product-view">
          <span>Xem sản phẩm</span>
          <i className="fas fa-arrow-right"></i>
        </div>
      </div>

      <div className="product-info">
        {product.categories?.name && (
          <span className="product-category">{product.categories.name}</span>
        )}

        <div className="product-title">
          <p>{product.name}</p>
        </div>

        <div className="product-price">
          <span>{Number(product.price).toLocaleString("vi-VN")}đ</span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
