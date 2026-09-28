import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hideContact, setHideContact] = useState(false);

  const [categories, setCategories] = useState([]);

  const navigate = useNavigate();

  // =========================
  // REF
  // =========================

  const navRef = useRef(null);
  const hamburgerRef = useRef(null);
  const searchRef = useRef(null);

  // =========================
  // ẨN CONTACT KHI CUỘN
  // =========================

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setHideContact(true);
      } else {
        setHideContact(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // =========================
  // LẤY CATEGORY TỪ SUPABASE
  // =========================

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

  // =========================
  // ĐÓNG MENU
  // =========================

  const closeMenu = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  // =========================
  // CLICK RA NGOÀI NAV
  // =========================

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!menuOpen) return;

      if (navRef.current?.contains(e.target)) {
        return;
      }

      if (hamburgerRef.current?.contains(e.target)) {
        return;
      }

      setMenuOpen(false);
      setDropdownOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // =========================
  // CLICK RA NGOÀI SEARCH
  // =========================

  useEffect(() => {
    const handleClickOutsideSearch = (e) => {
      if (!searchOpen) return;

      // Click bên trong icon hoặc search box
      if (searchRef.current?.contains(e.target)) {
        return;
      }

      // Click bên ngoài
      setSearchOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutsideSearch);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideSearch);
    };
  }, [searchOpen]);

  // =========================
  // DROPDOWN MOBILE
  // =========================

  const handleDropdownClick = (e) => {
    e.preventDefault();

    if (window.innerWidth < 1024) {
      setDropdownOpen((prev) => !prev);
    }
  };

  // =========================
  // SEARCH
  // =========================

  const handleSearch = (e) => {
    e.preventDefault();

    const keyword = search.trim();

    if (!keyword) return;

    navigate(`/products?search=${encodeURIComponent(keyword)}`);

    setSearchOpen(false);
    setSearch("");
  };

  return (
    <header className={`header ${hideContact ? "hide-contact" : ""}`}>
      {/* =========================
          CONTACT
      ========================= */}

      <div className="header__contact container">
        <p>Liên hệ 086.207.4660</p>
        <p>Miễn phí ship đơn hàng 500.000đ</p>
      </div>

      {/* =========================
          HEADER CONTENT
      ========================= */}

      <div className="header__content container">
        {/* =========================
            LOGO
        ========================= */}

        <div className="logo">
          <Link to="/" onClick={closeMenu}>
            <img
              src="/image/logo.png"
              alt="HoardStore"
              width="45"
              height="39"
            />
          </Link>

          <Link to="/" className="logo-text" onClick={closeMenu}>
            HOARDSTORE
          </Link>
        </div>

        {/* =========================
            NAVIGATION
        ========================= */}

        <nav ref={navRef} className={`nav ${menuOpen ? "nav--open" : ""}`}>
          <ul className="nav__list">
            {/* TRANG CHỦ */}

            <li className="nav__item">
              <NavLink to="/" end className="nav__link" onClick={closeMenu}>
                Trang chủ
              </NavLink>
            </li>

            {/* GIỚI THIỆU */}

            <li className="nav__item">
              <NavLink to="/about" className="nav__link" onClick={closeMenu}>
                Giới thiệu
              </NavLink>
            </li>

            {/* SẢN PHẨM */}

            <li
              className={`nav__item dropdown ${
                dropdownOpen ? "dropdown--open" : ""
              }`}
            >
              <Link
                to="#"
                className="nav__link dropdown__toggle"
                onClick={handleDropdownClick}
              >
                <span>Sản phẩm</span>

                <i
                  className={`fa fa-chevron-down ${
                    dropdownOpen ? "rotate" : ""
                  }`}
                ></i>
              </Link>

              {/* DROPDOWN CATEGORY */}

              <ul className="dropdown__content">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link to={`/products/${category.slug}`} onClick={closeMenu}>
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            {/* LIÊN HỆ */}

            <li className="nav__item">
              <Link to="/contact" className="nav__link">
                Liên hệ
              </Link>
            </li>
          </ul>
        </nav>

        {/* =========================
            ICONS
        ========================= */}

        <div className="nav__icon">
          {/* SEARCH WRAPPER */}

          <div ref={searchRef} className="search-wrapper">
            {/* SEARCH ICON */}

            <div
              className="search"
              onClick={() => setSearchOpen((prev) => !prev)}
            >
              <i className="fas fa-search search-icon"></i>
            </div>

            {/* SEARCH DROPDOWN */}

            <div className={`search-dropdown ${searchOpen ? "active" : ""}`}>
              <p className="search-title">TÌM KIẾM</p>

              <span></span>

              <form className="search-box" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <button type="submit">
                  <i className="fas fa-search search-icon-input"></i>
                </button>
              </form>
            </div>
          </div>

          {/* HAMBURGER */}

          <div
            ref={hamburgerRef}
            className={`hamburger ${menuOpen ? "hamburger--open" : ""}`}
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setDropdownOpen(false);
            }}
          >
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
