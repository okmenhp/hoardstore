import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("id", { ascending: true });

      if (error) {
        console.error("Lỗi lấy danh mục:", error);
        return;
      }

      setCategories(data || []);
    };

    fetchCategories();
  }, []);

  return (
    <footer>
      <div className="footer container">
        {/* Đăng ký nhận tin */}
        <div className="footer__form">
          <h2>Đăng ký nhận tin khuyến mại</h2>

          <h3>Cập Nhập Giá Và Các Sản Phẩm Mới Nhanh Nhất</h3>

          <p>Hỗ Trợ Bảo Hành Và Tư Vấn Chi Tiết</p>

          <form className="form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Mail" />

            <input type="tel" placeholder="Số điện thoại" />

            <button type="submit">Đăng ký</button>
          </form>
        </div>

        {/* Liên kết */}
        <div className="footer__links">
          <h2>Liên kết</h2>

          <div className="footer__links--content">
            <ul>
              <li>
                <Link to="/">Trang chủ</Link>
              </li>

              <li>
                <Link to="/products">Sản phẩm</Link>
              </li>

              <li>
                <Link to="#">Chính sách</Link>
              </li>

              <li>
                <Link to="#">Liên hệ</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Sản phẩm */}
        <div className="footer__links">
          <h2>Sản phẩm</h2>

          <div className="footer__links--content">
            <ul>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link to={`/products/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Thông tin khuyến mãi */}
        <div className="footer__links">
          <h2>Thông tin khuyễn mãi</h2>

          <div className="footer__links--content">
            <ul>
              <li>
                <Link to="#">Thông tin khuyến mãi</Link>
              </li>

              <li>
                <Link to="#">Sản phẩm khuyến mãi</Link>
              </li>

              <li>
                <Link to="#">Sản phẩm mới</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Hotline */}
        <div className="footer__hotline">
          <h2>Tổng đài hỗ trợ</h2>

          <div className="footer__hotline--content">
            <p>Mua hàng 086.207.4660</p>
            <p>Email hoardstore@gmail.com</p>
          </div>

          <div className="footer__hotliner--social">
            <h3>KẾT NỐI VỚI CHÚNG TÔI</h3>

            <div className="social-icons">
              <a href="#">
                <i className="fab fa-facebook-f"></i>
              </a>

              <a href="#">
                <i className="fab fa-twitter"></i>
              </a>

              <a href="#">
                <i className="fab fa-google-plus-g"></i>
              </a>

              <a href="#">
                <i className="fab fa-instagram"></i>
              </a>

              <a href="#">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="copyright">
        <h1>Copyright © 2026 HoardStore. All rights reserved.</h1>
      </div>
    </footer>
  );
}

export default Footer;
