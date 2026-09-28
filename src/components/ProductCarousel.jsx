import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

function ProductCarousel({ products = [] }) {
  const [itemsPerView, setItemsPerView] = useState(2);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(6);
      } else if (window.innerWidth >= 768) {
        setItemsPerView(3);
      } else {
        setItemsPerView(2);
      }
    };

    updateItemsPerView();

    window.addEventListener("resize", updateItemsPerView);

    return () => {
      window.removeEventListener("resize", updateItemsPerView);
    };
  }, []);

  const maxIndex = Math.max(0, products.length - itemsPerView);

  useEffect(() => {
    if (products.length <= itemsPerView) return;

    const timer = setInterval(() => {
      setCurrent((prev) => {
        if (prev >= maxIndex) {
          return 0;
        }

        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [products.length, itemsPerView, maxIndex]);

  useEffect(() => {
    if (current > maxIndex) {
      setCurrent(0);
    }
  }, [current, maxIndex]);

  if (!products.length) {
    return null;
  }

  const nextSlide = () => {
    setCurrent((prev) => {
      if (prev >= maxIndex) {
        return 0;
      }

      return prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrent((prev) => {
      if (prev <= 0) {
        return maxIndex;
      }

      return prev - 1;
    });
  };

  const itemWidth = `calc((100% - ${(itemsPerView - 1) * 12}px) / ${itemsPerView})`;

  return (
    <div className="products__hot-carousel">
      <div
        className="products__hot-track"
        style={{
          transform: `translateX(calc(-${current} * (${itemWidth} + 12px)))`,
        }}
      >
        {products.map((product) => (
          <div
            className="products__hot-item"
            key={product.id}
            style={{
              flex: `0 0 ${itemWidth}`,
            }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {products.length > itemsPerView && (
        <>
          <button
            type="button"
            className="products__hot-prev"
            onClick={prevSlide}
          >
            ‹
          </button>

          <button
            type="button"
            className="products__hot-next"
            onClick={nextSlide}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

export default ProductCarousel;
