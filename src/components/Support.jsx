import { useEffect, useState } from "react";

function Support() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const startPosition = window.scrollY;
    const duration = 1000; // 1000ms = 1 giây
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Chậm lúc đầu, nhanh ở giữa, chậm dần khi tới đầu
      const ease = 1 - Math.pow(1 - progress, 3);

      window.scrollTo(0, startPosition * (1 - ease));

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  };

  return (
    <div className="support-floating">
      <a
        href="https://facebook.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="support-floating__item support-floating__facebook"
        aria-label="Facebook"
      >
        <i className="fa-brands fa-facebook-f"></i>
      </a>

      <a
        href="https://zalo.me/0862074660"
        target="_blank"
        rel="noopener noreferrer"
        className="support-floating__item support-floating__zalo"
        aria-label="Zalo"
      >
        <span>Zalo</span>
      </a>

      <a
        href="tel:0862074660"
        className="support-floating__item support-floating__phone"
        aria-label="Gọi hotline"
      >
        <i className="fa-solid fa-phone"></i>
      </a>

      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="support-floating__item support-floating__top"
          aria-label="Lên đầu trang"
        >
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      )}
    </div>
  );
}

export default Support;
